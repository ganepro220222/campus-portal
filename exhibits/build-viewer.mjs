import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assetFingerprint, deploymentFileHash } from './pano-check.mjs'
import { buildBundledViewer, VIEWER_BUNDLE_FILE, validateBundledViewerHtml } from './build-viewer-bundle.mjs'

export { VIEWER_BUNDLE_FILE }

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(ROOT, 'player.view.html')
const SRC = path.join(ROOT, 'player.html')
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

export const VIEWER_LIGHT_RIG_IMPORTS = [
  'LIGHT_KEYS',
  'LIGHT_DEFAULTS',
  'SHADOW_CASTER',
  'ENV_PRESETS',
  'defaultPosition',
  'effectiveIntensity',
  'resolveShadow',
  'shadowWillLand',
  'resolveEnvSource',
  'createEnvLoadGuard',
]

/** 观看版 player-persist 白名单。漏掉观看端实际调用的符号会在运行时变成 ReferenceError。 */
export const VIEWER_PERSIST_IMPORTS = [
  'configFetchUrl',
  'configTimeoutMs',
  'modelIdleTimeoutMs',
  'modelTotalTimeoutMs',
  'panoramaRevealTimeoutMs',
  'fitCameraDistance',
  'portraitFillTarget',
  'shouldAutoFitCamera',
  'createModelLoadTimers',
  'strictWebKitPanoramaMaxWidth',
  'DEFAULT_STRICT_WEBKIT_PANORAMA_MAX_WIDTH',
  'resolveRendererQuality',
]

const UPLOAD_DIR = path.join(ROOT, '..', 'exhibits-upload')
const UPLOAD_OUT = path.join(UPLOAD_DIR, 'player.view.html')
const EXHIBIT_INDEX_TEMPLATE = path.join(ROOT, '_template/index.html')

/** 部署包须同步的 JS 模块（.mjs 源 → .js 副本；leader-geom 仅 .js） */
export const UPLOAD_JS_COPIES = [
  ['hotspot-id.mjs', 'hotspot-id.js'],
  ['player-persist.mjs', 'player-persist.js'],
  ['light-rig.mjs', 'light-rig.js'],
  ['material-override.mjs', 'material-override.js'],
  ['leader-geom.js', 'leader-geom.js'],
]

/** 各展品目录内随 --upload 同步的轻量文件（不含 assets/ 大资源） */
export const UPLOAD_EXHIBIT_FILES = ['config.json', 'index.html']

/** viewer 启动必需的 vendor 文件（import map + Draco/Basis 解码器） */
export const UPLOAD_VENDOR_REQUIRED = [
  'vendor/three.module.js',
  'vendor/addons/loaders/GLTFLoader.js',
  'vendor/addons/loaders/DRACOLoader.js',
  'vendor/addons/loaders/KTX2Loader.js',
  'vendor/draco/draco_decoder.js',
  'vendor/draco/draco_wasm_wrapper.js',
  'vendor/draco/draco_decoder.wasm',
  'vendor/basis/basis_transcoder.js',
  'vendor/basis/basis_transcoder.wasm',
]

/** 合伙人站点（仅文件管理器）上传包：只保留观看端播放器，不含 craft / 说明 txt */
export const PLAYER_ONLY_UPLOAD_FILES = [
  'player.view.html',
  VIEWER_BUNDLE_FILE,
]

const VIEWER_FORBIDDEN = [
  'bootstrapHotspotIds',
  'hotspotIdBootAudit',
  'hotspotIdBootChanges',
  'formatHotspotIdChanges',
  'mergeHotspotIdChanges',
  'hotspotBootAuditHadIssues',
  'nextHotspotId',
]

export function importsFromSource(text) {
  const out = []
  for (const m of text.matchAll(/import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g)) out.push(m[1])
  for (const m of text.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push(m[1])
  return out
}

export function importsFromHtml(html) {
  return importsFromSource(html)
}

export function resolveHtmlImport(fromDir, spec) {
  if (!spec.startsWith('./') && !spec.startsWith('../')) return null
  let base = path.resolve(fromDir, spec)
  if (fs.existsSync(base)) return base
  for (const ext of ['.mjs', '.js']) {
    if (fs.existsSync(base + ext)) return base + ext
  }
  return base
}

/** 校验 HTML 中相对 import 在磁盘上均存在 */
export function checkHtmlImports(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8')
  const fromDir = path.dirname(htmlPath)
  const missing = []
  for (const spec of importsFromHtml(html)) {
    if (!spec.startsWith('./') && !spec.startsWith('../')) continue
    const target = resolveHtmlImport(fromDir, spec)
    if (!target || !fs.existsSync(target)) missing.push(spec)
  }
  return missing
}

/** 从 import map 提取相对路径（three 等 bare spec 不在此列） */
export function importMapRelativeSpecs(html) {
  return Object.values(parseImportMap(html).imports || {})
    .filter(s => typeof s === 'string' && (s.startsWith('./') || s.startsWith('../')))
}

export function parseImportMap(html) {
  const m = html.match(/<script type="importmap">\s*(\{[\s\S]*?\})\s*<\/script>/)
  if (!m) return { imports: {} }
  try { return JSON.parse(m[1]) } catch { return { imports: {} } }
}

export function resolveBareImport(spec, htmlDir, importMap) {
  const imports = importMap.imports || {}
  if (imports[spec]) return path.resolve(htmlDir, imports[spec])
  const keys = Object.keys(imports).filter(k => k.endsWith('/')).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (spec.startsWith(key)) return path.resolve(htmlDir, imports[key] + spec.slice(key.length))
  }
  return null
}

export function resolveModuleSpec(spec, fromFile, htmlDir, importMap) {
  if (spec.startsWith('./') || spec.startsWith('../')) {
    return resolveHtmlImport(path.dirname(fromFile), spec)
  }
  const bare = resolveBareImport(spec, htmlDir, importMap)
  if (!bare) return null
  if (fs.existsSync(bare)) return bare
  for (const ext of ['.mjs', '.js']) {
    if (fs.existsSync(bare + ext)) return bare + ext
  }
  return bare
}

/** 从 player HTML 内联 module + 递归 JS import 遍历依赖图；bundled viewer 只校验 bundle 文件。 */
function walkModuleGraph(htmlPath, rootDir) {
  const html = fs.readFileSync(htmlPath, 'utf8')
  const bundleRef = html.match(/<script type="module"\s+src="\.\/([^"]+)"/)
  if (bundleRef) {
    const rel = bundleRef[1]
    const abs = path.join(rootDir, rel)
    return {
      missing: fs.existsSync(abs) ? [] : [rel],
      files: fs.existsSync(abs) ? [abs] : [],
    }
  }
  const htmlDir = path.dirname(htmlPath)
  const importMap = parseImportMap(html)
  const missing = []
  const seen = new Set()
  const queue = []

  for (const spec of importsFromSource(html)) {
    const resolved = resolveModuleSpec(spec, htmlPath, htmlDir, importMap)
    if (resolved) queue.push(resolved)
    else if (!spec.startsWith('.')) missing.push(spec)
  }

  while (queue.length) {
    const file = queue.shift()
    if (seen.has(file)) continue
    seen.add(file)
    if (!fs.existsSync(file)) {
      missing.push(path.relative(rootDir, file).replace(/\\/g, '/'))
      continue
    }
    if (!/\.(m?js)$/.test(file)) continue
    for (const spec of importsFromSource(fs.readFileSync(file, 'utf8'))) {
      const resolved = resolveModuleSpec(spec, file, htmlDir, importMap)
      if (resolved) queue.push(resolved)
      else if (spec.startsWith('.')) missing.push(`${spec} (from ${path.basename(file)})`)
    }
  }
  return { missing: [...new Set(missing)], files: [...seen] }
}

/** 相对 rootDir 列出 HTML module 图内已解析的本地文件。 */
export function listModuleGraphFiles(htmlPath, rootDir) {
  return walkModuleGraph(htmlPath, rootDir).files
    .filter(f => fs.existsSync(f))
    .map(f => path.relative(rootDir, f).replace(/\\/g, '/'))
    .sort()
}

/** staging 编辑器路径清单（无 esbuild 依赖，ECS collector 用） */
export {
  collectStagingEditorRelPaths,
  collectStagingExhibitsCheckoutPaths,
  STAGING_EXHIBITS_CODE_EXTRA,
  STAGING_EDITOR_STATIC_DIRS,
} from './staging-editor-paths.mjs'

/** 从 player HTML 内联 module + 递归 JS import 收集缺失模块；bundled viewer 只校验 bundle 文件。 */
export function collectModuleGraph(htmlPath, uploadDir) {
  return walkModuleGraph(htmlPath, uploadDir).missing
}

/** 校验 upload 目录具备 viewer 运行时依赖（vendor + 模块依赖图） */
export function checkUploadRuntimeDeps(uploadDir, htmlPath) {
  const missing = []
  for (const rel of UPLOAD_VENDOR_REQUIRED) {
    if (!fs.existsSync(path.join(uploadDir, rel))) missing.push(rel)
  }
  if (htmlPath && fs.existsSync(htmlPath)) {
    missing.push(...collectModuleGraph(htmlPath, uploadDir))
  }
  return [...new Set(missing)]
}

function isRemoteAssetRef(p) {
  return !p || /^https?:\/\//i.test(p) || p.startsWith('//') || p.startsWith('data:') || p.startsWith('blob:')
}

function resolveAssetPath(rootDir, exhibitDir, assetPath) {
  if (isRemoteAssetRef(assetPath)) return null
  const root = path.resolve(rootDir)
  let abs
  if (assetPath.startsWith('/')) abs = path.resolve(root, assetPath.slice(1).replace(/^\/+/, ''))
  else abs = path.resolve(exhibitDir, assetPath)
  if (abs !== root && !abs.startsWith(root + path.sep)) return null
  return abs
}

/** All craft-* exhibit directories under root (config.json not required). */
export function listSourceCraftDirs(root = ROOT) {
  const out = []
  for (const name of fs.readdirSync(root)) {
    if (!name.startsWith('craft-') || name.startsWith('_')) continue
    const srcDir = path.join(root, name)
    try {
      if (!fs.statSync(srcDir).isDirectory()) continue
    } catch { continue }
    out.push(name)
  }
  return out.sort()
}

/** Source crafts that already have a config.json file (not audited for validity). */
export function listSourceExhibits(root = ROOT) {
  return listSourceCraftDirs(root).filter(name => fs.existsSync(path.join(root, name, 'config.json')))
}

/** Minimum schema for deployable exhibit config. */
export function validateSourceExhibitConfig(name, cfg) {
  const errors = []
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) {
    errors.push(`${name}/config.json: must be a JSON object`)
    return errors
  }
  const model = cfg.assets?.model
  if (typeof model !== 'string' || !String(model).trim()) {
    errors.push(`${name}/config.json: missing assets.model`)
  }
  return errors
}

/** Parse and validate all source craft configs once before upload. */
export function auditSourceExhibits(root = ROOT) {
  const craftDirs = listSourceCraftDirs(root)
  const exhibits = []
  const errors = []
  for (const name of craftDirs) {
    const cfgPath = path.join(root, name, 'config.json')
    const idxPath = path.join(root, name, 'index.html')
    let cfg = null
    let configOk = false
    let indexOk = false

    if (!fs.existsSync(cfgPath)) {
      errors.push(`${name}/config.json: missing`)
    } else {
      let st
      try {
        st = fs.statSync(cfgPath)
      } catch (e) {
        errors.push(`${name}/config.json: ${e.message}`)
      }
      if (st && !st.isFile()) {
        errors.push(`${name}/config.json: must be a regular file`)
      } else if (st?.isFile()) {
        try {
          cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
          const schemaErrs = validateSourceExhibitConfig(name, cfg)
          if (schemaErrs.length) errors.push(...schemaErrs)
          else configOk = true
        } catch (e) {
          errors.push(`${name}/config.json: ${e.message}`)
        }
      }
    }

    if (!fs.existsSync(idxPath)) {
      errors.push(`${name}/index.html: missing`)
    } else {
      try {
        const st = fs.statSync(idxPath)
        if (!st.isFile()) errors.push(`${name}/index.html: must be a regular file`)
        else indexOk = true
      } catch (e) {
        errors.push(`${name}/index.html: ${e.message}`)
      }
    }

    if (configOk && indexOk && cfg) exhibits.push({ name, cfg })
  }
  return { ok: errors.length === 0, exhibits, errors, craftDirs }
}

/** craft-* dirs present in an upload tree (have config.json). */
export function listUploadExhibits(uploadDir) {
  const out = []
  if (!fs.existsSync(uploadDir)) return out
  for (const name of fs.readdirSync(uploadDir)) {
    if (!name.startsWith('craft-') || name.startsWith('_')) continue
    const dir = path.join(uploadDir, name)
    try {
      if (!fs.statSync(dir).isDirectory()) continue
    } catch { continue }
    if (fs.existsSync(path.join(dir, 'config.json'))) out.push(name)
  }
  return out.sort()
}

/** Upload crafts whose source craft directory no longer exists (retired exhibits). */
export function orphanUploadExhibits(uploadDir, sourceCraftDirs = listSourceCraftDirs()) {
  const sourceSet = new Set(sourceCraftDirs)
  return listUploadExhibits(uploadDir).filter(name => !sourceSet.has(name))
}

/** Remove upload crafts absent from source (use with --upload-prune). */
export function pruneUploadExhibits(uploadDir, sourceCraftDirs = listSourceCraftDirs()) {
  const removed = []
  for (const name of orphanUploadExhibits(uploadDir, sourceCraftDirs)) {
    fs.rmSync(path.join(uploadDir, name), { recursive: true, force: true })
    removed.push(name)
  }
  return removed
}

/** 仅文件管理器上传：删掉 craft-*、共享资源、说明文档等，只留 player + vendor */
export function pruneUploadToPlayerOnly(uploadDir) {
  const removed = []
  if (!fs.existsSync(uploadDir)) return removed
  for (const name of fs.readdirSync(uploadDir)) {
    if (name === 'vendor') continue
    if (PLAYER_ONLY_UPLOAD_FILES.includes(name)) continue
    if (isUploadScratchName(name)) {
      fs.rmSync(path.join(uploadDir, name), { recursive: true, force: true })
      removed.push(name)
      continue
    }
    fs.rmSync(path.join(uploadDir, name), { recursive: true, force: true })
    removed.push(name)
  }
  return removed
}

/** 校验 upload 中 config 引用的本地资源：model 缺失/过期阻断，poster/panorama 仅 warning */
export function verifyUploadAssets(uploadDir = UPLOAD_DIR, sourceExhibits = null) {
  const present = []
  const errors = []
  const warnings = []
  let exhibits = sourceExhibits
  if (!exhibits) {
    const audit = auditSourceExhibits()
    if (!audit.ok) return { ok: false, present, errors: audit.errors, warnings }
    exhibits = audit.exhibits
  }
  for (const { name, cfg } of exhibits) {
    const srcExhibitDir = path.join(ROOT, name)
    const uploadExhibitDir = path.join(uploadDir, name)
    for (const key of ['model', 'poster', 'panorama']) {
      const ref = cfg?.assets?.[key]
      if (!ref || isRemoteAssetRef(ref)) continue
      const srcAbs = resolveAssetPath(ROOT, srcExhibitDir, ref)
      const dstAbs = resolveAssetPath(uploadDir, uploadExhibitDir, ref)
      const label = `${name}/assets.${key} (${ref})`
      if (!srcAbs || !fs.existsSync(srcAbs)) {
        if (key === 'model') errors.push(`source missing model: ${label}`)
        else warnings.push(`source missing ${key}: ${label}`)
        continue
      }
      if (!dstAbs) continue
      if (!fs.existsSync(dstAbs)) {
        if (key === 'model') errors.push(`missing model: ${label}`)
        else warnings.push(`missing ${key}: ${label}`)
        continue
      }
      present.push(label)
      const fp = (key === 'model') ? deploymentFileHash : assetFingerprint
      const srcFp = fp(srcExhibitDir, ref, ROOT)
      const dstFp = fp(uploadExhibitDir, ref, uploadDir)
      if (srcFp && dstFp && srcFp !== dstFp) {
        const msg = `stale ${key} (source changed): ${label}`
        if (key === 'model') errors.push(msg)
        else warnings.push(msg)
      }
    }
  }
  return { ok: errors.length === 0, present, errors, warnings }
}

/** Bundled production viewer loads player.bundle.js instead of import map + inline module. */
export function viewerUsesBundle(html) {
  return html.includes(`src="./${VIEWER_BUNDLE_FILE}"`)
}

/** 写入 upload 前的预检：可选先同步资产/模块，再校验资源与运行时依赖（不写 viewer/config） */
export function runUploadPreflight(uploadDir, uploadHtml, { uploadAssets: doAssets = false, syncModules: doModules = null, sourceExhibits = null, skipAssetVerify = false } = {}) {
  if (doAssets) syncUploadAssets(uploadDir, sourceExhibits)
  const useBundle = viewerUsesBundle(uploadHtml)
  if (doModules === null) doModules = !useBundle
  if (doModules) syncUploadModules(uploadDir)
  const assets = skipAssetVerify
    ? { ok: true, present: [], errors: [], warnings: [] }
    : verifyUploadAssets(uploadDir, sourceExhibits)
  if (!assets.ok) return { ok: false, stage: 'assets', assets }
  const tmpHtml = path.join(uploadDir, '.preflight-player.view.html.tmp')
  fs.writeFileSync(tmpHtml, uploadHtml, 'utf8')
  try {
    const missingImports = checkHtmlImports(tmpHtml)
    if (missingImports.length) return { ok: false, stage: 'imports', missing: missingImports, assets }
    const missingRuntime = checkUploadRuntimeDeps(uploadDir, tmpHtml)
    if (missingRuntime.length) return { ok: false, stage: 'runtime', missing: missingRuntime, assets }
  } finally {
    try { fs.unlinkSync(tmpHtml) } catch { /* ignore */ }
  }
  return { ok: true, assets }
}

export function uploadStagingDirName() {
  return `.staging-${process.pid}`
}

/** Scratch dir basename suffix: `<uploadBase>.staging-<pid>` / `.backup-<pid>`. */
export function uploadScratchSuffix(kind) {
  return `.${kind}-${process.pid}`
}

export function isUploadStagingName(name) {
  return /\.staging-\d+$/.test(name)
}

export function isUploadBackupName(name) {
  return /\.backup-\d+$/.test(name)
}

export function isUploadScratchName(name) {
  return isUploadStagingName(name) || isUploadBackupName(name)
}

/** Verified tree lives beside uploadDir (same parent), not inside it. */
export function uploadSiblingStagingPath(uploadDir) {
  return `${uploadDir}${uploadScratchSuffix('staging')}`
}

export function uploadSiblingBackupPath(uploadDir) {
  return `${uploadDir}${uploadScratchSuffix('backup')}`
}

/** Copy upload tree, skipping nested scratch dirs from older workflows. */
export function copyUploadTree(srcDir, dstDir) {
  fs.mkdirSync(dstDir, { recursive: true })
  if (!fs.existsSync(srcDir)) return
  for (const ent of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (isUploadScratchName(ent.name)) continue
    const s = path.join(srcDir, ent.name)
    const d = path.join(dstDir, ent.name)
    if (ent.isDirectory()) {
      fs.cpSync(s, d, { recursive: true })
    } else {
      fs.mkdirSync(path.dirname(d), { recursive: true })
      fs.copyFileSync(s, d)
    }
  }
}

export function discardUploadStaging(stagingDir) {
  try { fs.rmSync(stagingDir, { recursive: true, force: true }) } catch { /* ignore */ }
}

/**
 * Atomically publish staging → live via rename swap:
 * live → backup, staging → live, then delete backup.
 * On failure after live→backup, restore backup → live and preserve staging for retry.
 */
export function promoteUploadStaging(stagingDir, uploadDir, hooks = {}) {
  const rename = hooks.renameSync || ((from, to) => fs.renameSync(from, to))
  const rm = hooks.rmSync || ((target, opts) => fs.rmSync(target, opts))
  const backupDir = uploadSiblingBackupPath(uploadDir)
  discardUploadStaging(backupDir)

  let movedLiveToBackup = false
  try {
    if (hooks.beforePromote) hooks.beforePromote({ stagingDir, uploadDir, backupDir })
    if (fs.existsSync(uploadDir)) {
      rename(uploadDir, backupDir)
      movedLiveToBackup = true
    }
    rename(stagingDir, uploadDir)
    movedLiveToBackup = false
    let cleanupWarning = null
    let backupPreserved = null
    if (fs.existsSync(backupDir)) {
      try {
        rm(backupDir, { recursive: true, force: true })
      } catch (cause) {
        cleanupWarning = cause
        backupPreserved = backupDir
      }
    }
    return { ok: true, cleanupWarning, backupPreserved }
  } catch (cause) {
    let rolledBack = false
    if (movedLiveToBackup && fs.existsSync(backupDir) && !fs.existsSync(uploadDir)) {
      try {
        rename(backupDir, uploadDir)
        rolledBack = true
      } catch { /* manual recovery */ }
    }
    const err = new Error(`upload promotion failed: ${cause.message}`)
    err.cause = cause
    err.recovery = {
      rolledBack,
      liveDir: uploadDir,
      stagingDir: fs.existsSync(stagingDir) ? stagingDir : null,
      backupDir: fs.existsSync(backupDir) ? backupDir : null,
    }
    throw err
  }
}

/** Snapshot live upload beside uploadDir for preflight (sibling staging). */
export function prepareUploadStaging(uploadDir) {
  const staging = uploadSiblingStagingPath(uploadDir)
  discardUploadStaging(staging)
  fs.mkdirSync(path.dirname(staging), { recursive: true })
  fs.mkdirSync(staging, { recursive: true })
  copyUploadTree(uploadDir, staging)
  return staging
}

/** Full staged deploy: preflight in sibling staging, atomic swap only on success. */
export function deployUploadPack(uploadDir, uploadHtml, { uploadInit = false, uploadAssets = false, uploadPrune = false, uploadPlayerOnly = false, hooks = {}, bundlePath = path.join(ROOT, VIEWER_BUNDLE_FILE) } = {}) {
  fs.mkdirSync(path.dirname(uploadDir), { recursive: true })
  const source = auditSourceExhibits()
  if (!source.ok) return { ok: false, stage: 'source', errors: source.errors }
  const useBundle = viewerUsesBundle(uploadHtml)
  if (useBundle) {
    const bundled = validateBundledViewerHtml(uploadHtml)
    if (!bundled.ok) return { ok: false, stage: 'runtime', missing: [bundled.reason] }
    if (!fs.existsSync(bundlePath)) return { ok: false, stage: 'runtime', missing: [VIEWER_BUNDLE_FILE] }
  }
  const staging = prepareUploadStaging(uploadDir)
  try {
    let playerOnlyRemoved = []
    if (uploadPlayerOnly) {
      playerOnlyRemoved = pruneUploadToPlayerOnly(staging)
      initUploadVendor(staging)
    } else {
      if (uploadInit) initUploadVendor(staging)
      if (uploadAssets) syncUploadAssets(staging, source.exhibits)
    }
    const orphansBefore = uploadPlayerOnly ? [] : orphanUploadExhibits(staging, source.craftDirs)
    const pruned = !uploadPlayerOnly && uploadPrune && orphansBefore.length ? pruneUploadExhibits(staging, source.craftDirs) : []
    if (useBundle) fs.copyFileSync(bundlePath, path.join(staging, VIEWER_BUNDLE_FILE))
    const pre = runUploadPreflight(staging, uploadHtml, {
      uploadAssets: false,
      syncModules: !useBundle && !uploadPlayerOnly,
      sourceExhibits: source.exhibits,
      skipAssetVerify: uploadPlayerOnly,
    })
    if (!pre.ok) {
      discardUploadStaging(staging)
      return { ok: false, ...pre }
    }
    fs.writeFileSync(path.join(staging, 'player.view.html'), uploadHtml, 'utf8')
    if (!useBundle && !uploadPlayerOnly) syncUploadModules(staging)
    const exhibitFiles = uploadPlayerOnly ? [] : syncUploadExhibits(staging, source.exhibits)
    const promoted = promoteUploadStaging(staging, uploadDir, hooks)
    return {
      ok: true,
      assets: pre.assets,
      exhibitFiles,
      pruned,
      playerOnlyRemoved,
      orphanExhibits: uploadPrune ? [] : orphansBefore,
      cleanupWarning: promoted.cleanupWarning || null,
      backupPreserved: promoted.backupPreserved || null,
    }
  } catch (e) {
    if (e.recovery?.stagingDir) {
      // verified tree kept for retry; do not delete staging on promotion failure
      throw e
    }
    discardUploadStaging(staging)
    throw e
  }
}

/** @deprecated use verifyUploadAssets */
export function auditUploadAssetRefs(uploadDir = UPLOAD_DIR) {
  const v = verifyUploadAssets(uploadDir)
  return { present: v.present, missing: [...v.errors, ...v.warnings] }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function exhibitTitleFromCfg(cfg) {
  return String(cfg?.i18n?.zh?.title || cfg?.i18n?.en?.title || '').trim()
}

/** 按 config 刷新展品壳页 <title>，保留 redirect 脚本不变 */
export function patchExhibitIndexTitle(indexHtml, title) {
  const safe = escapeHtml(title)
  const label = safe ? `${safe} · 立体鉴赏` : '立体鉴赏'
  if (/<title>[^<]*<\/title>/i.test(indexHtml)) {
    return indexHtml.replace(/<title>[^<]*<\/title>/i, `<title>${label}</title>`)
  }
  return indexHtml
}

/** Unified redirect shell for upload craft-XXX/index.html (from _template/index.html). */
export function buildExhibitIndexHtml(exhibitName, cfg, templateHtml = fs.readFileSync(EXHIBIT_INDEX_TEMPLATE, 'utf8')) {
  const title = exhibitTitleFromCfg(cfg)
  return templateHtml.replaceAll('__EX__', exhibitName).replaceAll('__TITLE__', escapeHtml(title))
}

export function validateViewerSemantics(viewHtml) {
  for (const sym of VIEWER_FORBIDDEN) {
    if (viewHtml.includes(sym)) return { ok: false, reason: `viewer must not contain ${sym}` }
  }
  if (!/ensureHotspotIds\(cfg\.hotspots \|\| \[\]\)/.test(viewHtml)) {
    return { ok: false, reason: 'viewer boot must call ensureHotspotIds(cfg.hotspots || [])' }
  }
  if (!/const editMode = false \/\* viewer-only \*\//.test(viewHtml)) {
    return { ok: false, reason: 'viewer must force editMode false' }
  }
  if (/buildEditor\(\)/.test(viewHtml)) {
    return { ok: false, reason: 'viewer must not call buildEditor()' }
  }
  return { ok: true }
}

export function buildViewerSrc(playerHtml = fs.readFileSync(SRC, 'utf8')) {
  return playerHtml
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]*\/\* EDITOR-CSS-START[\s\S]*?\/\* EDITOR-CSS-END \*\/\n?/, '')
    .replace(/[ \t]*<!-- EDITOR-HTML-START[\s\S]*?<!-- EDITOR-HTML-END -->\n?/, '')
    .replace(/[ \t]*\/\* EDITOR-JS-START[\s\S]*?\/\* EDITOR-JS-END \*\/\n?/, '')
    .replace(/[ \t]*\/\* TEST-HOOKS-START[\s\S]*?\/\* TEST-HOOKS-END \*\/\n?/, '')
    .replace(/\/\* VIEWER-HOTSPOT-DIAG-START[\s\S]*?\/\* VIEWER-HOTSPOT-DIAG-END \*\/\n?/, '')
    .replace(
      /\/\* VIEWER-BOOT-HOTSPOT-START[\s\S]*?\/\* VIEWER-BOOT-HOTSPOT-END \*\//,
      'ensureHotspotIds(cfg.hotspots || [])',
    )
    .replace(/const editMode = params\.get\('mode'\) === 'edit'/, 'const editMode = false /* viewer-only */')
    .replace(/if \(editMode && typeof buildEditor === 'function'\) buildEditor\(\)/, '/* viewer-only: no editor */')
    .replace(/if \(editMode\) buildEditor\(\)/, '/* viewer-only: no editor */')
    .replace(/import \{[^}]+\} from '\.\/hotspot-id\.mjs'/, "import { ensureHotspotIds } from './hotspot-id.mjs'")
    .replace(/import \{[^}]+\} from '\.\/player-persist\.mjs'/, `import { ${VIEWER_PERSIST_IMPORTS.join(', ')} } from './player-persist.mjs'`)
    .replace(/import \{[^}]+\} from '\.\/light-rig\.mjs'/, `import { ${VIEWER_LIGHT_RIG_IMPORTS.join(', ')} } from './light-rig.mjs'`)
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n+$/, '\n')
}

/** Nginx 未配置 .mjs MIME 时，部署包须 import .js 副本 */
function rewriteMjsImportsToJs(html) {
  let out = html
  for (const [, dstName] of UPLOAD_JS_COPIES) {
    const base = dstName.replace(/\.js$/, '')
    out = out.replace(new RegExp(`from '\\./${base}\\.mjs'`, 'g'), `from './${base}.js'`)
  }
  return out
}

export function buildUploadViewerSrc(viewerSrc = buildViewerSrc()) {
  return rewriteMjsImportsToJs(viewerSrc)
}

/** 完整编辑版 player.html，供无法正确提供 .mjs 的测试服务器上传（import 指向同目录 .js 副本） */
export function buildUploadPlayerSrc(playerHtml = fs.readFileSync(SRC, 'utf8')) {
  return rewriteMjsImportsToJs(playerHtml)
}

export function syncUploadModules(uploadDir = UPLOAD_DIR) {
  for (const [srcName, dstName] of UPLOAD_JS_COPIES) {
    fs.copyFileSync(path.join(ROOT, srcName), path.join(uploadDir, dstName))
  }
}

/** 首次部署：复制 exhibits/vendor → upload/vendor */
export function initUploadVendor(uploadDir = UPLOAD_DIR) {
  const src = path.join(ROOT, 'vendor')
  if (!fs.existsSync(src)) throw new Error('exhibits/vendor missing; cannot init upload directory')
  fs.mkdirSync(uploadDir, { recursive: true })
  const dst = path.join(uploadDir, 'vendor')
  fs.rmSync(dst, { recursive: true, force: true })
  fs.cpSync(src, dst, { recursive: true })
}

/** 同步 craft-XXX/config.json（及 index.html 壳页），不复制 assets/ */
export function syncUploadExhibits(uploadDir = UPLOAD_DIR, sourceExhibits = null) {
  const copied = []
  const exhibits = sourceExhibits ?? auditSourceExhibits().exhibits
  for (const { name, cfg } of exhibits) {
    const srcDir = path.join(ROOT, name)
    const cfgPath = path.join(srcDir, 'config.json')
    const dstDir = path.join(uploadDir, name)
    fs.mkdirSync(dstDir, { recursive: true })
    fs.copyFileSync(cfgPath, path.join(dstDir, 'config.json'))
    copied.push(`${name}/config.json`)
    fs.writeFileSync(path.join(dstDir, 'index.html'), buildExhibitIndexHtml(name, cfg), 'utf8')
    copied.push(`${name}/index.html`)
  }
  return copied
}

/** 复制 config 引用的本地 model/poster/panorama（含 ../共享背景/）到 upload */
export function syncUploadAssets(uploadDir = UPLOAD_DIR, sourceExhibits = null) {
  const copied = []
  const exhibits = sourceExhibits ?? auditSourceExhibits().exhibits
  for (const { name, cfg } of exhibits) {
    const srcExhibitDir = path.join(ROOT, name)
    const uploadExhibitDir = path.join(uploadDir, name)
    for (const key of ['model', 'poster', 'panorama']) {
      const ref = cfg?.assets?.[key]
      if (!ref || isRemoteAssetRef(ref)) continue
      const srcAbs = resolveAssetPath(ROOT, srcExhibitDir, ref)
      const dstAbs = resolveAssetPath(uploadDir, uploadExhibitDir, ref)
      if (!srcAbs || !dstAbs || !fs.existsSync(srcAbs)) continue
      fs.mkdirSync(path.dirname(dstAbs), { recursive: true })
      fs.copyFileSync(srcAbs, dstAbs)
      copied.push(`${name}/${ref}`)
    }
  }
  return copied
}

export function assertViewerBuild(viewHtml = buildViewerSrc()) {
  const sem = validateViewerSemantics(viewHtml)
  if (!sem.ok) throw new Error(sem.reason)
  return viewHtml
}

export function buildProductionViewer(viewerSrc = assertViewerBuild(buildViewerSrc()), { outDir = ROOT } = {}) {
  return buildBundledViewer(viewerSrc, { outDir, bundleName: VIEWER_BUNDLE_FILE })
}

/** Read-only: build expected viewer artifacts in a temp dir and compare to committed files. */
export function compareViewerArtifacts(viewerSrc = assertViewerBuild(buildViewerSrc()), root = ROOT) {
  const outHtml = path.join(root, 'player.view.html')
  const outBundle = path.join(root, VIEWER_BUNDLE_FILE)
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-viewer-check-'))
  try {
    const { html, bundlePath } = buildBundledViewer(viewerSrc, { outDir: tmp, bundleName: VIEWER_BUNDLE_FILE })
    const errors = []
    if (!fs.existsSync(outHtml)) errors.push('player.view.html missing; run without --check to generate')
    else {
      const cur = fs.readFileSync(outHtml)
      const exp = Buffer.from(html, 'utf8')
      if (cur.length !== exp.length || !cur.equals(exp)) {
        errors.push(`player.view.html out of sync (${cur.length} bytes vs ${exp.length} expected)`)
      }
    }
    if (!fs.existsSync(outBundle)) errors.push(`${VIEWER_BUNDLE_FILE} missing; run without --check to generate`)
    else {
      const cur = fs.readFileSync(outBundle)
      const exp = fs.readFileSync(bundlePath)
      if (cur.length !== exp.length || !cur.equals(exp)) {
        errors.push(`${VIEWER_BUNDLE_FILE} out of sync (${cur.length} bytes vs ${exp.length} expected)`)
      }
    }
    return { ok: errors.length === 0, errors }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

function usage() {
  console.log(`Usage: node build-viewer.mjs [--check] [--upload] [--upload-init] [--upload-assets] [--upload-prune] [--upload-player-only]

  (default)       Write player.view.html from player.html (+ semantic validation)
  --check         Exit 1 if player.view.html differs or fails semantic validation
  --upload-init   Copy vendor/ into exhibits-upload/ (first-time prerequisite)
  --upload-assets Copy craft assets + shared panoramas (requires --upload; staged atomically)
  --upload-prune  Remove craft-* dirs from upload that no longer exist in source
  --upload        Incremental update of a prepared upload directory:
                  player.view.html, module .js copies, craft config/index,
                  then verify module graph + vendor + asset consistency
  --upload-player-only  Partner file-manager pack: latest player.view.html + player.bundle.js + vendor/ only
                        (removes craft-*, shared assets, txt docs from exhibits-upload/)

  First full deploy:
    node build-viewer.mjs --upload-init --upload-assets --upload

  Code/config only (assets already on server):
    node build-viewer.mjs --upload

  Partner server (viewer only, no shell):
    node build-viewer.mjs --upload-player-only

  Retire deleted exhibits from upload pack:
    node build-viewer.mjs --upload --upload-prune

  New/changed models or panoramas:
    node build-viewer.mjs --upload-assets --upload

  Test server without .mjs MIME (full editor player.html, imports .js copies):
    node build-viewer.mjs --deploy-player`)
}

const DEPLOY_PLAYER_OUT = path.join(ROOT, 'player.deploy.html')
const DEPLOY_PLAYER_DIR = path.join(ROOT, 'deploy-test-server')

const check = process.argv.includes('--check')
const deployPlayer = process.argv.includes('--deploy-player')
const uploadPlayerOnly = process.argv.includes('--upload-player-only')
const upload = process.argv.includes('--upload') || uploadPlayerOnly
const uploadInit = process.argv.includes('--upload-init')
const uploadAssets = process.argv.includes('--upload-assets')
const uploadPrune = process.argv.includes('--upload-prune')
if (isMain) {
if (process.argv.includes('-h') || process.argv.includes('--help')) {
  usage()
  process.exit(0)
}

if (uploadInit && !upload && !uploadAssets && !check) {
  initUploadVendor()
  console.log('exhibits-upload/vendor/ copied from exhibits/vendor/')
  process.exit(0)
}

if (uploadAssets && !upload) {
  console.error('--upload-assets requires --upload (assets copy runs inside staged deploy)')
  console.error('Run: node build-viewer.mjs --upload-assets --upload')
  process.exit(1)
}

if (uploadPlayerOnly && (uploadAssets || uploadPrune || uploadInit)) {
  console.error('--upload-player-only cannot combine with --upload-init, --upload-assets, or --upload-prune')
  process.exit(1)
}

if (deployPlayer) {
  fs.mkdirSync(DEPLOY_PLAYER_DIR, { recursive: true })
  fs.writeFileSync(path.join(DEPLOY_PLAYER_DIR, 'player.html'), buildUploadPlayerSrc(), 'utf8')
  fs.writeFileSync(DEPLOY_PLAYER_OUT, fs.readFileSync(path.join(DEPLOY_PLAYER_DIR, 'player.html'), 'utf8'), 'utf8')
  for (const [srcName, dstName] of UPLOAD_JS_COPIES) {
    fs.copyFileSync(path.join(ROOT, srcName), path.join(DEPLOY_PLAYER_DIR, dstName))
  }
  fs.copyFileSync(path.join(ROOT, 'leader-geom.js'), path.join(DEPLOY_PLAYER_DIR, 'leader-geom.js'))
  fs.writeFileSync(path.join(DEPLOY_PLAYER_DIR, 'README.txt'), [
    '测试服务器上传包（不支持 .mjs 或模块过旧时使用）',
    '',
    '上传到站点 exhibits 根目录（与 craft-001、vendor 同级），覆盖同名文件：',
    '  player.html',
    '  hotspot-id.js',
    '  player-persist.js',
    '  light-rig.js',
    '  material-override.js',
    '  leader-geom.js',
    '',
    '上传后访问：player.html?ex=craft-001&mode=edit',
    '正式服务器有命令权限时改用 node build-viewer.mjs --upload。',
    '',
  ].join('\n'), 'utf8')
  console.log(`deploy-test-server/ written (${UPLOAD_JS_COPIES.length + 2} files + README)`)
  console.log('Upload everything in deploy-test-server/ to your test host (same folder as vendor/)')
  process.exit(0)
}

const viewerSrc = assertViewerBuild(buildViewerSrc())

if (check) {
  const cmp = compareViewerArtifacts(viewerSrc, ROOT)
  if (!cmp.ok) {
    for (const e of cmp.errors) console.error(e)
    console.error('Run: node build-viewer.mjs')
    process.exit(1)
  }
  console.log(`player.view.html + ${VIEWER_BUNDLE_FILE} OK (byte-identical + semantics)`)
  process.exit(0)
}

const { html: bundledHtml, bundlePath } = buildProductionViewer(viewerSrc)
fs.writeFileSync(OUT, bundledHtml, 'utf8')
fs.copyFileSync(bundlePath, path.join(ROOT, VIEWER_BUNDLE_FILE))
console.log('player.view.html written')
console.log(`${VIEWER_BUNDLE_FILE} written`)

if (upload) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const uploadSem = validateBundledViewerHtml(bundledHtml)
  if (!uploadSem.ok) {
    console.error('upload viewer semantics:', uploadSem.reason)
    process.exit(1)
  }
  try {
    const dep = deployUploadPack(UPLOAD_DIR, bundledHtml, {
      uploadInit,
      uploadAssets,
      uploadPrune,
      uploadPlayerOnly,
      bundlePath,
    })
    if (!dep.ok) {
      if (dep.stage === 'source') {
        console.error('exhibits source config errors (upload directory unchanged):')
        for (const e of dep.errors) console.error('  -', e)
      } else if (dep.stage === 'assets') {
        console.error('exhibits-upload asset errors (upload directory unchanged):')
        for (const e of dep.assets.errors) console.error('  -', e)
        console.error('Run: node build-viewer.mjs --upload-assets --upload')
      } else if (dep.stage === 'imports') {
        console.error('exhibits-upload missing imports (upload directory unchanged):', dep.missing.join(', '))
      } else {
        console.error('exhibits-upload missing runtime deps (upload directory unchanged):', dep.missing.join(', '))
        console.error('First deploy: node build-viewer.mjs --upload-init --upload-assets --upload')
      }
      process.exit(1)
    }
    console.log(`exhibits-upload/player.view.html + ${VIEWER_BUNDLE_FILE} written`)
    if (uploadPlayerOnly) {
      console.log('exhibits-upload: player-only pack (player.view.html, player.bundle.js, vendor/)')
      if (dep.playerOnlyRemoved?.length) {
        console.log('exhibits-upload removed non-player files:', dep.playerOnlyRemoved.join(', '))
      }
    } else if (dep.exhibitFiles?.length) console.log('exhibits-upload exhibit files synced:', dep.exhibitFiles.join(', '))
    else console.log('exhibits-upload: no craft-XXX/config.json to sync')
    if (dep.pruned?.length) console.log('exhibits-upload pruned retired crafts:', dep.pruned.join(', '))
    else if (dep.orphanExhibits?.length) {
      console.warn('exhibits-upload: orphaned craft dirs kept (not in source):', dep.orphanExhibits.join(', '))
      console.warn('  Run with --upload-prune to remove them from the upload pack')
    }
    if (dep.assets.present.length) console.log('exhibits-upload asset refs OK:', dep.assets.present.length)
    if (dep.assets.warnings.length) {
      console.warn('exhibits-upload asset warnings:')
      for (const w of dep.assets.warnings) console.warn('  -', w)
    }
    if (dep.cleanupWarning) {
      console.warn('exhibits-upload: live updated but backup cleanup failed:', dep.cleanupWarning.message)
      if (dep.backupPreserved) console.warn('  backup preserved at:', dep.backupPreserved)
    }
    console.log('exhibits-upload verify OK')
  } catch (e) {
    console.error('exhibits-upload promotion failed:', e.message)
    const r = e.recovery
    if (r) {
      if (r.rolledBack) console.error('  live directory restored from backup')
      else console.error('  WARNING: live directory may be inconsistent; manual recovery required')
      if (r.stagingDir) console.error('  verified staging preserved at:', r.stagingDir)
      if (r.backupDir) console.error('  backup preserved at:', r.backupDir)
    }
    process.exit(1)
  }
}
}
