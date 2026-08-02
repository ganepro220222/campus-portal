import assert from 'node:assert/strict'
import { inferBatchEnvEffect, batchBgvisWarn } from './studio-batch-env.mjs'

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}

console.log('studio-batch-env tests')

test('inferBatchEnvEffect：批量设全景', () => {
  const ops = [
    { path: 'assets.panorama', value: '../shared/a.jpg' },
    { path: 'environment.mode', value: 'panorama' },
  ]
  assert.deepEqual(inferBatchEnvEffect(ops), { kind: 'panorama' })
})

test('inferBatchEnvEffect：清除全景以 preset 为准', () => {
  const ops = [
    { path: 'assets.panorama', value: '../x.jpg' },
    { path: 'environment.mode', value: 'panorama' },
    { path: 'assets.panorama', value: '' },
    { path: 'environment.mode', value: 'preset' },
  ]
  assert.deepEqual(inferBatchEnvEffect(ops), { kind: 'preset', preset: 'room', cleared: true })
})

test('batchBgvisWarn：批量设全景时不误报 room', () => {
  const ops = [
    { path: 'assets.panorama', value: '../a.jpg' },
    { path: 'environment.mode', value: 'panorama' },
  ]
  assert.equal(batchBgvisWarn({ ops, enBgvis: true, enPano: true, enPanoClear: false, enEpreset: false, epreset: 'room' }), '')
})

test('batchBgvisWarn：只勾 bgvis 且 epreset=room 时警告', () => {
  assert.equal(
    batchBgvisWarn({ ops: [], enBgvis: true, enEpreset: true, epreset: 'room' }),
    '内置房间没有可显示的背景图；请改用影棚/博物馆等预设，或先批量设全景。',
  )
})

test('batchBgvisWarn：只勾 bgvis 未改环境来源时不警告', () => {
  assert.equal(batchBgvisWarn({ ops: [], enBgvis: true, enEpreset: false }), '')
})

test('batchBgvisWarn：批量 preset=gallery 支持可见背景', () => {
  const ops = [{ path: 'environment.preset', value: 'gallery' }]
  assert.equal(batchBgvisWarn({ ops, enBgvis: true, enEpreset: true, epreset: 'gallery' }), '')
})

console.log('')
if (fail) {
  console.error(`studio-batch-env: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`studio-batch-env: ${pass} passed`)
