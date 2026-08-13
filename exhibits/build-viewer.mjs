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

export function syncUploadModules() {
  for (const [srcName, dstName] of UPLOAD_JS_COPIES) {
    fs.copyFileSync(path.join(ROOT, srcName), path.join(UPLOAD_DIR, dstName))
  }
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
    if (!fs.existsSync(path.join(srcDir, 'config.json'))) continue
    const dstDir = path.join(uploadDir, name)
    fs.mkdirSync(dstDir, { recursive: true })
    for (const file of UPLOAD_EXHIBIT_FILES) {
      const src = path.join(srcDir, file)
      if (!fs.existsSync(src)) continue
      fs.copyFileSync(src, path.join(dstDir, file))
      copied.push(`${name}/${file}`)
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
  console.log(`Usage: node build-viewer.mjs [--check] [--upload]

  (default)  Write player.view.html from player.html (+ semantic validation)
  --check    Exit 1 if player.view.html differs or fails semantic validation
  --upload   Also write exhibits-upload/player.view.html (.js imports), sync module .js copies,
             craft-XXX/config.json (+ index.html), verify imports`)
}

const check = process.argv.includes('--check')
const upload = process.argv.includes('--upload')
if (isMain) {
if (process.argv.includes('-h') || process.argv.includes('--help')) {
  usage()
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
  const uploadHtml = buildUploadViewerSrc(next)
  const uploadSem = validateViewerSemantics(uploadHtml)
  if (!uploadSem.ok) {
    console.error('upload viewer semantics:', uploadSem.reason)
    process.exit(1)
  }
  fs.writeFileSync(UPLOAD_OUT, uploadHtml, 'utf8')
  syncUploadModules()
  const exhibitFiles = syncUploadExhibits()
  const missing = checkHtmlImports(UPLOAD_OUT)
  if (missing.length) {
    console.error('exhibits-upload missing imports:', missing.join(', '))
    console.error('Note: vendor/ and exhibit assets must already exist in the upload directory.')
    process.exit(1)
  }
  console.log('exhibits-upload/player.view.html written (.js imports)')
  console.log('exhibits-upload/*.js module copies synced')
  if (exhibitFiles.length) console.log('exhibits-upload exhibit files synced:', exhibitFiles.join(', '))
  else console.log('exhibits-upload: no craft-XXX/config.json to sync')
  console.log('exhibits-upload relative imports OK')
}
}
