/**
 * 反馈后台列表：回复后按当前筛选重载，避免待处理队列残留已回复行。
 */

export const FEEDBACK_REPLY_SUCCESS_MESSAGE = '回复已保存，并已发送至用户消息中心'

export function loadFeedbackListPage({
  page,
  pageSize,
  statusFilter,
  fetchFeedbacks,
  normalizeListPage
}) {
  const safePage = page > 0 ? page : 1
  const safeSize = pageSize > 0 ? pageSize : 20
  return fetchFeedbacks(safePage, safeSize, statusFilter).then((first) => {
    const nextPage = normalizeListPage(safePage, first.total, safeSize)
    if (nextPage === safePage) {
      return {
        page: safePage,
        records: Array.isArray(first.records) ? first.records : [],
        total: Number(first.total) || 0
      }
    }
    return fetchFeedbacks(nextPage, safeSize, statusFilter).then((second) => ({
      page: nextPage,
      records: Array.isArray(second.records) ? second.records : [],
      total: Number(second.total) || 0
    }))
  })
}

export async function reloadFeedbackListQuietly(reloadList) {
  try {
    await reloadList()
    return { reloadFailed: false }
  } catch {
    return { reloadFailed: true }
  }
}

/**
 * 先保存回复，再重载当前筛选页。
 * 重载失败不改变「回复已保存」的结论，也不当作回复失败。
 */
export async function runFeedbackReplyAndReload({
  currentId,
  reply,
  replyFeedback,
  reloadList,
  onSaved
}) {
  const updated = await replyFeedback(currentId, reply)
  const successMessage = FEEDBACK_REPLY_SUCCESS_MESSAGE
  if (typeof onSaved === 'function') {
    onSaved({ updated, successMessage })
  }
  const refresh = await reloadFeedbackListQuietly(reloadList)
  return {
    updated,
    successMessage,
    reloadFailed: refresh.reloadFailed
  }
}
