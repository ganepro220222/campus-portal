/**
 * 动态编辑弹窗：正文按需加载用代际号隔离交错请求。
 * 每次打开都先结束上一轮详情态，避免新建继承旧 loading。
 */

export function createNewsDetailDialogSession() {
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

export function isNewsDraftSaveLocked({ saving, detailLoading }) {
  return Boolean(saving || detailLoading)
}

export async function openNewsDetailDialog({
  row,
  session,
  resetForm,
  applyForm,
  fetchDetail,
  setEditingId,
  setDialogVisible,
  setDetailLoading,
  onLoadError
}) {
  const seq = session.begin()
  setDetailLoading(false)
  resetForm()
  const editingId = row && row.id != null ? row.id : null
  setEditingId(editingId)
  setDialogVisible(true)
  if (editingId == null) {
    return { outcome: 'create', seq }
  }

  applyForm(row)
  setDetailLoading(true)
  try {
    const detail = await fetchDetail(editingId)
    if (!session.isCurrent(seq)) {
      return { outcome: 'stale', seq }
    }
    applyForm(detail)
    return { outcome: 'loaded', seq }
  } catch {
    if (!session.isCurrent(seq)) {
      return { outcome: 'stale', seq }
    }
    if (typeof onLoadError === 'function') {
      onLoadError()
    }
    setDialogVisible(false)
    return { outcome: 'error', seq }
  } finally {
    if (session.isCurrent(seq)) {
      setDetailLoading(false)
    }
  }
}
