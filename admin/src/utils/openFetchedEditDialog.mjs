/**
 * 再开编辑：先拉完详情再填表，不要先把封面/图片地址清空再 await。
 * 关窗动画里预览组件还在，地址被清空会让图片进失败态，再赋新地址也不一定恢复。
 * 连点两条时，过期请求不得回填。
 */

export function createFetchedEditDialogSession() {
  let seq = 0
  return {
    begin() {
      seq += 1
      return seq
    },
    isCurrent(requestSeq) {
      return requestSeq === seq
    }
  }
}

export async function openFetchedEditDialog({
  row,
  session,
  resetForm,
  fetchDetail,
  applyDetail,
  setEditingId,
  setDialogVisible
}) {
  const seq = session.begin()
  const editingId = row && row.id != null ? row.id : null
  setEditingId(editingId)
  if (editingId == null) {
    resetForm()
    if (session.isCurrent(seq)) {
      setDialogVisible(true)
    }
    return { outcome: 'create', seq }
  }
  const detail = await fetchDetail(editingId)
  if (!session.isCurrent(seq)) {
    return { outcome: 'stale', seq }
  }
  await applyDetail(detail)
  if (!session.isCurrent(seq)) {
    return { outcome: 'stale', seq }
  }
  setDialogVisible(true)
  return { outcome: 'loaded', seq }
}
