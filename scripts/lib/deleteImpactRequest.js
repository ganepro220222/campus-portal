/** @param {{ requestedId: number, requestedType?: string, currentId: number|null, currentType?: string|null, seq: number, latestSeq: number, dialogVisible: boolean }} params */
function shouldApplyDeleteImpactResult(params) {
  const { requestedId, requestedType, currentId, currentType, seq, latestSeq, dialogVisible } = params
  if (!dialogVisible) return false
  if (seq !== latestSeq) return false
  if (currentId !== requestedId) return false
  if (requestedType !== undefined && currentType !== requestedType) return false
  return true
}

function deleteImpactMatchesPending(impact, pendingId, pendingType) {
  if (!impact || pendingId == null) return false
  if (impact.id !== pendingId) return false
  if (pendingType != null && impact.type != null && impact.type !== pendingType) return false
  return true
}

module.exports = { shouldApplyDeleteImpactResult, deleteImpactMatchesPending }
