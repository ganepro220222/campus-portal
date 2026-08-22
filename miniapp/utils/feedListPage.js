// utils/feedListPage.js — Tab/列表页：加载失败与静默刷新（逻辑层）

const { classifyActivityLoadError } = require('./activityDetailLoad')

/** 列表加载意图预设（不要把 reset 同时当「清列表 / 阻断加载 / 失败保留」用） */
const FEED_LOAD = {
  /** 首次进入或全屏错误后重试：无内容时 skeleton，失败全屏错误 */
  initial: {
    replaceOnSuccess: true,
    preserveOnFailure: false,
    showBlockingLoading: true,
    clearListOnStart: false
  },
  /** 下拉刷新：保留旧列表，失败走 refreshError 横幅 */
  pullRefresh: {
    replaceOnSuccess: true,
    preserveOnFailure: true,
    showBlockingLoading: false,
    clearListOnStart: false
  },
  /** 分类切换：清空旧分类内容，失败全屏错误 */
  categorySwitch: {
    replaceOnSuccess: true,
    preserveOnFailure: false,
    showBlockingLoading: true,
    clearListOnStart: true
  },
  /** 加载下一页：保留已有内容，失败走 refreshError */
  loadMore: {
    replaceOnSuccess: false,
    preserveOnFailure: true,
    showBlockingLoading: false,
    clearListOnStart: false
  }
}

function normalizeFeedLoadOptions(input) {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return { ...FEED_LOAD.initial, ...input }
  }
  if (input && FEED_LOAD[input]) {
    return { ...FEED_LOAD[input] }
  }
  // 兼容旧调用：true ≈ initial，false ≈ loadMore
  if (input === true) return { ...FEED_LOAD.initial }
  if (input === false) return { ...FEED_LOAD.loadMore }
  return { ...FEED_LOAD.initial }
}

function buildFeedLoadingPatch(options, prev, listKey) {
  const opts = normalizeFeedLoadOptions(options)
  const patch = {
    error: false,
    refreshError: false
  }
  if (opts.clearListOnStart && listKey) {
    patch[listKey] = []
  }
  if (!opts.replaceOnSuccess) {
    return { ...patch, loadingMore: true }
  }
  return { ...patch, loading: true, loadingMore: false }
}

function buildFeedLoadedPatch(listKey, list, page, hasMore) {
  return {
    [listKey]: list,
    page,
    hasMore: list.length ? hasMore : false,
    loading: false,
    loadingMore: false,
    error: false,
    refreshError: false
  }
}

function buildFeedFailurePatch(err, prev, listKey) {
  const hasContent = !!(prev && prev[listKey] && prev[listKey].length)
  if (hasContent) {
    return {
      loading: false,
      loadingMore: false,
      refreshError: true
    }
  }
  const kind = classifyActivityLoadError(err)
  return {
    loading: false,
    loadingMore: false,
    error: kind === 'loadError',
    notFound: kind === 'notFound',
    refreshError: false,
    [listKey]: [],
    hasMore: false
  }
}

function prevForFeedFailure(options, prev, listKey) {
  const opts = normalizeFeedLoadOptions(options)
  const hasContent = !!(prev && prev[listKey] && prev[listKey].length)
  if (opts.preserveOnFailure && hasContent) {
    return prev
  }
  return { [listKey]: [] }
}

function resolveFeedRetryMode(listLength) {
  return listLength > 0 ? FEED_LOAD.pullRefresh : FEED_LOAD.initial
}

function bumpListGeneration(page) {
  const next = (page._listGeneration || 0) + 1
  page._listGeneration = next
  return next
}

function isStaleListRequest(page, generation) {
  return generation !== page._listGeneration
}

/** 分类列表：generation 过期或 activeCat 已变则丢弃 */
function isStaleCategoryRequest(page, generation, catIndex) {
  if (isStaleListRequest(page, generation)) return true
  return catIndex !== page.data.activeCat
}

function shouldShowFeedLoadError(error, loading, listLength) {
  return !!error && !loading && !listLength
}

function shouldShowFeedRefreshBar(refreshError, loading, listLength) {
  return !!refreshError && !loading && !!listLength
}

module.exports = {
  FEED_LOAD,
  normalizeFeedLoadOptions,
  buildFeedLoadingPatch,
  buildFeedLoadedPatch,
  buildFeedFailurePatch,
  prevForFeedFailure,
  resolveFeedRetryMode,
  bumpListGeneration,
  isStaleListRequest,
  isStaleCategoryRequest,
  shouldShowFeedLoadError,
  shouldShowFeedRefreshBar
}
