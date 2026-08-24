/** 工作台批量字段模式过滤（纯函数，可单测） */

/**
 * 允许进批量的相机字段白名单。
 *
 * 批量的语义是「一个值套到 N 件展品上」，所以只有**与器物尺度无关**的字段才配得上：
 *   - camera.portraitFill    占屏「比例」。真正的距离由 fitCameraDistance() 按各自的包围盒反解，
 *                            同一个 0.78 套到 3 米的碑和 8 厘米的印章上，取景松紧观感一致。
 *   - camera.fov             视野角，纯观感风格。
 *   - camera.autoRotateSpeed 转速，纯观感风格。
 *
 * 反过来，camera.distance / minDistance / maxDistance / pivot 是**绝对长度**，
 * 与器物自身尺寸死绑：同一个 1.8 的最近距离，对大件够不着、对小件直接把取景夹死
 * （见 player.html autoFitDistance() 末尾的 clamp）。这类字段必须留在单件编辑器里，
 * 任何时候都不要往批量注册表里加。
 */
export const BATCH_SAFE_CAMERA_PATHS = Object.freeze([
  'camera.portraitFill',
  'camera.fov',
  'camera.autoRotateSpeed',
])

/** 该 config 路径是否允许出现在批量注册表里（非 camera.* 一律放行，本约束只管相机）。 */
export function isBatchSafeCameraPath(path) {
  const p = String(path ?? '')
  if (!p.startsWith('camera.')) return true
  return BATCH_SAFE_CAMERA_PATHS.includes(p)
}

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
