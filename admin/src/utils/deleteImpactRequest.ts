/** 删除影响预览：仅当弹窗仍打开且 pending 未变时才应用响应 */
export function shouldApplyDeleteImpactResult(params: {
  requestedId: number
  requestedType?: string
  currentId: number | null
  currentType?: string | null
  seq: number
  latestSeq: number
  dialogVisible: boolean
}): boolean {
  const { requestedId, requestedType, currentId, currentType, seq, latestSeq, dialogVisible } = params
  if (!dialogVisible) {
    return false
  }
  if (seq !== latestSeq) {
    return false
  }
  if (currentId !== requestedId) {
    return false
  }
  if (requestedType !== undefined && currentType !== requestedType) {
    return false
  }
  return true
}

/** 确认删除前：影响预览必须与 pending 目标一致 */
export function deleteImpactMatchesPending(
  impact: { id: number; type?: string } | null | undefined,
  pendingId: number | null,
  pendingType?: string | null
): boolean {
  if (!impact || pendingId == null) {
    return false
  }
  if (impact.id !== pendingId) {
    return false
  }
  if (pendingType != null && impact.type != null && impact.type !== pendingType) {
    return false
  }
  return true
}
