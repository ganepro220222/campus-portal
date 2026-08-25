import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
export const VIEWER_BUNDLE_FILE = 'player.bundle.js'

/** Extract inline `<script type="module">` body from viewer HTML. */
export function extractModuleScript(html) {
  const m = html.match(/<script type="module">\s*([\s\S]*?)<\/script>/)
  if (!m) throw new Error('viewer HTML missing inline module script')
  return m[1].trim()
}

/** Production viewer: drop import map + inline module, load bundled ESM instead. */
export function buildBundledViewerHtml(viewerSrc, bundleName = VIEWER_BUNDLE_FILE) {
  let html = viewerSrc.replace(/<script type="importmap">[\s\S]*?<\/script>\s*/g, '')
  const replaced = html.replace(
    /<script type="module">[\s\S]*?<\/script>\s*/,
    `<script type="module" src="./${bundleName}"></script>\n`,
  )
  if (replaced === html) throw new Error('viewer HTML missing inline module script to replace')
  html = replaced
  return html
}

export function validateBundledViewerHtml(html, bundleName = VIEWER_BUNDLE_FILE) {
  if (/<script type="importmap">/.test(html)) {
    return { ok: false, reason: 'bundled viewer must not contain import map' }
  }
  if (!html.includes(`src="./${bundleName}"`)) {
    return { ok: false, reason: `bundled viewer must load ./${bundleName}` }
  }
  if (/<script type="module">\s*import /.test(html)) {
    return { ok: false, reason: 'bundled viewer must not contain inline bare imports' }
  }
  return { ok: true }
}

/** Fail if esbuild left unresolved bare specifiers (import map dependency). */
export function assertBundleSelfContained(bundleText) {
  const bare = [...bundleText.matchAll(/from\s*['"](three(?:\/addons\/[^'"]+)?)['"]/g)].map(m => m[1])
  if (bare.length) {
    throw new Error(`viewer bundle still has bare imports: ${[...new Set(bare)].join(', ')}`)
  }
}

/**
 * Bundle viewer module graph (Three.js + local modules) for Safari/iOS < 16.4 (no import maps).
 * @param {string} viewerSrc - output of buildViewerSrc()
 * @param {string} outFile - absolute path to player.bundle.js
 */
/** Rewrite bare three imports to relative vendor paths for esbuild (no import map). */
export function prepareViewerEntrySource(viewerSrc) {
  return extractModuleScript(viewerSrc)
    .replace(/from 'three'/g, "from './vendor/three.module.js'")
    .replace(/from 'three\/addons\//g, "from './vendor/addons/")
}

export function bundleViewerScript(viewerSrc, outFile) {
  const entryPath = path.join(ROOT, '.player-viewer-entry.mjs')
  fs.writeFileSync(entryPath, prepareViewerEntrySource(viewerSrc), 'utf8')
  try {
    esbuild.buildSync({
      entryPoints: [entryPath],
      bundle: true,
      outfile: outFile,
      format: 'esm',
      platform: 'browser',
      target: ['ios15', 'safari15', 'chrome80'],
      sourcemap: false,
      minify: true,
      logLevel: 'warning',
      absWorkingDir: ROOT,
      alias: {
        three: path.join(ROOT, 'vendor/three.module.js'),
      },
    })
  } finally {
    try { fs.unlinkSync(entryPath) } catch { /* ignore */ }
  }
  const text = fs.readFileSync(outFile, 'utf8')
  assertBundleSelfContained(text)
  return outFile
}

/** Build bundled viewer HTML + JS alongside outDir. */
export function buildBundledViewer(viewerSrc, { outDir = ROOT, bundleName = VIEWER_BUNDLE_FILE } = {}) {
  const bundlePath = path.join(outDir, bundleName)
  bundleViewerScript(viewerSrc, bundlePath)
  const html = buildBundledViewerHtml(viewerSrc, bundleName)
  const sem = validateBundledViewerHtml(html, bundleName)
  if (!sem.ok) throw new Error(sem.reason)
  return { html, bundlePath, bundleName }
}
