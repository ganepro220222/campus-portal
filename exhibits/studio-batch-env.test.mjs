import assert from 'node:assert/strict'
import {
  inferBatchEnvEffect,
  batchBgvisWarn,
  batchBgvisWarnFromCards,
  cardSupportsVisibleBg,
} from './studio-batch-env.mjs'

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}

const room = { usesPanorama: false, envMode: 'preset', envPreset: 'room' }
const gallery = { usesPanorama: false, envMode: 'preset', envPreset: 'gallery' }
const pano = { usesPanorama: true, envMode: 'panorama', panorama: 'assets/p.jpg' }
const brokenPano = { usesPanorama: false, envMode: 'panorama', panorama: '' }

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

test('cardSupportsVisibleBg：room / gallery / panorama', () => {
  assert.equal(cardSupportsVisibleBg(room), false)
  assert.equal(cardSupportsVisibleBg(gallery), true)
  assert.equal(cardSupportsVisibleBg(pano), true)
  assert.equal(cardSupportsVisibleBg(brokenPano), false)
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

test('batchBgvisWarn：只勾 bgvis + 选中 room 时警告', () => {
  const msg = batchBgvisWarn({ ops: [], picked: [room, room], enBgvis: true, enEpreset: false })
  assert.match(msg, /2 件都不支持可见环境背景/)
})

test('batchBgvisWarn：只勾 bgvis + 选中 gallery 时不警告', () => {
  assert.equal(batchBgvisWarn({ ops: [], picked: [gallery], enBgvis: true, enEpreset: false }), '')
})

test('batchBgvisWarn：只勾 bgvis + 选中 panorama 时不警告', () => {
  assert.equal(batchBgvisWarn({ ops: [], picked: [pano], enBgvis: true, enEpreset: false }), '')
})

test('batchBgvisWarn：只勾 bgvis + room/gallery 混合时部分警告', () => {
  const msg = batchBgvisWarn({ ops: [], picked: [room, room, gallery], enBgvis: true, enEpreset: false })
  assert.match(msg, /3 件中有 2 件不支持/)
  assert.match(msg, /只会对其余 1 件生效/)
})

test('batchBgvisWarn：批量 preset=gallery 支持可见背景', () => {
  const ops = [{ path: 'environment.preset', value: 'gallery' }]
  assert.equal(batchBgvisWarn({ ops, enBgvis: true, enEpreset: true, epreset: 'gallery' }), '')
})

test('batchBgvisWarn：bgvis + 清除全景且 preset=room 时警告', () => {
  const ops = [
    { path: 'assets.panorama', value: '' },
    { path: 'environment.mode', value: 'preset' },
    { path: 'environment.preset', value: 'room' },
  ]
  assert.equal(
    batchBgvisWarn({ ops, picked: [pano], enBgvis: true, enPanoClear: true, enEpreset: false }),
    '内置房间没有可显示的背景图；请改用影棚/博物馆等预设，或先批量设全景。',
  )
})

test('batchBgvisWarnFromCards：无选中时不警告', () => {
  assert.equal(batchBgvisWarnFromCards([]), '')
})

console.log('')
if (fail) {
  console.error(`studio-batch-env: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`studio-batch-env: ${pass} passed`)
