/** 批量环境相关纯函数（studio.html 提示与单测共用） */

import { supportsVisibleBackground } from './light-rig.mjs'

/** 按 ops 写入顺序推断批量操作最终环境效果（同字段后者覆盖前者） */
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

const ROOM_BG_WARN = '内置房间没有可显示的背景图；请改用影棚/博物馆等预设，或先批量设全景。'

/** 单件展品 card（或 list item）是否支持可见环境背景 */
export function cardSupportsVisibleBg(card = {}) {
  const c = card.item ?? card
  if (card.usesPanorama ?? c.usesPanorama) {
    return supportsVisibleBackground({
      environment: { mode: 'panorama' },
      assets: { panorama: c.panorama || 'x' },
    })
  }
  if ((c.envMode || card.envMode) === 'panorama') return false
  return supportsVisibleBackground({
    environment: { mode: 'preset', preset: c.envPreset || 'room' },
  })
}

/** 本批不改环境来源时，按选中展品当前环境统计 bgvis 警告 */
export function batchBgvisWarnFromCards(picked = []) {
  if (!picked.length) return ''
  let supported = 0
  for (const c of picked) {
    if (cardSupportsVisibleBg(c)) supported++
  }
  const total = picked.length
  const unsupported = total - supported
  if (unsupported === 0) return ''
  if (supported === 0) {
    return `选中的 ${total} 件都不支持可见环境背景（如内置房间或缺少全景图）；请同时选择影棚/博物馆等环境预设，或批量设置全景。`
  }
  return `选中的 ${total} 件中有 ${unsupported} 件不支持可见环境背景；「显示环境背景」只会对其余 ${supported} 件生效。`
}

/** 「显示环境背景」批量项的警告文案；无警告时返回空串 */
export function batchBgvisWarn({ ops = [], picked = [], enBgvis, enPano, enPanoClear, enEpreset, epreset = 'room' } = {}) {
  if (!enBgvis) return ''
  const effect = inferBatchEnvEffect(ops)
  if (effect.kind === 'panorama') return ''
  if (effect.kind === 'preset') {
    const p = effect.preset || 'room'
    return supportsVisibleBackground({ environment: { mode: 'preset', preset: p } }) ? '' : ROOM_BG_WARN
  }
  if (enPano && !enPanoClear && ops.some(o => o.path === 'assets.panorama' && String(o.value ?? '').trim()))
    return ''
  if (enEpreset) {
    const p = epreset || 'room'
    return supportsVisibleBackground({ environment: { mode: 'preset', preset: p } }) ? '' : ROOM_BG_WARN
  }
  return batchBgvisWarnFromCards(picked)
}
