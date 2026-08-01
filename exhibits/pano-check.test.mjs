import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { hasAssetFile, isRemotePanoramaUrl } from './pano-check.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}

console.log('pano-check tests')

test('remote URLs count as available', () => {
  assert.ok(isRemotePanoramaUrl('https://example.com/p.jpg'))
  assert.ok(hasAssetFile('/tmp/x', 'https://example.com/p.jpg'))
})

test('missing local file returns false', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-pano-'))
  try {
    assert.equal(hasAssetFile(tmp, 'assets/panorama.jpg'), false)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('existing local file returns true', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-pano-'))
  try {
    const assets = path.join(tmp, 'assets')
    fs.mkdirSync(assets)
    fs.writeFileSync(path.join(assets, 'panorama.jpg'), 'x')
    assert.equal(hasAssetFile(tmp, 'assets/panorama.jpg'), true)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('new template dir without panorama file is false', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-pano-'))
  try {
    fs.cpSync(path.join(ROOT, '_template'), path.join(tmp, 'craft-test'), { recursive: true })
    assert.equal(hasAssetFile(path.join(tmp, 'craft-test'), 'assets/panorama.jpg', tmp), false)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('root-relative missing returns false', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-pano-'))
  try {
    assert.equal(hasAssetFile(tmp, '/definitely-missing.jpg', tmp), false)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('root-relative existing returns true', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-pano-'))
  try {
    fs.mkdirSync(path.join(tmp, 'media'), { recursive: true })
    fs.writeFileSync(path.join(tmp, 'media', 'p.jpg'), 'x')
    assert.equal(hasAssetFile(tmp, '/media/p.jpg', tmp), true)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('hasAssetFile 同样适用于模型文件（工作台「缺模型」判断）', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-asset-'))
  try {
    const assets = path.join(tmp, 'assets')
    fs.mkdirSync(assets)
    fs.writeFileSync(path.join(assets, 'model.glb'), 'x')
    assert.equal(hasAssetFile(tmp, 'assets/model.glb'), true)
    assert.equal(hasAssetFile(tmp, 'assets/missing.glb'), false)
    assert.equal(hasAssetFile(tmp, ''), false)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('protocol-relative URL counts as remote', () => {
  assert.ok(isRemotePanoramaUrl('//cdn.example.com/p.jpg'))
  assert.ok(hasAssetFile('/tmp/x', '//cdn.example.com/p.jpg'))
})

console.log('')
if (fail) {
  console.error(`pano-check: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`pano-check: ${pass} passed`)
