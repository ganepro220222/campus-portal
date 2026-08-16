import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildViewerSrc } from './build-viewer.mjs'
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
    const { html, bundlePath } = buildBundledViewer(buildViewerSrc(), { outDir: tmp, bundleName: VIEWER_BUNDLE_FILE })
    assert.equal(validateBundledViewerHtml(html).ok, true)
    const text = fs.readFileSync(bundlePath, 'utf8')
    assert.ok(text.length > 100_000, 'bundle should include three.js graph')
    assertBundleSelfContained(text)
    assert.match(text, /ensureHotspotIds/)
    assert.match(text, /strictWebKitPanoramaMaxWidth/)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

console.log(`\nbuild-viewer-bundle: ${pass} passed${fail ? `, ${fail} failed` : ''}`)
if (fail) process.exit(1)
