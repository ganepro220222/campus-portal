/** 批量环境相关纯函数（studio.html 提示与单测共用） */

import { supportsVisibleBackground } from './light-rig.mjs'

/** 全景资源可用性：true=已确认存在，false=已确认不存在，unknown=尚未验证或无法批量验证 */
export const PANO_UNKNOWN = 'unknown'

/** 按 ops 写入顺序推断批量操作最终环境效果（同字段后者覆盖前者；仅作粗粒度参考） */
export function inferBatchEnvEffect(ops = []) {
  let mode, panorama, preset
  for (const op of ops) {
    if (op.path === 'environment.mode') mode = op.value
    if (op.path === 'assets.panorama') panorama = op.value
    if (op.path === 'environment.preset') preset = op.value
  }
  if (mode === 'panorama' && String(panorama ?? '').trim()) return { kind: 'panorama' }
  if (mode === 'preset' && panorama === '') return { kind: 'preset', preset: preset || 'room', cleared: true }
  if (mode === 'panorama') return { kind: 'panorama' }
  if (preset !== undefined) return { kind: 'preset', preset }
  return { kind: 'unchanged' }
}

/** 从批量 ops 读取最终 visibleBackground 目标（后者覆盖前者） */
export function batchVisibleBgTarget(ops = []) {
  const bgOp = [...ops].reverse().find(o => o.path === 'environment.visibleBackground')
  return bgOp ? !!bgOp.value : null
}

/** 列表项上的全景资源是否实际可用（与 API hasPano / usesPanorama 一致） */
function cardPanoramaAvailable(card = {}, c = {}) {
  if (card.usesPanorama ?? c.usesPanorama) return true
  return !!(card.hasPano ?? c.hasPano)
}

function normalizePanoAvail(v) {
  if (v === true || v === false || v === PANO_UNKNOWN) return v
  return !!v
}

/** 从 card 读取批量模拟起点（与 studio 列表项字段一致） */
export function cardEnvState(card = {}) {
  const c = card.item ?? card
  if (card.usesPanorama ?? c.usesPanorama) {
    return {
      mode: 'panorama',
      preset: c.envPreset || 'room',
      panorama: c.panorama || '',
      panoramaAvailable: true,
    }
  }
  return {
    mode: c.envMode || card.envMode || 'preset',
    preset: c.envPreset || 'room',
    panorama: c.panorama || '',
    panoramaAvailable: cardPanoramaAvailable(card, c),
  }
}

/** 将环境相关 ops 依次套用到单件展品状态（与批量写 config 顺序一致） */
export function applyEnvOps(state, ops = [], { batchPanoAvailability = null } = {}) {
  const s = { ...state, panoramaAvailable: normalizePanoAvail(state.panoramaAvailable) }
  for (const op of ops) {
    if (op.path === 'environment.mode') s.mode = op.value
    if (op.path === 'environment.preset') s.preset = op.value
    if (op.path === 'assets.panorama') {
      s.panorama = op.value
      const path = String(op.value ?? '').trim()
      if (!path) s.panoramaAvailable = false
      else if (batchPanoAvailability !== null && batchPanoAvailability !== undefined) {
        s.panoramaAvailable = normalizePanoAvail(batchPanoAvailability)
      } else {
        s.panoramaAvailable = PANO_UNKNOWN
      }
    }
  }
  return s
}

export function cfgFromEnvState(state) {
  return {
    environment: { mode: state.mode, preset: state.preset },
    assets: { panorama: state.panorama },
  }
}

/** 可见背景判断：全景不可用/未验证时模拟 player 回落到 fallback preset */
export function envSupportsVisibleBg(state = {}) {
  const path = String(state.panorama ?? '').trim()
  if (state.mode === 'panorama' && path && state.panoramaAvailable !== true) {
    return supportsVisibleBackground({
      environment: { mode: 'preset', preset: state.preset },
      assets: { panorama: '' },
    })
  }
  return supportsVisibleBackground(cfgFromEnvState(state))
}

function envOpts(opts = {}) {
  return { batchPanoAvailability: opts.batchPanoAvailability ?? null }
}

/** 批量 ops 应用后，该 card 是否仍由已确认可用的全景接管 */
export function cardUsesPanoramaAfterOps(card, ops = [], opts = {}) {
  const after = applyEnvOps(cardEnvState(card), ops, envOpts(opts))
  const path = String(after.panorama ?? '').trim()
  return after.mode === 'panorama' && !!path && after.panoramaAvailable === true
}

/** 批量 ops 应用后，该 card 是否支持可见环境背景 */
export function cardSupportsVisibleBgAfterOps(card, ops = [], opts = {}) {
  return envSupportsVisibleBg(applyEnvOps(cardEnvState(card), ops, envOpts(opts)))
}

/** 单件展品 card 当前环境是否支持可见背景（未应用 batch ops） */
export function cardSupportsVisibleBg(card = {}) {
  return envSupportsVisibleBg(cardEnvState(card))
}

function formatBgvisWarn(total, supported) {
  const unsupported = total - supported
  if (unsupported === 0) return ''
  if (supported === 0) {
    return `选中的 ${total} 件都不支持可见环境背景（如内置房间或缺少全景图）；请同时选择影棚/博物馆等环境预设，或批量设置全景。`
  }
  return `选中的 ${total} 件中有 ${unsupported} 件不支持可见环境背景；「显示环境背景」只会对其余 ${supported} 件生效。`
}

/** 按选中展品当前环境统计 bgvis 警告（本批不改环境来源） */
export function batchBgvisWarnFromCards(picked = []) {
  if (!picked.length) return ''
  let supported = 0
  for (const c of picked) {
    if (cardSupportsVisibleBg(c)) supported++
  }
  return formatBgvisWarn(picked.length, supported)
}

/** 逐件模拟 batch ops 后的环境，统计 bgvis 警告 */
export function batchBgvisWarnFromCardsAfterOps(picked = [], ops = [], opts = {}) {
  if (!picked.length) return ''
  let supported = 0
  for (const c of picked) {
    if (cardSupportsVisibleBgAfterOps(c, ops, opts)) supported++
  }
  return formatBgvisWarn(picked.length, supported)
}

/** 「显示环境背景」批量项的警告文案；无警告时返回空串 */
export function batchBgvisWarn({ ops = [], picked = [], enBgvis, batchPanoAvailability = null } = {}) {
  if (!enBgvis) return ''
  if (batchVisibleBgTarget(ops) !== true) return ''
  if (!picked.length) return ''
  return batchBgvisWarnFromCardsAfterOps(picked, ops, { batchPanoAvailability })
}

/** 手工/未验证全景路径的中性提示（不替代 bgvis 计数，只补充说明） */
export function batchPanoPathHint({ ops = [], enPano, batchPanoAvailability = null } = {}) {
  if (!enPano) return ''
  const panoOp = [...ops].reverse().find(o => o.path === 'assets.panorama')
  const path = String(panoOp?.value ?? '').trim()
  if (!path) return ''
  if (batchPanoAvailability === false) {
    return '该全景路径在本地未找到；保存后将回落到环境预设，可见背景取决于预设类型'
  }
  if (batchPanoAvailability === PANO_UNKNOWN) {
    return '手工全景路径尚未验证；若加载失败将回落到当前环境预设'
  }
  return ''
}

/** 「环境预设」批量项的警告文案；本批完成后仍用全景的展品才提示 */
export function batchPresetHint({ picked = [], ops = [], batchPanoAvailability = null } = {}) {
  if (!picked.length) return ''
  let ruled = 0
  for (const c of picked) {
    if (cardUsesPanoramaAfterOps(c, ops, { batchPanoAvailability })) ruled++
  }
  if (!ruled) return ''
  const total = picked.length
  if (ruled === total) {
    return `选中的 ${total} 件都在用全景，环境预设对它们不会生效`
  }
  return `选中的 ${total} 件中有 ${ruled} 件在用全景，此项对这 ${ruled} 件不会生效`
}
