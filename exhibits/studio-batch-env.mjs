/** 批量环境相关纯函数（studio.html 提示与单测共用） */

import { supportsVisibleBackground } from './light-rig.mjs'

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

/** 从 card 读取批量模拟起点（与 studio 列表项字段一致） */
export function cardEnvState(card = {}) {
  const c = card.item ?? card
  if (card.usesPanorama ?? c.usesPanorama) {
    return {
      mode: 'panorama',
      preset: c.envPreset || 'room',
      panorama: c.panorama || '',
    }
  }
  return {
    mode: c.envMode || card.envMode || 'preset',
    preset: c.envPreset || 'room',
    panorama: c.panorama || '',
  }
}

/** 将环境相关 ops 依次套用到单件展品状态（与批量写 config 顺序一致） */
export function applyEnvOps(state, ops = []) {
  const s = { ...state }
  for (const op of ops) {
    if (op.path === 'environment.mode') s.mode = op.value
    if (op.path === 'environment.preset') s.preset = op.value
    if (op.path === 'assets.panorama') s.panorama = op.value
  }
  return s
}

export function cfgFromEnvState(state) {
  return {
    environment: { mode: state.mode, preset: state.preset },
    assets: { panorama: state.panorama },
  }
}

/** 批量 ops 应用后，该 card 是否支持可见环境背景（与 resolveEnvSource 语义一致） */
export function cardSupportsVisibleBgAfterOps(card, ops = []) {
  return supportsVisibleBackground(cfgFromEnvState(applyEnvOps(cardEnvState(card), ops)))
}

/** 单件展品 card 当前环境是否支持可见背景（未应用 batch ops） */
export function cardSupportsVisibleBg(card = {}) {
  return supportsVisibleBackground(cfgFromEnvState(cardEnvState(card)))
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
export function batchBgvisWarnFromCardsAfterOps(picked = [], ops = []) {
  if (!picked.length) return ''
  let supported = 0
  for (const c of picked) {
    if (cardSupportsVisibleBgAfterOps(c, ops)) supported++
  }
  return formatBgvisWarn(picked.length, supported)
}

/** 「显示环境背景」批量项的警告文案；无警告时返回空串 */
export function batchBgvisWarn({ ops = [], picked = [], enBgvis } = {}) {
  if (!enBgvis) return ''
  if (batchVisibleBgTarget(ops) !== true) return ''
  if (!picked.length) return ''
  return batchBgvisWarnFromCardsAfterOps(picked, ops)
}
