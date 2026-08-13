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
const UPLOAD_MODULES = ['hotspot-id', 'player-persist', 'light-rig', 'material-override']

export function buildViewerSrc(playerHtml = fs.readFileSync(SRC, 'utf8')) {
  return playerHtml
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]*\/\* EDITOR-CSS-START[\s\S]*?\/\* EDITOR-CSS-END \*\/\n?/, '')
    .replace(/[ \t]*<!-- EDITOR-HTML-START[\s\S]*?<!-- EDITOR-HTML-END -->\n?/, '')
    .replace(/[ \t]*\/\* EDITOR-JS-START[\s\S]*?\/\* EDITOR-JS-END \*\/\n?/, '')
    .replace(/[ \t]*\/\* TEST-HOOKS-START[\s\S]*?\/\* TEST-HOOKS-END \*\/\n?/, '')
    .replace(/const editMode = params\.get\('mode'\) === 'edit'/, 'const editMode = false /* viewer-only */')
    .replace(/if \(editMode && typeof buildEditor === 'function'\) buildEditor\(\)/, '/* viewer-only: no editor */')
    .replace(/if \(editMode\) buildEditor\(\)/, '/* viewer-only: no editor */')
    .replace(/import \{[^}]+\} from '\.\/hotspot-id\.mjs'/, "import { ensureHotspotIds } from './hotspot-id.mjs'")
    .replace(/import \{[^}]+\} from '\.\/player-persist\.mjs'/, "import { configFetchUrl } from './player-persist.mjs'")
    .replace(/import \{[^}]+\} from '\.\/light-rig\.mjs'/, `import { ${VIEWER_LIGHT_RIG_IMPORTS.join(', ')} } from './light-rig.mjs'`)
    .replace(/\nlet hotspotIdBootAudit = null, hotspotIdBootChanges = \[\][^\n]*\n/, '\n')
    .replace(
      /  if \(editMode\) \{[\s\S]*?bootstrapHotspotIds\(cfg\.hotspots \|\| \[\]\)[\s\S]*?  \} else \{\n    ensureHotspotIds\(cfg\.hotspots \|\| \[\]\)\n  \}/,
      '  ensureHotspotIds(cfg.hotspots || [])',
    )
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\n+$/, '\n')
}

/** Nginx 未配置 .mjs MIME 时，部署包须 import .js 副本 */
export function buildUploadViewerSrc(viewerSrc = buildViewerSrc()) {
  let out = viewerSrc
  for (const name of UPLOAD_MODULES) {
    out = out.replace(new RegExp(`from '\\./${name}\\.mjs'`, 'g'), `from './${name}.js'`)
  }
  return out
}

export function syncUploadModules() {
  for (const name of UPLOAD_MODULES) {
    fs.copyFileSync(path.join(ROOT, `${name}.mjs`), path.join(UPLOAD_DIR, `${name}.js`))
  }
}

function usage() {
  console.log(`Usage: node build-viewer.mjs [--check] [--upload]

  (default)  Write player.view.html from player.html
  --check    Exit 1 if player.view.html differs from generated output (byte-identical)
  --upload   Also write exhibits-upload/player.view.html (.js imports) and sync module .js copies`)
}

const check = process.argv.includes('--check')
const upload = process.argv.includes('--upload')
if (isMain) {
if (process.argv.includes('-h') || process.argv.includes('--help')) {
  usage()
  process.exit(0)
}

const next = buildViewerSrc()

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
  console.log('player.view.html OK (byte-identical)')
  process.exit(0)
}

fs.writeFileSync(OUT, next, 'utf8')
console.log('player.view.html written')

if (upload) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  fs.writeFileSync(UPLOAD_OUT, buildUploadViewerSrc(next), 'utf8')
  syncUploadModules()
  console.log('exhibits-upload/player.view.html written (.js imports)')
  console.log('exhibits-upload/*.js module copies synced')
}
}
