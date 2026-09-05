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
