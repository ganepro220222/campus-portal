import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { buildViewerSrc, compareViewerArtifacts, collectStagingEditorRelPaths } from './build-viewer.mjs'
import {
  buildBundledViewer,
  buildBundledViewerHtml,
  validateBundledViewerHtml,
  assertBundleSelfContained,
  VIEWER_BUNDLE_FILE,
} from './build-viewer-bundle.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

let pass = 0
let fail = 0
function test(name, fn) {
  try {
    fn()
    pass++
    console.log('  ok', name)
  } catch (e) {
    fail++
    console.error('  FAIL', name)
    console.error(e)
  }
}

test('collectStagingEditorRelPaths includes editor and server deps', () => {
  const paths = collectStagingEditorRelPaths()
  for (const need of ['player.html', 'studio.html', 'pano-check.mjs', 'exhibit-create.mjs', 'leader-geom.js']) {
    assert.ok(paths.includes(need), `missing ${need}`)
  }
  assert.ok(!paths.some(p => /^craft-/.test(p)), 'must not include exhibit content dirs')
})

test('buildBundledViewerHtml removes import map and inline module', () => {
  const src = buildViewerSrc()
  const html = buildBundledViewerHtml(src)
  assert.doesNotMatch(html, /<script type="importmap">/)
  assert.match(html, /src="\.\/player\.bundle\.js"/)
  assert.doesNotMatch(html, /import \* as THREE from 'three'/)
})

test('validateBundledViewerHtml rejects import map', () => {
  const bad = '<script type="importmap">{}</script><script type="module" src="./player.bundle.js"></script>'
  const sem = validateBundledViewerHtml(bad)
  assert.equal(sem.ok, false)
})

test('esbuild bundle is self-contained for iOS 15 Safari', () => {
  const tmp = fs.mkdtempSync(path.join(ROOT, '.test-bundle-'))
  try {
    const { html, bundlePath, cacheBust } = buildBundledViewer(buildViewerSrc(), { outDir: tmp, bundleName: VIEWER_BUNDLE_FILE })
    assert.equal(validateBundledViewerHtml(html).ok, true)
    assert.match(cacheBust, /^[0-9a-f]{8}$/)
    assert.match(html, new RegExp(`src="\\./player\\.bundle\\.js\\?v=${cacheBust}"`))
    const text = fs.readFileSync(bundlePath, 'utf8')
    assert.ok(text.length > 100_000, 'bundle should include three.js graph')
    assertBundleSelfContained(text)
    assert.match(text, /__SY_PLAYER/)
    assert.match(text, /strictWebKitPanoramaMaxWidth/)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('compareViewerArtifacts detects stale bundle without mutating repo file', () => {
  const bundlePath = path.join(ROOT, VIEWER_BUNDLE_FILE)
  const saved = fs.readFileSync(bundlePath)
  const sentinel = '/* __STALE_BUNDLE_SENTINEL__ */'
  try {
    fs.writeFileSync(bundlePath, sentinel, 'utf8')
    const cmp = compareViewerArtifacts(buildViewerSrc(), ROOT)
    assert.equal(cmp.ok, false)
    assert.ok(cmp.errors.some(e => e.includes(VIEWER_BUNDLE_FILE)))
    assert.equal(fs.readFileSync(bundlePath, 'utf8'), sentinel, '--check must not rewrite committed bundle')
    const r = spawnSync(process.execPath, ['build-viewer.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' })
    assert.notEqual(r.status, 0, (r.stderr || r.stdout || 'expected --check to fail on stale bundle').trim())
    assert.equal(fs.readFileSync(bundlePath, 'utf8'), sentinel, 'CLI --check must stay read-only on stale bundle')
  } finally {
    fs.writeFileSync(bundlePath, saved)
  }
  const ok = spawnSync(process.execPath, ['build-viewer.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' })
  assert.equal(ok.status, 0, (ok.stderr || ok.stdout || 'build-viewer --check failed after restore').trim())
})

console.log(`\nbuild-viewer-bundle: ${pass} passed${fail ? `, ${fail} failed` : ''}`)
if (fail) process.exit(1)
