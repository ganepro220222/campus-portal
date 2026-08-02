/** 工作台批量字段模式过滤（纯函数，可单测） */

export function batchFieldApplies(field, mode, leader) {
  if (field.leaders?.length && !field.leaders.includes(leader)) return false
  if (!field.modes) return true
  return field.modes.includes(mode)
}

export function batchFieldModeOff(field, mode, leader) {
  return !batchFieldApplies(field, mode, leader)
}

/**
 * 与 studio.html enabledOps 等价的纯数据收集。
 *
 * type='angle' 是灯光方位用的复合字段：方位角与仰角必须成对写入。
 * 批量的语义是「把这批展品统一设成同一个值」，只写方位角、让各展品保留各自的仰角
 * 既说不清也做不到 —— ops 是一次算好后套到每件展品上的，不知道对方原来的仰角。
 */
export function collectBatchOps(fields, state) {
  const ops = []
  for (const f of Object.values(fields)) {
    if (!state.enabled(f.id)) continue
    if (state.modeOff(f.id)) continue
    if (state.applies && !state.applies(f)) continue
    if (f.type === 'scheme') {
      for (const [p, v] of state.schemeOps(f.id) || []) ops.push({ path: p, value: v })
      continue
    }
    if (f.type === 'angle') {
      const pos = state.anglePosition(f)
      if (pos) ops.push({ path: f.path, value: pos })
      continue
    }
    if (f.type === 'action') {
      if (f.expandOps) for (const op of f.expandOps(true)) ops.push(op)
      continue
    }
    const v = state.value(f)
    if (f.type === 'text' && v === '') continue
    if (f.expandOps) {
      for (const op of f.expandOps(v)) ops.push(op)
      continue
    }
    ops.push({ path: f.path, value: v })
  }
  return ops
}
