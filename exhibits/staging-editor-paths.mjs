/**
 * staging 编辑器部署路径清单（零 npm 依赖，供 ECS collector 使用）。
 * build-viewer.mjs 再导出此模块；勿在此 import build-viewer-bundle / esbuild。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

const UPLOAD_VENDOR_REQUIRED = [
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

export const STAGING_EXHIBITS_CODE_EXTRA = [
  'player.view.html',
  'player.bundle.js',
  'build-viewer.mjs',
  'build-viewer-bundle.mjs',
  'staging-editor-paths.mjs',
  'check-static-deps.mjs',
  'serve.py',
  'manifest.json',
  'pano-check.mjs',
  'pano-check.py',
  'studio-port.mjs',
  'studio-static-path.mjs',
  'exhibit-create.mjs',
  'exhibit_create.py',
  'new-exhibit.mjs',
  'shading-risk.mjs',
]

export const STAGING_EDITOR_STATIC_DIRS = ['_template', '_server']

function importsFromSource(text) {
  const out = []
  for (const m of text.matchAll(/import\s+(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g)) out.push(m[1])
  for (const m of text.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push(m[1])
  return out
}

function resolveHtmlImport(fromDir, spec) {
  if (!spec.startsWith('./') && !spec.startsWith('../')) return null
  let base = path.resolve(fromDir, spec)
  if (fs.existsSync(base)) return base
  for (const ext of ['.mjs', '.js']) {
    if (fs.existsSync(base + ext)) return base + ext
  }
  return base
}

function parseImportMap(html) {
  const m = html.match(/<script type="importmap">\s*(\{[\s\S]*?\})\s*<\/script>/)
  if (!m) return { imports: {} }
  try { return JSON.parse(m[1]) } catch { return { imports: {} } }
}

function importMapRelativeSpecs(html) {
  return Object.values(parseImportMap(html).imports || {})
    .filter(s => typeof s === 'string' && (s.startsWith('./') || s.startsWith('../')))
}

function resolveBareImport(spec, htmlDir, importMap) {
  const imports = importMap.imports || {}
  if (imports[spec]) return path.resolve(htmlDir, imports[spec])
  const keys = Object.keys(imports).filter(k => k.endsWith('/')).sort((a, b) => b.length - a.length)
  for (const key of keys) {
    if (spec.startsWith(key)) return path.resolve(htmlDir, imports[key] + spec.slice(key.length))
  }
  return null
}

function resolveModuleSpec(spec, fromFile, htmlDir, importMap) {
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

function walkModuleGraph(htmlPath, rootDir) {
  const html = fs.readFileSync(htmlPath, 'utf8')
  const bundleRef = html.match(/<script type="module"\s+src="\.\/([^"?#]+)(?:[?#][^"]*)?"/)
  if (bundleRef) {
    const rel = bundleRef[1]
    const abs = path.join(rootDir, rel)
    return { files: fs.existsSync(abs) ? [abs] : [] }
  }
  const htmlDir = path.dirname(htmlPath)
  const importMap = parseImportMap(html)
  const seen = new Set()
  const queue = []
  for (const spec of importsFromSource(html)) {
    const resolved = resolveModuleSpec(spec, htmlPath, htmlDir, importMap)
    if (resolved) queue.push(resolved)
  }
  while (queue.length) {
    const file = queue.shift()
    if (seen.has(file)) continue
    seen.add(file)
    if (!fs.existsSync(file)) continue
    if (!/\.(m?js)$/.test(file)) continue
    for (const spec of importsFromSource(fs.readFileSync(file, 'utf8'))) {
      const resolved = resolveModuleSpec(spec, file, htmlDir, importMap)
      if (resolved) queue.push(resolved)
    }
  }
  return { files: [...seen] }
}

function isInsideRoot(file, rootDir) {
  const root = path.resolve(rootDir)
  const abs = path.resolve(file)
  return abs === root || abs.startsWith(root + path.sep)
}

function listModuleGraphFiles(htmlPath, rootDir, { includeMissing = false } = {}) {
  return walkModuleGraph(htmlPath, rootDir).files
    .filter(f => isInsideRoot(f, rootDir) && (includeMissing || fs.existsSync(f)))
    .map(f => path.relative(rootDir, f).replace(/\\/g, '/'))
    .sort()
}

export function collectStagingEditorRelPaths(root = ROOT, { includeMissing = false } = {}) {
  const rels = new Set(['player.html', 'studio.html'])
  for (const html of ['player.html', 'studio.html']) {
    const htmlPath = path.join(root, html)
    if (!fs.existsSync(htmlPath)) continue
    for (const rel of listModuleGraphFiles(htmlPath, root, { includeMissing })) rels.add(rel)
  }
  const playerPath = path.join(root, 'player.html')
  if (fs.existsSync(playerPath)) {
    for (const spec of importMapRelativeSpecs(fs.readFileSync(playerPath, 'utf8'))) {
      rels.add(spec.replace(/^\.\//, ''))
    }
  }
  for (const rel of UPLOAD_VENDOR_REQUIRED) rels.add(rel)
  for (const rel of STAGING_EXHIBITS_CODE_EXTRA) {
    if (includeMissing || fs.existsSync(path.join(root, rel))) rels.add(rel)
  }
  for (const dir of STAGING_EDITOR_STATIC_DIRS) {
    if (fs.existsSync(path.join(root, dir))) rels.add(dir)
  }
  return [...rels].sort()
}

export function collectStagingExhibitsCheckoutPaths(root = ROOT) {
  return collectStagingEditorRelPaths(root, { includeMissing: true }).map(p => `exhibits/${p}`)
}
