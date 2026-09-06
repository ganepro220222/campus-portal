import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  classifyIosBlackLook,
  summarizeGltfMaterials,
  parseGlbJson,
  inspectExhibit,
  readPngOrJpegSize,
  readImageSize,
  constrainedDecodeTarget,
  applySharedMapDownscale,
  copyTextureSampling,
  webglContextRestorePlan,
  resizeToMaxWidth,
} from './shading-risk.mjs'

let pass = 0
function test(name, fn) {
  fn()
  pass++
  console.log('  ok', name)
}

console.log('shading-risk tests')

test('上下文恢复禁止再拉全景、也不再烤 PMREM', () => {
  const withBg = webglContextRestorePlan({ hasCpuEnvBackground: true })
  assert.equal(withBg.refetchPanorama, false)
  assert.equal(withBg.rebuildPmrem, false)
  assert.equal(withBg.keepCpuBackground, true)
  assert.equal(withBg.action, 'preset-or-room')
  const noBg = webglContextRestorePlan({ hasCpuEnvBackground: false })
  assert.equal(noBg.rebuildPmrem, false)
  assert.equal(noBg.action, 'preset-or-room')
})

test('5000 宽全景按 1024 封顶', () => {
  assert.deepEqual(resizeToMaxWidth(5000, 2500, 1024), { w: 1024, h: 512, scaled: true })
  assert.deepEqual(resizeToMaxWidth(1024, 512, 1024), { w: 1024, h: 512, scaled: false })
})

test('全景背景在、环境立方体不在、金属度高 → 对得上截图', () => {
  const r = classifyIosBlackLook({
    configMetalness: 0.7,
    materialMetalnessMax: 0.7,
    hasSceneEnvironment: false,
    backgroundIsTexture: true,
  })
  assert.ok(r.some((x) => x.id === 'pmrem-missing-metal'))
})

test('环境立方体在时不报 pmrem-missing-metal', () => {
  const r = classifyIosBlackLook({
    materialMetalnessMax: 0.8,
    hasSceneEnvironment: true,
    backgroundIsTexture: true,
  })
  assert.ok(!r.some((x) => x.id === 'pmrem-missing-metal'))
  assert.ok(r.some((x) => x.id === 'high-metalness'))
})

test('贴图槽位在但像素没上去', () => {
  const r = classifyIosBlackLook({
    hasBaseColorTexture: true,
    mapImageMissing: true,
  })
  assert.ok(r.some((x) => x.id === 'albedo-upload-fail'))
})

test('边长 4096 记 huge-albedo', () => {
  const r = classifyIosBlackLook({ maxAlbedoEdge: 4096 })
  assert.ok(r.some((x) => x.id === 'huge-albedo'))
})

test('环境 RT 在但宽为 0', () => {
  const r = classifyIosBlackLook({ hasEnvRt: true, envRtW: 0 })
  assert.ok(r.some((x) => x.id === 'env-rt-empty'))
})

test('低金属度 + 环境在 + 贴图正常 → 空', () => {
  const r = classifyIosBlackLook({
    configMetalness: 0.19,
    materialMetalnessMax: 0.1,
    hasSceneEnvironment: true,
    backgroundIsTexture: true,
    hasBaseColorTexture: true,
    maxAlbedoEdge: 2048,
  })
  assert.equal(r.length, 0)
})

test('fixture glTF：Trim 金属度 0.9', () => {
  const json = JSON.parse(fs.readFileSync(new URL('./e2e/fixtures/two-material.gltf', import.meta.url), 'utf8'))
  const mats = summarizeGltfMaterials(json)
  assert.equal(mats.length, 2)
  assert.equal(mats.find((m) => m.name === 'Trim').metallicFactor, 0.9)
  const authored = inspectExhibit({}, json, null)
  assert.ok(authored.risks.some((x) => x.id === 'high-metalness'))
  const overridden = inspectExhibit({ materials: { global: { metalness: 0 } } }, json, null)
  assert.ok(!overridden.risks.some((x) => x.id === 'high-metalness'))
  assert.ok(overridden.risks.some((x) => x.id === 'glb-metal-overridden'))
})

test('PNG 头能读出宽高', () => {
  const png = Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52,
    0, 0, 0x04, 0x00, 0, 0, 0x03, 0x00,
  ])
  assert.deepEqual(readPngOrJpegSize(png), { w: 1024, h: 768, kind: 'png' })
})

function u16le(n) { return [n & 0xff, (n >> 8) & 0xff] }
function u24le(n) { return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff] }
function u32le(n) { return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff] }
function asciiBytes(s) { return [...s].map(c => c.charCodeAt(0)) }

function webpVP8X(w, h) {
  const b = new Uint8Array(30)
  b.set(asciiBytes('RIFF'), 0)
  b.set(u32le(22), 4)
  b.set(asciiBytes('WEBP'), 8)
  b.set(asciiBytes('VP8X'), 12)
  b.set(u32le(10), 16)
  b.set(u24le(w - 1), 24)
  b.set(u24le(h - 1), 27)
  return b
}

function webpVP8(w, h) {
  const b = new Uint8Array(30)
  b.set(asciiBytes('RIFF'), 0)
  b.set(u32le(22), 4)
  b.set(asciiBytes('WEBP'), 8)
  b.set(asciiBytes('VP8 '), 12)
  b.set(u16le(w & 0x3fff), 26)
  b.set(u16le(h & 0x3fff), 28)
  return b
}

function webpVP8L(w, h) {
  const b = new Uint8Array(25)
  b.set(asciiBytes('RIFF'), 0)
  b.set(u32le(17), 4)
  b.set(asciiBytes('WEBP'), 8)
  b.set(asciiBytes('VP8L'), 12)
  b[20] = 0x2f
  const bits = ((w - 1) & 0x3fff) | (((h - 1) & 0x3fff) << 14)
  b.set(u32le(bits), 21)
  return b
}

test('8000×4000 VP8X WebP 按 2048 封顶', () => {
  const sz = readImageSize(webpVP8X(8000, 4000))
  assert.deepEqual(sz, { w: 8000, h: 4000, kind: 'webp-vp8x' })
  assert.deepEqual(constrainedDecodeTarget(sz, 2048), { action: 'decode', w: 2048, h: 1024, scaled: true })
})

test('大 VP8 / VP8L WebP 按 2048 宽缩小', () => {
  const vp8 = readImageSize(webpVP8(4096, 2048))
  assert.equal(vp8.kind, 'webp-vp8')
  assert.deepEqual(constrainedDecodeTarget(vp8, 2048), { action: 'decode', w: 2048, h: 1024, scaled: true })
  const vp8l = readImageSize(webpVP8L(6000, 3000))
  assert.equal(vp8l.kind, 'webp-vp8l')
  assert.deepEqual(constrainedDecodeTarget(vp8l, 2048), { action: 'decode', w: 2048, h: 1024, scaled: true })
})

test('未知图头在有上限时不得完整解码', () => {
  assert.deepEqual(constrainedDecodeTarget(null, 2048), { action: 'env-fallback', reason: 'unknown-size' })
  assert.deepEqual(constrainedDecodeTarget({ w: 0, h: 0 }, 2048), { action: 'env-fallback', reason: 'unknown-size' })
  assert.deepEqual(readImageSize(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])), null)
})

test('非 strict 无上限时保持完整解码', () => {
  assert.equal(constrainedDecodeTarget({ w: 8000, h: 4000 }, 0).action, 'unrestricted')
})

test('共享大贴图只降采样一次，原纹理最后才 dispose', () => {
  const shared = { id: 'orig', image: { width: 4096, height: 4096 }, disposed: 0, dispose() { this.disposed++ } }
  const m1 = { map: shared }
  const m2 = { map: shared }
  let downcalls = 0
  const small = { id: 'small', image: { width: 2048, height: 2048 } }
  const toDispose = applySharedMapDownscale([m1, m2], (tex) => {
    downcalls++
    assert.equal(tex, shared)
    return small
  })
  assert.equal(downcalls, 1)
  assert.equal(m1.map, small)
  assert.equal(m2.map, small)
  assert.deepEqual(toDispose, [shared])
  assert.equal(shared.disposed, 0)
  for (const tex of toDispose) tex.dispose()
  assert.equal(shared.disposed, 1)
})

test('copyTextureSampling 保留 UV transform', () => {
  const src = {
    flipY: false,
    wrapS: 1000,
    rotation: 0.25,
    offset: { x: 0.1, y: 0.2, clone() { return { x: this.x, y: this.y } } },
    repeat: { x: 2, y: 3, clone() { return { x: this.x, y: this.y } } },
    center: { x: 0.5, y: 0.5, clone() { return { x: this.x, y: this.y } } },
  }
  const dst = {}
  copyTextureSampling(src, dst)
  assert.equal(dst.flipY, false)
  assert.equal(dst.wrapS, 1000)
  assert.equal(dst.rotation, 0.25)
  assert.deepEqual(dst.offset, { x: 0.1, y: 0.2 })
  assert.deepEqual(dst.repeat, { x: 2, y: 3 })
  assert.equal(dst.needsUpdate, true)
})

const glbPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'craft-001/assets/model.glb')
if (fs.existsSync(glbPath)) {
  test('craft-001 GLB 能解析', () => {
    const { json, bin } = parseGlbJson(fs.readFileSync(glbPath))
    const cfg = JSON.parse(fs.readFileSync(path.join(path.dirname(glbPath), '../config.json'), 'utf8'))
    const report = inspectExhibit(cfg, json, bin)
    assert.ok(report.materials.length >= 1)
    assert.ok(report.materialMetalnessMax >= 0)
  })
}

console.log(`shading-risk: ${pass} passed`)
