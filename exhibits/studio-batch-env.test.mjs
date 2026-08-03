import assert from 'node:assert/strict'
import {
  inferBatchEnvEffect,
  batchBgvisWarn,
  batchPresetHint,
  batchPanoPathHint,
  batchPanoApplyConfirmKind,
  isSiteRootPanoPath,
  batchBgvisWarnFromCards,
  batchBgvisWarnFromCardsAfterOps,
  batchVisibleBgTarget,
  applyEnvOps,
  cardEnvState,
  cardSupportsVisibleBg,
  cardSupportsVisibleBgAfterOps,
  cardUsesPanoramaAfterOps,
  envSupportsVisibleBg,
  envVisibleBgSupport,
  PANO_UNKNOWN,
} from './studio-batch-env.mjs'

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}

const room = { usesPanorama: false, envMode: 'preset', envPreset: 'room' }
const gallery = { usesPanorama: false, envMode: 'preset', envPreset: 'gallery' }
const pano = { usesPanorama: true, envMode: 'panorama', envPreset: 'gallery', panorama: 'assets/p.jpg' }
const panoRoom = { usesPanorama: true, envMode: 'panorama', envPreset: 'room', panorama: 'assets/p.jpg' }
const panoGallery = { usesPanorama: true, envMode: 'panorama', envPreset: 'gallery', panorama: 'assets/p.jpg' }
const brokenPano = { usesPanorama: false, envMode: 'panorama', panorama: '' }
const missingPanoRoom = {
  usesPanorama: false, hasPano: false, envMode: 'panorama', envPreset: 'room',
  panorama: 'assets/missing.jpg',
}
const missingPanoGallery = {
  usesPanorama: false, hasPano: false, envMode: 'panorama', envPreset: 'gallery',
  panorama: 'assets/missing.jpg',
}
const stalePanoPath = {
  usesPanorama: false, hasPano: true, envMode: 'preset', envPreset: 'gallery',
  panorama: 'assets/exists.jpg',
}
const bgOn = { path: 'environment.visibleBackground', value: true }
const bgOff = { path: 'environment.visibleBackground', value: false }
const clearOps = [
  { path: 'assets.panorama', value: '' },
  { path: 'environment.mode', value: 'preset' },
]

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

test('batchVisibleBgTarget：读最终布尔目标', () => {
  assert.equal(batchVisibleBgTarget([]), null)
  assert.equal(batchVisibleBgTarget([bgOff]), false)
  assert.equal(batchVisibleBgTarget([bgOn, bgOff]), false)
  assert.equal(batchVisibleBgTarget([bgOff, bgOn]), true)
})

test('cardSupportsVisibleBg：room / gallery / panorama', () => {
  assert.equal(cardSupportsVisibleBg(room), false)
  assert.equal(cardSupportsVisibleBg(gallery), true)
  assert.equal(cardSupportsVisibleBg(pano), true)
  assert.equal(cardSupportsVisibleBg(brokenPano), false)
})

test('cardEnvState：路径非空但文件缺失时保留 panoramaAvailable=false', () => {
  const st = cardEnvState(missingPanoRoom)
  assert.equal(st.mode, 'panorama')
  assert.equal(st.panorama, 'assets/missing.jpg')
  assert.equal(st.panoramaAvailable, false)
})

test('envSupportsVisibleBg：缺失全景 + room fallback 不支持可见背景', () => {
  assert.equal(envSupportsVisibleBg(cardEnvState(missingPanoRoom)), false)
  assert.equal(cardSupportsVisibleBg(missingPanoRoom), false)
})

test('envSupportsVisibleBg：缺失全景 + gallery fallback 支持可见背景', () => {
  assert.equal(envSupportsVisibleBg(cardEnvState(missingPanoGallery)), true)
  assert.equal(cardSupportsVisibleBg(missingPanoGallery), true)
})

test('batchBgvisWarn：缺失全景 + room fallback + bgvis=true 时警告', () => {
  const msg = batchBgvisWarn({ ops: [bgOn], picked: [missingPanoRoom], enBgvis: true })
  assert.match(msg, /都不支持可见环境背景/)
})

test('batchBgvisWarn：缺失全景 + gallery fallback + bgvis=true 时不警告', () => {
  assert.equal(batchBgvisWarn({ ops: [bgOn], picked: [missingPanoGallery], enBgvis: true }), '')
})

test('batchBgvisWarn：缺失全景 + 仅改 preset 仍按 fallback 判断', () => {
  const ops = [{ path: 'environment.preset', value: 'room' }, bgOn]
  const msg = batchBgvisWarn({ ops, picked: [missingPanoGallery], enBgvis: true })
  assert.match(msg, /都不支持可见环境背景/)
})

test('batchBgvisWarn：缺失全景 + 清除 + gallery fallback 时支持', () => {
  assert.equal(batchBgvisWarn({ ops: [...clearOps, bgOn], picked: [missingPanoGallery], enBgvis: true }), '')
})

test('cardSupportsVisibleBgAfterOps：批量设置已验证存在的全景路径时视为可用', () => {
  const ops = [
    { path: 'assets.panorama', value: '../shared/new.jpg' },
    { path: 'environment.mode', value: 'panorama' },
    bgOn,
  ]
  assert.equal(cardSupportsVisibleBgAfterOps(missingPanoRoom, ops, { batchPanoAvailability: true }), true)
  assert.equal(batchBgvisWarn({ ops, picked: [missingPanoRoom], enBgvis: true, batchPanoAvailability: true }), '')
})

test('cardSupportsVisibleBgAfterOps：未验证的新路径不计入 bgvis 确定性不支持', () => {
  const ops = [
    { path: 'assets.panorama', value: '../shared/new.jpg' },
    { path: 'environment.mode', value: 'panorama' },
    bgOn,
  ]
  assert.equal(envVisibleBgSupport(applyEnvOps(cardEnvState(missingPanoRoom), ops)), 'conditional')
  assert.equal(cardSupportsVisibleBgAfterOps(missingPanoRoom, ops), false)
  assert.equal(batchBgvisWarn({ ops, picked: [missingPanoRoom], enBgvis: true }), '')
})

test('cardSupportsVisibleBgAfterOps：已验证不存在的路径按 fallback preset 判断', () => {
  const ops = [
    { path: 'assets.panorama', value: '../shared/missing.jpg' },
    { path: 'environment.mode', value: 'panorama' },
    bgOn,
  ]
  assert.equal(cardSupportsVisibleBgAfterOps(missingPanoRoom, ops, { batchPanoAvailability: false }), false)
  assert.match(batchBgvisWarn({ ops, picked: [missingPanoRoom], enBgvis: true, batchPanoAvailability: false }), /都不支持可见环境背景/)
})

test('batchPanoPathHint：未验证路径给出中性提示', () => {
  const ops = [
    { path: 'assets.panorama', value: '../shared/new.jpg' },
    { path: 'environment.mode', value: 'panorama' },
  ]
  assert.match(batchPanoPathHint({ ops, enPano: true, batchPanoAvailability: PANO_UNKNOWN }), /尚未验证/)
})

test('batchPanoPathHint：已验证不存在路径给出明确提示', () => {
  const ops = [{ path: 'assets.panorama', value: '../shared/missing.jpg' }]
  assert.match(batchPanoPathHint({ ops, enPano: true, batchPanoAvailability: false }), /未找到/)
})

test('cardUsesPanoramaAfterOps：缺失全景文件不算仍在用全景', () => {
  assert.equal(cardUsesPanoramaAfterOps(missingPanoRoom, []), false)
  assert.equal(cardUsesPanoramaAfterOps(missingPanoRoom, [{ path: 'environment.preset', value: 'gallery' }]), false)
})

test('cardUsesPanoramaAfterOps：未验证的新路径不算接管', () => {
  const ops = [
    { path: 'assets.panorama', value: '../shared/new.jpg' },
    { path: 'environment.mode', value: 'panorama' },
  ]
  assert.equal(cardUsesPanoramaAfterOps(missingPanoRoom, ops), false)
})

test('cardUsesPanoramaAfterOps：已验证存在的路径算接管', () => {
  const ops = [
    { path: 'assets.panorama', value: '../shared/new.jpg' },
    { path: 'environment.mode', value: 'panorama' },
  ]
  assert.equal(cardUsesPanoramaAfterOps(missingPanoRoom, ops, { batchPanoAvailability: true }), true)
})

test('batchPresetHint：缺失全景文件时不误报 preset 不生效', () => {
  assert.equal(batchPresetHint({ picked: [missingPanoRoom], ops: [{ path: 'environment.preset', value: 'gallery' }] }), '')
})

test('batchPresetHint：未验证新路径时提示 preset 条件关系', () => {
  const ops = [
    { path: 'assets.panorama', value: '../shared/new.jpg' },
    { path: 'environment.mode', value: 'panorama' },
    { path: 'environment.preset', value: 'gallery' },
  ]
  assert.match(batchPresetHint({ picked: [missingPanoRoom], ops }), /尚未验证/)
  assert.match(batchPresetHint({ picked: [missingPanoRoom], ops }), /仅作备用/)
})

test('batchPresetHint：已验证存在的全景后 preset 仍不生效', () => {
  const ops = [
    { path: 'assets.panorama', value: '../shared/new.jpg' },
    { path: 'environment.mode', value: 'panorama' },
    { path: 'environment.preset', value: 'gallery' },
  ]
  assert.match(batchPresetHint({ picked: [missingPanoRoom], ops, batchPanoAvailability: true }), /不会生效/)
})

test('cardSupportsVisibleBg：preset 模式但有可用全景文件，批量切 panorama 后未验证为 conditional', () => {
  const ops = [
    { path: 'assets.panorama', value: 'assets/exists.jpg' },
    { path: 'environment.mode', value: 'panorama' },
    bgOn,
  ]
  assert.equal(cardSupportsVisibleBg(stalePanoPath), true)
  assert.equal(envVisibleBgSupport(applyEnvOps(cardEnvState(stalePanoPath), ops, { batchPanoAvailability: PANO_UNKNOWN })), 'conditional')
  assert.equal(cardSupportsVisibleBgAfterOps(stalePanoPath, ops, { batchPanoAvailability: PANO_UNKNOWN }), false)
  assert.equal(cardSupportsVisibleBgAfterOps(stalePanoPath, ops, { batchPanoAvailability: true }), true)
})

test('applyEnvOps：清除全景保留 card 自己的 preset', () => {
  const after = applyEnvOps(cardEnvState(panoGallery), clearOps)
  assert.equal(after.mode, 'preset')
  assert.equal(after.preset, 'gallery')
  assert.equal(after.panorama, '')
  assert.equal(cardSupportsVisibleBgAfterOps(panoGallery, clearOps), true)
})

test('applyEnvOps：仅改 preset 时仍在 panorama mode 的展品继续用全景', () => {
  const ops = [{ path: 'environment.preset', value: 'room' }]
  assert.equal(cardSupportsVisibleBgAfterOps(panoGallery, ops), true)
})

test('batchBgvisWarn：批量设全景时不误报 room', () => {
  const ops = [
    { path: 'assets.panorama', value: '../a.jpg' },
    { path: 'environment.mode', value: 'panorama' },
    bgOn,
  ]
  assert.equal(batchBgvisWarn({ ops, picked: [room], enBgvis: true, batchPanoAvailability: true }), '')
})

test('batchBgvisWarn：preset room + bgvis=true + 选中 room 预设展品时警告', () => {
  const ops = [{ path: 'environment.preset', value: 'room' }, bgOn]
  const msg = batchBgvisWarn({ ops, picked: [room, room], enBgvis: true })
  assert.match(msg, /2 件都不支持可见环境背景/)
})

test('batchBgvisWarn：panorama 展品 + 仅 batch preset=room + bgvis=true 不警告', () => {
  const ops = [{ path: 'environment.preset', value: 'room' }, bgOn]
  assert.equal(batchBgvisWarn({ ops, picked: [panoGallery], enBgvis: true }), '')
})

test('batchBgvisWarn：bgvis=false + 选中 room 时不警告', () => {
  assert.equal(batchBgvisWarn({ ops: [bgOff], picked: [room, room], enBgvis: true }), '')
})

test('batchBgvisWarn：bgvis=true + 选中 gallery 时不警告', () => {
  assert.equal(batchBgvisWarn({ ops: [bgOn], picked: [gallery], enBgvis: true }), '')
})

test('batchBgvisWarn：bgvis=true + 选中 panorama 时不警告', () => {
  assert.equal(batchBgvisWarn({ ops: [bgOn], picked: [pano], enBgvis: true }), '')
})

test('batchBgvisWarn：bgvis=true + room/gallery 混合时部分警告', () => {
  const msg = batchBgvisWarn({ ops: [bgOn], picked: [room, room, gallery], enBgvis: true })
  assert.match(msg, /3 件中有 2 件不支持/)
  assert.match(msg, /只会对其余 1 件生效/)
})

test('batchBgvisWarn：bgvis=false + room/gallery 混合时不警告', () => {
  assert.equal(batchBgvisWarn({ ops: [bgOff], picked: [room, room, gallery], enBgvis: true }), '')
})

test('batchBgvisWarn：批量 preset=gallery + room 展品时不警告', () => {
  const ops = [{ path: 'environment.preset', value: 'gallery' }, bgOn]
  assert.equal(batchBgvisWarn({ ops, picked: [gallery], enBgvis: true }), '')
})

test('batchBgvisWarn：清除全景保留 gallery fallback 时不警告', () => {
  assert.equal(batchBgvisWarn({ ops: [...clearOps, bgOn], picked: [panoGallery], enBgvis: true }), '')
})

test('batchBgvisWarn：清除全景保留 room fallback 时警告', () => {
  const msg = batchBgvisWarn({ ops: [...clearOps, bgOn], picked: [panoRoom], enBgvis: true })
  assert.match(msg, /都不支持可见环境背景/)
})

test('batchBgvisWarn：清除全景 + room/gallery fallback 混合时部分警告', () => {
  const msg = batchBgvisWarn({ ops: [...clearOps, bgOn], picked: [panoRoom, panoGallery], enBgvis: true })
  assert.match(msg, /2 件中有 1 件不支持/)
})

test('batchBgvisWarn：清除全景且 ops 显式 preset=room 时警告', () => {
  const ops = [
    ...clearOps,
    { path: 'environment.preset', value: 'room' },
    bgOn,
  ]
  const msg = batchBgvisWarn({ ops, picked: [panoGallery], enBgvis: true })
  assert.match(msg, /都不支持可见环境背景/)
})

test('batchBgvisWarn：清除全景且 ops 显式 preset=gallery 时不警告', () => {
  const ops = [
    ...clearOps,
    { path: 'environment.preset', value: 'gallery' },
    bgOn,
  ]
  assert.equal(batchBgvisWarn({ ops, picked: [panoRoom], enBgvis: true }), '')
})

test('batchBgvisWarn：无选中时不警告', () => {
  assert.equal(batchBgvisWarn({ ops: [bgOn], picked: [], enBgvis: true }), '')
})

test('batchBgvisWarnFromCards：无选中时不警告', () => {
  assert.equal(batchBgvisWarnFromCards([]), '')
})

test('batchBgvisWarnFromCardsAfterOps：与 batchBgvisWarn 一致', () => {
  const ops = [bgOn]
  const picked = [room, gallery]
  assert.equal(
    batchBgvisWarn({ ops, picked, enBgvis: true }),
    batchBgvisWarnFromCardsAfterOps(picked, ops),
  )
})

test('cardUsesPanoramaAfterOps：仅改 preset 时全景仍接管', () => {
  assert.equal(cardUsesPanoramaAfterOps(pano, [{ path: 'environment.preset', value: 'room' }]), true)
})

test('batchPresetHint：全景 + 仅 preset 时警告', () => {
  const msg = batchPresetHint({ picked: [pano], ops: [{ path: 'environment.preset', value: 'gallery' }] })
  assert.match(msg, /不会生效/)
})

test('batchPresetHint：全景 + 清除 + preset 时不警告', () => {
  const ops = [
    ...clearOps,
    { path: 'environment.preset', value: 'gallery' },
  ]
  assert.equal(batchPresetHint({ picked: [pano], ops }), '')
})

test('batchPresetHint：全景 + 设新全景 + preset 时警告', () => {
  const ops = [
    { path: 'assets.panorama', value: '../shared/a.jpg' },
    { path: 'environment.mode', value: 'panorama' },
    { path: 'environment.preset', value: 'gallery' },
  ]
  assert.match(batchPresetHint({ picked: [pano], ops, batchPanoAvailability: true }), /不会生效/)
})

test('batchPresetHint：room 展品改 preset 不警告', () => {
  assert.equal(batchPresetHint({ picked: [room], ops: [{ path: 'environment.preset', value: 'gallery' }] }), '')
})

test('batchPresetHint：混合全景/room + 清除后全部用 preset 不警告', () => {
  assert.equal(batchPresetHint({ picked: [pano, room], ops: [...clearOps, { path: 'environment.preset', value: 'gallery' }] }), '')
})

test('batchBgvisWarn：远程 URL + room fallback + bgvis 时不给出确定性不支持', () => {
  const ops = [
    { path: 'assets.panorama', value: 'https://cdn.example.com/hall.jpg' },
    { path: 'environment.mode', value: 'panorama' },
    bgOn,
  ]
  assert.equal(batchBgvisWarn({ ops, picked: [room], enBgvis: true, batchPanoAvailability: PANO_UNKNOWN }), '')
})

test('batchBgvisWarn：远程 URL + gallery fallback + bgvis 时不警告', () => {
  const ops = [
    { path: 'assets.panorama', value: 'https://cdn.example.com/hall.jpg' },
    { path: 'environment.mode', value: 'panorama' },
    bgOn,
  ]
  assert.equal(batchBgvisWarn({ ops, picked: [gallery], enBgvis: true, batchPanoAvailability: PANO_UNKNOWN }), '')
})

test('batchBgvisWarn：混合 room 与 gallery 且批量设未验证全景时不报不支持', () => {
  const ops = [
    { path: 'assets.panorama', value: 'https://cdn.example.com/hall.jpg' },
    { path: 'environment.mode', value: 'panorama' },
    bgOn,
  ]
  const msg = batchBgvisWarn({
    ops,
    picked: [room, gallery],
    enBgvis: true,
    batchPanoAvailability: PANO_UNKNOWN,
  })
  assert.equal(msg, '')
})

test('batchBgvisWarn：未改全景时缺失文件仍给出确定性不支持', () => {
  const msg = batchBgvisWarn({ ops: [bgOn], picked: [missingPanoRoom, room], enBgvis: true })
  assert.match(msg, /2 件都不支持/)
})

test('batchPanoPathHint 与 batchBgvisWarn：未验证时不应同时出现尚未验证与全部不支持', () => {
  const ops = [
    { path: 'assets.panorama', value: 'https://cdn.example.com/hall.jpg' },
    { path: 'environment.mode', value: 'panorama' },
    bgOn,
  ]
  const panoHint = batchPanoPathHint({ ops, enPano: true, batchPanoAvailability: PANO_UNKNOWN })
  const bgvis = batchBgvisWarn({ ops, picked: [room], enBgvis: true, batchPanoAvailability: PANO_UNKNOWN })
  assert.match(panoHint, /尚未验证/)
  assert.equal(bgvis, '')
})

test('batchPresetHint：远程 URL + preset 批量项提示条件关系', () => {
  const ops = [
    { path: 'assets.panorama', value: 'https://cdn.example.com/hall.jpg' },
    { path: 'environment.mode', value: 'panorama' },
    { path: 'environment.preset', value: 'gallery' },
  ]
  assert.match(batchPresetHint({ picked: [room], ops, batchPanoAvailability: PANO_UNKNOWN }), /尚未验证/)
  assert.match(batchPresetHint({ picked: [room], ops, batchPanoAvailability: PANO_UNKNOWN }), /仅作备用/)
})

test('batchPanoPathHint：/ 开头路径提示子路径部署风险', () => {
  const ops = [
    { path: 'assets.panorama', value: '/共享背景/hall.jpg' },
    { path: 'environment.mode', value: 'panorama' },
  ]
  assert.ok(isSiteRootPanoPath('/共享背景/hall.jpg'))
  assert.match(batchPanoPathHint({ ops, enPano: true, batchPanoAvailability: PANO_UNKNOWN }), /子路径部署/)
  assert.match(batchPanoPathHint({ ops, enPano: true, batchPanoAvailability: PANO_UNKNOWN }), /404/)
})

test('batchPanoApplyConfirmKind：区分缺失、站点根与未验证', () => {
  assert.equal(batchPanoApplyConfirmKind(false, '../x.jpg'), 'missing')
  assert.equal(batchPanoApplyConfirmKind(PANO_UNKNOWN, '/共享背景/x.jpg'), 'site-root')
  assert.equal(batchPanoApplyConfirmKind(PANO_UNKNOWN, 'https://cdn/x.jpg'), 'unverified')
  assert.equal(batchPanoApplyConfirmKind(true, '../x.jpg'), null)
})

console.log('')
if (fail) {
  console.error(`studio-batch-env: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`studio-batch-env: ${pass} passed`)
