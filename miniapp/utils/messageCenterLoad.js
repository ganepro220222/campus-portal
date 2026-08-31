// utils/messageCenterLoad.js — 消息中心：失败不能伪装成空列表

function unreadCountFrom(list, stats) {
  const messages = Array.isArray(list) ? list : []
  if (stats && typeof stats.unreadMessages === 'number') {
    return stats.unreadMessages
  }
  return messages.filter((m) => m && m.readStatus === 0).length
}

function buildMessageLoadingPatch(hasList) {
  if (hasList) {
    return { loading: false, error: false, refreshError: false }
  }
  return { loading: true, error: false, refreshError: false }
}

function buildMessageLoadedPatch(list, stats) {
  const messages = Array.isArray(list) ? list : []
  return {
    list: messages,
    unreadCount: unreadCountFrom(messages, stats),
    loading: false,
    error: false,
    refreshError: false
  }
}

function buildMessageFailurePatch(hasList) {
  if (hasList) {
    return { loading: false, error: false, refreshError: true }
  }
  return { loading: false, error: true, refreshError: false }
}

function shouldShowMessageEmpty(loading, error, listLength) {
  return !loading && !error && !listLength
}

module.exports = {
  unreadCountFrom,
  buildMessageLoadingPatch,
  buildMessageLoadedPatch,
  buildMessageFailurePatch,
  shouldShowMessageEmpty
}
