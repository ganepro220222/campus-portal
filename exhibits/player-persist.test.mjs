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
  fitCameraDistance,
  portraitFillTarget,
  PREVIEW_DEVICES,
  DEFAULT_PREVIEW_DEVICE,
  previewDevice,
  framingCoverage,
  devicePreviewFit,
  shouldAutoFitCamera,
  DEFAULT_PORTRAIT_FILL,
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

test('fitCameraDistance：竖屏由宽度绑定，横屏由高度绑定', () => {
  const box = { width: 1.5, height: 2.4, fovDeg: 40, fill: 0.78 }
  const tanV = Math.tan(40 * Math.PI / 360)
  // 竖屏 390×800：水平视锥只有垂直的 0.4875 倍，宽度先顶满
  const port = fitCameraDistance({ ...box, aspect: 390 / 800 })
  assert.ok(Math.abs(port - (0.75 / (tanV * 390 / 800) / 0.78)) < 1e-9, '竖屏应由宽度决定')
  // 横屏 1600×900：高度先顶满
  const land = fitCameraDistance({ ...box, aspect: 1600 / 900 })
  assert.ok(Math.abs(land - (1.2 / tanV / 0.78)) < 1e-9, '横屏应由高度决定')
  assert.ok(port > land, '同一件器物竖屏要退得更远')
})

test('fitCameraDistance：fill 越小退得越远，成反比', () => {
  const b = { width: 1.5, height: 2.4, fovDeg: 40, aspect: 390 / 800 }
  const d78 = fitCameraDistance({ ...b, fill: 0.78 })
  const d39 = fitCameraDistance({ ...b, fill: 0.39 })
  assert.ok(Math.abs(d39 - d78 * 2) < 1e-9)
})

test('fitCameraDistance：坏输入不产出坏距离', () => {
  // 没有尺寸就没法反解 → null（调用方会退回 config 里的 distance）
  assert.equal(fitCameraDistance({ width: 0, height: 0, fovDeg: 40, aspect: 0.5, fill: 0.78 }), null)
  // fov 非正/非数 → 按 40 兜底，绝不返回负数或 0
  for (const bad of [0, -10, NaN, undefined, null]) {
    const d = fitCameraDistance({ width: 1, height: 2, fovDeg: bad, aspect: 0.5, fill: 0.78 })
    assert.ok(d === null || d > 0, `fovDeg=${bad} 得到 ${d}`)
  }
  // fill 非正 → 当作 1（贴边取景），而不是除以 0 变成 Infinity
  const d1 = fitCameraDistance({ width: 1, height: 2, fovDeg: 40, aspect: 0.5, fill: 0 })
  assert.ok(Number.isFinite(d1) && d1 > 0)
})

test('portraitFillTarget：缺省 0.78，可配置，0/false 表示关闭', () => {
  assert.equal(portraitFillTarget(null), DEFAULT_PORTRAIT_FILL)
  assert.equal(portraitFillTarget({ camera: {} }), DEFAULT_PORTRAIT_FILL)
  assert.equal(portraitFillTarget({ camera: { portraitFill: 0.6 } }), 0.6)
  assert.equal(portraitFillTarget({ camera: { portraitFill: 0 } }), 0)
  assert.equal(portraitFillTarget({ camera: { portraitFill: false } }), 0)
  assert.equal(portraitFillTarget({ camera: { portraitFill: 5 } }), 0.98)   // 夹住，别让器物冲出画面
})

test('shouldAutoFitCamera：只在竖屏生效，横屏与关闭时都不接管', () => {
  assert.equal(shouldAutoFitCamera(390 / 800, 0.78), true)
  assert.equal(shouldAutoFitCamera(768 / 1024, 0.78), true)
  assert.equal(shouldAutoFitCamera(1600 / 900, 0.78), false)   // 桌面
  assert.equal(shouldAutoFitCamera(800 / 390, 0.78), false)    // 手机横屏
  assert.equal(shouldAutoFitCamera(390 / 800, 0), false)       // 显式关闭
})

/* ---------- 机型取景预览 ---------- */

test('PREVIEW_DEVICES：机型合法，且比例覆盖到手机与平板两端', () => {
  assert.ok(PREVIEW_DEVICES.length >= 4)
  const ids = new Set()
  for (const d of PREVIEW_DEVICES) {
    assert.ok(d.w > 0 && d.h > 0, `${d.id} 尺寸非法`)
    assert.ok(d.w < d.h, `${d.id} 必须是竖屏——横屏本来就不触发 auto-fit`)
    assert.ok(d.label && d.hint && d.short, `${d.id} 缺标签`)
    assert.ok(d.short.length <= 8, `${d.id} 的 short 太长，机型条会换行`)
    assert.ok(!ids.has(d.id), `${d.id} 重复`)
    ids.add(d.id)
  }
  const ratios = PREVIEW_DEVICES.map(d => d.w / d.h)
  assert.ok(Math.min(...ratios) < 0.5, '缺少 19.5:9 一类的窄机型')
  assert.ok(Math.max(...ratios) > 0.7, '缺少 4:3 一类的平板')
})

test('previewDevice：认不出的 id 回落到默认机型，而不是 undefined', () => {
  assert.equal(previewDevice('ph-m').id, 'ph-m')
  assert.equal(previewDevice('不存在').id, DEFAULT_PREVIEW_DEVICE)
  assert.equal(previewDevice(undefined).id, DEFAULT_PREVIEW_DEVICE)
})

test('framingCoverage：与 fitCameraDistance 互为逆运算', () => {
  // 反解出来的距离再算占屏，必须落回目标 fill——两者用的是同一套截面近似
  for (const [w, h] of [[1, 2], [2, 1], [1, 1], [0.4, 3]]) {
    for (const dev of PREVIEW_DEVICES) {
      const aspect = dev.w / dev.h
      const d = fitCameraDistance({ width: w, height: h, fovDeg: 40, aspect, fill: 0.78 })
      const c = framingCoverage({ width: w, height: h, fovDeg: 40, aspect, distance: d })
      // 谁先顶满就以谁为准，所以两者的较大值等于 fill
      assert.ok(Math.abs(Math.max(c.h, c.w) - 0.78) < 1e-9,
        `${w}×${h} @ ${dev.id}：max(${c.h.toFixed(4)}, ${c.w.toFixed(4)}) ≠ 0.78`)
      assert.ok(c.h <= 0.78 + 1e-9 && c.w <= 0.78 + 1e-9, '另一条轴不该超出目标')
    }
  }
})

test('framingCoverage：距离非法一律 null，不返回 Infinity/NaN', () => {
  for (const bad of [0, -1, NaN, undefined, null, 'x']) {
    assert.equal(framingCoverage({ width: 1, height: 2, fovDeg: 40, aspect: 0.5, distance: bad }), null)
  }
})

test('devicePreviewFit：比例只由宽高比决定，与绝对分辨率无关', () => {
  const base = { width: 1, height: 2, fovDeg: 40, fill: 0.78 }
  const a = devicePreviewFit({ ...base, device: { w: 390, h: 844 } })
  // 同一比例、分辨率翻三倍（相当于 DPR 3 的物理像素），结论必须完全一致
  const b = devicePreviewFit({ ...base, device: { w: 1170, h: 2532 } })
  assert.equal(a.aspect, b.aspect)
  assert.equal(a.distance, b.distance)
  assert.deepEqual(a.coverage, b.coverage)
})

test('devicePreviewFit：被最近/最远距离夹住时如实标记，占屏读数跟着走', () => {
  // 1×2 的器物在 19.5:9 上是**宽度**先顶满，所以看「绑定的那条轴」而不是固定看高
  const bound = c => Math.max(c.h, c.w)
  const base = { width: 1, height: 2, fovDeg: 40, fill: 0.78, device: { w: 390, h: 844 } }
  const free = devicePreviewFit(base)
  assert.equal(free.clamped, false)
  assert.ok(Math.abs(bound(free.coverage) - 0.78) < 1e-9)
  assert.ok(free.coverage.w > free.coverage.h, '窄屏上应当由宽度绑定')

  // 顶到最远距离：被拉近了，占屏比目标大
  const far = devicePreviewFit({ ...base, maxDistance: free.rawDistance * 0.5 })
  assert.equal(far.clamped, true)
  assert.equal(far.distance, free.rawDistance * 0.5)
  assert.ok(Math.abs(bound(far.coverage) - 1.56) < 1e-9, '距离减半，占屏翻倍')

  const near = devicePreviewFit({ ...base, minDistance: free.rawDistance * 2 })
  assert.equal(near.clamped, true)
  assert.ok(Math.abs(bound(near.coverage) - 0.39) < 1e-9, '距离翻倍，占屏减半')
})

test('devicePreviewFit：最近/最远写反时不夹，机型非法返回 null', () => {
  const base = { width: 1, height: 2, fovDeg: 40, fill: 0.78, device: { w: 390, h: 844 } }
  const free = devicePreviewFit(base)
  const inverted = devicePreviewFit({ ...base, minDistance: 9, maxDistance: 1 })
  assert.equal(inverted.distance, free.rawDistance)
  assert.equal(inverted.clamped, false)

  assert.equal(devicePreviewFit({ ...base, device: null }), null)
  assert.equal(devicePreviewFit({ ...base, device: { w: 0, h: 844 } }), null)
})

console.log('')
if (fail) {
  console.error(`player-persist: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`player-persist: ${pass} passed`)
