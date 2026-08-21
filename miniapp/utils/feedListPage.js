// utils/feedListPage.js — Tab/列表页：加载失败与静默刷新（逻辑层）

const { classifyActivityLoadError } = require('./activityDetailLoad')

function buildFeedLoadingPatch(reset) {
  if (reset) {
    return { loading: true, loadingMore: false, error: false, refreshError: false }
  }
  return { loadingMore: true }
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

function shouldShowFeedLoadError(error, loading, listLength) {
  return !!error && !loading && !listLength
}

function shouldShowFeedRefreshBar(refreshError, loading, listLength) {
  return !!refreshError && !loading && !!listLength
}

module.exports = {
  buildFeedLoadingPatch,
  buildFeedLoadedPatch,
  buildFeedFailurePatch,
  shouldShowFeedLoadError,
  shouldShowFeedRefreshBar
}
