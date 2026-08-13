import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

export function importsFromHtml(html) {
  const out = []
  for (const m of html.matchAll(/import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g)) out.push(m[1])
  return out
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
  const m = html.match(/<script type="importmap">\s*(\{[\s\S]*?\})\s*<\/script>/)
  if (!m) return []
  try {
    const j = JSON.parse(m[1])
    return Object.values(j.imports || {}).filter(s => typeof s === 'string' && (s.startsWith('./') || s.startsWith('../')))
  } catch { return [] }
}

/** 校验 upload 目录具备 viewer 运行时依赖（vendor + import map 目标） */
export function checkUploadRuntimeDeps(uploadDir, htmlPath) {
  const missing = []
  for (const rel of UPLOAD_VENDOR_REQUIRED) {
    if (!fs.existsSync(path.join(uploadDir, rel))) missing.push(rel)
  }
  if (htmlPath && fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf8')
    const fromDir = path.dirname(htmlPath)
    for (const spec of importMapRelativeSpecs(html)) {
      const target = resolveHtmlImport(fromDir, spec)
      if (!target || !fs.existsSync(target)) missing.push(`importmap:${spec}`)
    }
  }
  return missing
}

function isRemoteAssetRef(p) {
  return !p || /^https?:\/\//i.test(p) || p.startsWith('//') || p.startsWith('data:') || p.startsWith('blob:')
}

function resolveUploadAssetPath(uploadDir, exhibitDir, assetPath) {
  if (isRemoteAssetRef(assetPath)) return null
  const root = path.resolve(uploadDir)
  let abs
  if (assetPath.startsWith('/')) abs = path.resolve(root, assetPath.slice(1).replace(/^\/+/, ''))
  else abs = path.resolve(exhibitDir, assetPath)
  if (abs !== root && !abs.startsWith(root + path.sep)) return null
  return abs
}

/** 汇总 upload 中 config 引用的本地 model/poster/panorama 是否存在（仅提示，不阻断） */
export function auditUploadAssetRefs(uploadDir = UPLOAD_DIR) {
  const present = []
  const missing = []
  for (const name of fs.readdirSync(uploadDir)) {
    if (!name.startsWith('craft-') || name.startsWith('_')) continue
    const exhibitDir = path.join(uploadDir, name)
    let st
    try { st = fs.statSync(exhibitDir) } catch { continue }
    if (!st.isDirectory()) continue
    const cfgPath = path.join(exhibitDir, 'config.json')
    if (!fs.existsSync(cfgPath)) continue
    let cfg
    try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')) } catch { continue }
    for (const key of ['model', 'poster', 'panorama']) {
      const ref = cfg?.assets?.[key]
      if (!ref || isRemoteAssetRef(ref)) continue
      const abs = resolveUploadAssetPath(uploadDir, exhibitDir, ref)
      if (!abs) continue
      const label = `${name}/assets.${key}`
      if (fs.existsSync(abs)) present.push(label)
      else missing.push(label + ` (${ref})`)
    }
  }
  return { present, missing }
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

export function assertViewerBuild(viewHtml = buildViewerSrc()) {
  const sem = validateViewerSemantics(viewHtml)
  if (!sem.ok) throw new Error(sem.reason)
  return viewHtml
}

function usage() {
  console.log(`Usage: node build-viewer.mjs [--check] [--upload] [--upload-init]

  (default)     Write player.view.html from player.html (+ semantic validation)
  --check       Exit 1 if player.view.html differs or fails semantic validation
  --upload-init Copy vendor/ into exhibits-upload/ (first-time deploy prerequisite)
  --upload      Update an existing prepared upload directory:
                player.view.html (.js imports), module .js copies,
                craft-XXX/config.json (+ index.html title from config),
                then verify imports + vendor/runtime deps (exit 1 if vendor missing)

  First deploy:  node build-viewer.mjs --upload-init --upload
  Code update:   node build-viewer.mjs --upload`)
}

const check = process.argv.includes('--check')
const upload = process.argv.includes('--upload')
const uploadInit = process.argv.includes('--upload-init')
if (isMain) {
if (process.argv.includes('-h') || process.argv.includes('--help')) {
  usage()
  process.exit(0)
}

if (uploadInit && !upload && !check) {
  initUploadVendor()
  console.log('exhibits-upload/vendor/ copied from exhibits/vendor/')
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
  fs.writeFileSync(UPLOAD_OUT, uploadHtml, 'utf8')
  syncUploadModules()
  const exhibitFiles = syncUploadExhibits()
  const missingImports = checkHtmlImports(UPLOAD_OUT)
  if (missingImports.length) {
    console.error('exhibits-upload missing imports:', missingImports.join(', '))
    process.exit(1)
  }
  const missingRuntime = checkUploadRuntimeDeps(UPLOAD_DIR, UPLOAD_OUT)
  if (missingRuntime.length) {
    console.error('exhibits-upload missing runtime deps:', missingRuntime.join(', '))
    console.error('First deploy: node build-viewer.mjs --upload-init --upload')
    console.error('Or copy vendor/ into exhibits-upload/ before --upload')
    process.exit(1)
  }
  const assets = auditUploadAssetRefs()
  console.log('exhibits-upload/player.view.html written (.js imports)')
  console.log('exhibits-upload/*.js module copies synced')
  if (exhibitFiles.length) console.log('exhibits-upload exhibit files synced:', exhibitFiles.join(', '))
  else console.log('exhibits-upload: no craft-XXX/config.json to sync')
  if (assets.present.length) console.log('exhibits-upload asset refs present:', assets.present.length)
  if (assets.missing.length) {
    console.warn('exhibits-upload asset refs missing (upload separately):')
    for (const m of assets.missing) console.warn('  -', m)
  }
  console.log('exhibits-upload runtime deps OK')
}
}
