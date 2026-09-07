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

/**
 * 乐观标已读。未读总数以服务端 stats 为准，不能用当前页 list.filter 重算：
 * 列表最多 100 条，总未读可能更大。
 */
function markMessageReadLocally(list, unreadCount, id) {
  const messages = Array.isArray(list) ? list : []
  if (id == null || id === '') {
    return { changed: 0, list: messages, unreadCount: Math.max(0, Number(unreadCount) || 0) }
  }
  const target = String(id)
  let changed = 0
  const nextList = messages.map((item) => {
    if (!item || String(item.id) !== target || Number(item.readStatus) === 1) {
      return item
    }
    changed += 1
    return { ...item, readStatus: 1 }
  })
  return {
    changed,
    list: nextList,
    unreadCount: Math.max(0, (Number(unreadCount) || 0) - changed)
  }
}

/** 无落地页时标已读失败：把该行和角标滚回去，不能一直假装已读。 */
function revertMessageReadLocally(list, unreadCount, id) {
  const messages = Array.isArray(list) ? list : []
  if (id == null || id === '') {
    return { changed: 0, list: messages, unreadCount: Math.max(0, Number(unreadCount) || 0) }
  }
  const target = String(id)
  let changed = 0
  const nextList = messages.map((item) => {
    if (!item || String(item.id) !== target || Number(item.readStatus) !== 1) {
      return item
    }
    changed += 1
    return { ...item, readStatus: 0 }
  })
  return {
    changed,
    list: nextList,
    unreadCount: (Number(unreadCount) || 0) + changed
  }
}

module.exports = {
  unreadCountFrom,
  buildMessageLoadingPatch,
  buildMessageLoadedPatch,
  buildMessageFailurePatch,
  shouldShowMessageEmpty,
  markMessageReadLocally,
  revertMessageReadLocally
}
