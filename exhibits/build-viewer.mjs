import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assetFingerprint } from './pano-check.mjs'

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

const UPLOAD_DIR = path.join(ROOT, '..', 'exhibits-upload')
const UPLOAD_OUT = path.join(UPLOAD_DIR, 'player.view.html')

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

/** 从 player HTML 内联 module + 递归 JS import 收集缺失模块 */
export function collectModuleGraph(htmlPath, uploadDir) {
  const html = fs.readFileSync(htmlPath, 'utf8')
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
      missing.push(path.relative(uploadDir, file).replace(/\\/g, '/'))
      continue
    }
    if (!/\.(m?js)$/.test(file)) continue
    for (const spec of importsFromSource(fs.readFileSync(file, 'utf8'))) {
      const resolved = resolveModuleSpec(spec, file, htmlDir, importMap)
      if (resolved) queue.push(resolved)
      else if (spec.startsWith('.')) missing.push(`${spec} (from ${path.basename(file)})`)
    }
  }
  return [...new Set(missing)]
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

function listSourceExhibits() {
  const out = []
  for (const name of fs.readdirSync(ROOT)) {
    if (!name.startsWith('craft-') || name.startsWith('_')) continue
    const srcDir = path.join(ROOT, name)
    try {
      if (!fs.statSync(srcDir).isDirectory()) continue
    } catch { continue }
    if (fs.existsSync(path.join(srcDir, 'config.json'))) out.push(name)
  }
  return out.sort()
}

/** 校验 upload 中 config 引用的本地资源：model 缺失/过期阻断，poster/panorama 仅 warning */
export function verifyUploadAssets(uploadDir = UPLOAD_DIR) {
  const present = []
  const errors = []
  const warnings = []
  for (const name of listSourceExhibits()) {
    const srcExhibitDir = path.join(ROOT, name)
    const uploadExhibitDir = path.join(uploadDir, name)
    let cfg
    try { cfg = JSON.parse(fs.readFileSync(path.join(srcExhibitDir, 'config.json'), 'utf8')) } catch { continue }
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
      const srcFp = assetFingerprint(srcExhibitDir, ref, ROOT)
      const dstFp = assetFingerprint(uploadExhibitDir, ref, uploadDir)
      if (srcFp && dstFp && srcFp !== dstFp) {
        const msg = `stale ${key} (source changed): ${label}`
        if (key === 'model') errors.push(msg)
        else warnings.push(msg)
      }
    }
  }
  return { ok: errors.length === 0, present, errors, warnings }
}

/** 写入 upload 前的预检：可选先同步资产，再校验资源与运行时依赖（不写 viewer/config） */
export function runUploadPreflight(uploadDir, uploadHtml, { uploadAssets: doAssets = false } = {}) {
  if (doAssets) syncUploadAssets(uploadDir)
  const assets = verifyUploadAssets(uploadDir)
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
    .replace(/import \{[^}]+\} from '\.\/player-persist\.mjs'/, "import { configFetchUrl } from './player-persist.mjs'")
    .replace(/import \{[^}]+\} from '\.\/light-rig\.mjs'/, `import { ${VIEWER_LIGHT_RIG_IMPORTS.join(', ')} } from './light-rig.mjs'`)
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n+$/, '\n')
}

/** Nginx 未配置 .mjs MIME 时，部署包须 import .js 副本 */
export function buildUploadViewerSrc(viewerSrc = buildViewerSrc()) {
  let out = viewerSrc
  for (const [, dstName] of UPLOAD_JS_COPIES) {
    const base = dstName.replace(/\.js$/, '')
    out = out.replace(new RegExp(`from '\\./${base}\\.mjs'`, 'g'), `from './${base}.js'`)
  }
  return out
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
  fs.cpSync(src, path.join(uploadDir, 'vendor'), { recursive: true })
}

/** 同步 craft-XXX/config.json（及 index.html 壳页），不复制 assets/ */
export function syncUploadExhibits(uploadDir = UPLOAD_DIR) {
  const copied = []
  for (const name of fs.readdirSync(ROOT)) {
    if (!name.startsWith('craft-') || name.startsWith('_')) continue
    const srcDir = path.join(ROOT, name)
    let st
    try { st = fs.statSync(srcDir) } catch { continue }
    if (!st.isDirectory()) continue
    const cfgPath = path.join(srcDir, 'config.json')
    if (!fs.existsSync(cfgPath)) continue
    let cfg
    try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) } catch { continue }
    const dstDir = path.join(uploadDir, name)
    fs.mkdirSync(dstDir, { recursive: true })
    fs.copyFileSync(cfgPath, path.join(dstDir, 'config.json'))
    copied.push(`${name}/config.json`)
    const idxSrc = path.join(srcDir, 'index.html')
    if (fs.existsSync(idxSrc)) {
      const html = patchExhibitIndexTitle(fs.readFileSync(idxSrc, 'utf8'), exhibitTitleFromCfg(cfg))
      fs.writeFileSync(path.join(dstDir, 'index.html'), html, 'utf8')
      copied.push(`${name}/index.html`)
    }
  }
  return copied
}

/** 复制 config 引用的本地 model/poster/panorama（含 ../共享背景/）到 upload */
export function syncUploadAssets(uploadDir = UPLOAD_DIR) {
  const copied = []
  for (const name of listSourceExhibits()) {
    const srcExhibitDir = path.join(ROOT, name)
    const uploadExhibitDir = path.join(uploadDir, name)
    let cfg
    try { cfg = JSON.parse(fs.readFileSync(path.join(srcExhibitDir, 'config.json'), 'utf8')) } catch { continue }
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

function usage() {
  console.log(`Usage: node build-viewer.mjs [--check] [--upload] [--upload-init] [--upload-assets]

  (default)       Write player.view.html from player.html (+ semantic validation)
  --check         Exit 1 if player.view.html differs or fails semantic validation
  --upload-init   Copy vendor/ into exhibits-upload/ (first-time prerequisite)
  --upload-assets Copy craft assets + shared panoramas referenced in config
  --upload        Incremental update of a prepared upload directory:
                  player.view.html, module .js copies, craft config/index,
                  then verify module graph + vendor + asset consistency

  First full deploy:
    node build-viewer.mjs --upload-init --upload-assets --upload

  Code/config only (assets already on server):
    node build-viewer.mjs --upload

  New/changed models or panoramas:
    node build-viewer.mjs --upload-assets --upload`)
}

const check = process.argv.includes('--check')
const upload = process.argv.includes('--upload')
const uploadInit = process.argv.includes('--upload-init')
const uploadAssets = process.argv.includes('--upload-assets')
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

if (uploadAssets && !upload && !check) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  const copied = syncUploadAssets()
  console.log('exhibits-upload assets synced:', copied.length ? copied.join(', ') : '(none)')
  process.exit(0)
}

const next = assertViewerBuild(buildViewerSrc())

if (check) {
  if (!fs.existsSync(OUT)) {
    console.error('player.view.html missing; run without --check to generate')
    process.exit(1)
  }
  const cur = fs.readFileSync(OUT)
  const exp = Buffer.from(next, 'utf8')
  if (cur.length !== exp.length || !cur.equals(exp)) {
    console.error(`player.view.html out of sync (${cur.length} bytes vs ${exp.length} expected)`)
    console.error('Run: node build-viewer.mjs')
    process.exit(1)
  }
  console.log('player.view.html OK (byte-identical + semantics)')
  process.exit(0)
}

fs.writeFileSync(OUT, next, 'utf8')
console.log('player.view.html written')

if (upload) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  if (uploadInit) {
    initUploadVendor()
    console.log('exhibits-upload/vendor/ copied from exhibits/vendor/')
  }
  const uploadHtml = buildUploadViewerSrc(next)
  const uploadSem = validateViewerSemantics(uploadHtml)
  if (!uploadSem.ok) {
    console.error('upload viewer semantics:', uploadSem.reason)
    process.exit(1)
  }
  if (uploadAssets) {
    const assetFiles = syncUploadAssets(UPLOAD_DIR)
    if (assetFiles.length) console.log('exhibits-upload assets synced:', assetFiles.join(', '))
  }
  const pre = runUploadPreflight(UPLOAD_DIR, uploadHtml, { uploadAssets: false })
  if (!pre.ok) {
    if (pre.stage === 'assets') {
      console.error('exhibits-upload asset errors (model must match source; no files written):')
      for (const e of pre.assets.errors) console.error('  -', e)
      console.error('Run: node build-viewer.mjs --upload-assets --upload')
    } else if (pre.stage === 'imports') {
      console.error('exhibits-upload missing imports (no files written):', pre.missing.join(', '))
    } else {
      console.error('exhibits-upload missing runtime deps (no files written):', pre.missing.join(', '))
      console.error('First deploy: node build-viewer.mjs --upload-init --upload-assets --upload')
    }
    process.exit(1)
  }
  fs.writeFileSync(UPLOAD_OUT, uploadHtml, 'utf8')
  syncUploadModules()
  const exhibitFiles = syncUploadExhibits()
  console.log('exhibits-upload/player.view.html written (.js imports)')
  console.log('exhibits-upload/*.js module copies synced')
  if (exhibitFiles.length) console.log('exhibits-upload exhibit files synced:', exhibitFiles.join(', '))
  else console.log('exhibits-upload: no craft-XXX/config.json to sync')
  if (pre.assets.present.length) console.log('exhibits-upload asset refs OK:', pre.assets.present.length)
  if (pre.assets.warnings.length) {
    console.warn('exhibits-upload asset warnings:')
    for (const w of pre.assets.warnings) console.warn('  -', w)
  }
  console.log('exhibits-upload verify OK')
}
}
