import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import * as THREE from './vendor/three.module.js'
import {
  applyExposureToCfg,
  cameraPositionFromSpherical,
  configFetchUrl,
  configExportFilename,
  strictWebKitPanoramaMaxWidth,
  DEFAULT_STRICT_WEBKIT_PANORAMA_MAX_WIDTH,
  panoramaRevealTimeoutMs,
} from './player-persist.mjs'
import { computeRootHash, normalizeRootPath, getIdentityPayload } from './_server/studio-identity.mjs'

function sphericalFromThree(cameraPos, pivot) {
  const s = new THREE.Spherical().setFromVector3(
    new THREE.Vector3(...cameraPos).sub(new THREE.Vector3(...pivot)),
  )
  return { distance: +s.radius.toFixed(3), phi: +s.phi.toFixed(3), theta: +s.theta.toFixed(3) }
}

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}

console.log('player-persist tests')

test('applyExposureToCfg writes cfg.renderer.exposure', () => {
  const cfg = {}
  applyExposureToCfg(cfg, 1.42)
  assert.equal(cfg.renderer.exposure, 1.42)
})

test('configFetchUrl adds cache buster', () => {
  const u = configFetchUrl('craft-001/')
  assert.match(u, /^craft-001\/config\.json\?_=\d+$/)
})

test('configExportFilename includes exhibit dir', () => {
  assert.equal(configExportFilename('craft-002'), 'craft-002.config.json')
  assert.equal(configExportFilename(''), 'config.json')
})

test('strictWebKitPanoramaMaxWidth defaults to 2048 on strict hosts only', () => {
  assert.equal(DEFAULT_STRICT_WEBKIT_PANORAMA_MAX_WIDTH, 2048)
  assert.equal(strictWebKitPanoramaMaxWidth(null, true, 0), 2048)
  assert.equal(strictWebKitPanoramaMaxWidth(null, false, 0), 0)
  assert.equal(strictWebKitPanoramaMaxWidth({ performance: { strictWebKitPanoramaMaxWidth: 1024 } }, true, 0), 1024)
  assert.equal(strictWebKitPanoramaMaxWidth(null, true, 4096), 4096)
})

test('camera round-trip with zero pivot', () => {
  const cam = [2, 2, 3]
  const pivot = [0, 0, 0]
  const sp = sphericalFromThree(cam, pivot)
  const restored = cameraPositionFromSpherical(sp, pivot)
  assert.ok(Math.abs(restored[0] - cam[0]) < 0.01)
  assert.ok(Math.abs(restored[1] - cam[1]) < 0.01)
  assert.ok(Math.abs(restored[2] - cam[2]) < 0.01)
})

test('camera round-trip with non-zero pivot Y (production bug)', () => {
  const pivot = [0, 0.75, 0]
  const cam = [2, 2, 3]
  const sp = sphericalFromThree(cam, pivot)
  const wrong = cameraPositionFromSpherical(sp, [0, 0, 0])
  assert.ok(Math.abs(wrong[1] - cam[1]) > 0.5, 'old load without pivot should differ')
  const restored = cameraPositionFromSpherical(sp, pivot)
  assert.ok(Math.abs(restored[0] - cam[0]) < 0.01)
  assert.ok(Math.abs(restored[1] - cam[1]) < 0.01)
  assert.ok(Math.abs(restored[2] - cam[2]) < 0.01)
})

test('camera round-trip idempotent twice', () => {
  const pivot = [0.2, 0.75, -0.1]
  const cam = [1.5, 2.2, 2.8]
  const sp1 = sphericalFromThree(cam, pivot)
  const mid = cameraPositionFromSpherical(sp1, pivot)
  const sp2 = sphericalFromThree(mid, pivot)
  const again = cameraPositionFromSpherical(sp2, pivot)
  assert.ok(Math.abs(again[0] - cam[0]) < 0.01)
  assert.ok(Math.abs(again[1] - cam[1]) < 0.01)
  assert.ok(Math.abs(again[2] - cam[2]) < 0.01)
})

console.log('studio-identity tests')

test('computeRootHash is stable per root', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-id-'))
  try {
    const a = computeRootHash(tmp)
    const b = computeRootHash(tmp)
    assert.equal(a, b)
    assert.equal(getIdentityPayload(tmp).rootHash, a)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('different roots produce different rootHash', () => {
  const a = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-id-'))
  const b = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-id-'))
  try {
    assert.notEqual(computeRootHash(a), computeRootHash(b))
  } finally {
    fs.rmSync(a, { recursive: true, force: true })
    fs.rmSync(b, { recursive: true, force: true })
  }
})

test('copied .studio-instance-id does not collide rootHash', () => {
  const a = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-id-'))
  const b = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-id-'))
  try {
    const legacy = path.join(a, '.studio-instance-id')
    fs.writeFileSync(legacy, 'copied-uuid-should-not-matter\n')
    fs.copyFileSync(legacy, path.join(b, '.studio-instance-id'))
    assert.notEqual(computeRootHash(a), computeRootHash(b))
  } finally {
    fs.rmSync(a, { recursive: true, force: true })
    fs.rmSync(b, { recursive: true, force: true })
  }
})

test('normalizeRootPath strips trailing separators consistently', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-id-'))
  try {
    const base = path.resolve(tmp)
    assert.equal(normalizeRootPath(base + path.sep), normalizeRootPath(base))
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('panoramaRevealTimeoutMs：缺省 8s，按 测试钩子 > player > config 逐级覆盖', () => {
  assert.equal(panoramaRevealTimeoutMs(null, null, null), 8000)
  assert.equal(panoramaRevealTimeoutMs({ performance: { panoramaRevealTimeoutMs: 3000 } }, null, null), 3000)
  // player 上的值压过 config
  assert.equal(panoramaRevealTimeoutMs({ performance: { panoramaRevealTimeoutMs: 3000 } }, { panoramaRevealTimeoutMs: 1500 }, null), 1500)
  // 测试钩子最优先
  assert.equal(panoramaRevealTimeoutMs({ performance: { panoramaRevealTimeoutMs: 3000 } }, { panoramaRevealTimeoutMs: 1500 },
    { panoramaRevealTimeoutMs: () => 200 }), 200)
  // 非正数一律忽略，落回缺省
  assert.equal(panoramaRevealTimeoutMs({ performance: { panoramaRevealTimeoutMs: 0 } }, { panoramaRevealTimeoutMs: -1 }, null), 8000)
})

console.log('')
if (fail) {
  console.error(`player-persist: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`player-persist: ${pass} passed`)
