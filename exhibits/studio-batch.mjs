/** 工作台批量字段模式过滤（纯函数，可单测） */

export function batchFieldApplies(field, mode, leader) {
  if (leader === 'straight') return false
  if (!field.modes) return true
  return field.modes.includes(mode)
}

export function batchFieldModeOff(field, mode, leader) {
  return !batchFieldApplies(field, mode, leader)
}

/** 与 studio.html enabledOps 等价的纯数据收集 */
export function collectBatchOps(fields, state) {
  const ops = []
  for (const f of Object.values(fields)) {
    if (!state.enabled(f.id)) continue
    if (state.modeOff(f.id)) continue
    if (f.type === 'scheme') {
      for (const [p, v] of state.schemeOps(f.id) || []) ops.push({ path: p, value: v })
      continue
    }
    const v = state.value(f)
    if (f.type === 'text' && v === '') continue
    ops.push({ path: f.path, value: v })
  }
  return ops
}
