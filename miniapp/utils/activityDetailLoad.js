// utils/activityDetailLoad.js — 活动详情加载：错误分类与通用视图状态

function classifyActivityLoadError(err) {
  const code = err && (err.code != null ? err.code : err.statusCode)
  if (code === 404) return 'notFound'
  if (err && err.kind === 'notFound') return 'notFound'
  return 'loadError'
}

function assertActivityDetailRaw(raw, activityId) {
  if (!raw || raw.id == null) {
    const err = new Error('activity detail unavailable')
    err.kind = 'notFound'
    throw err
  }
  if (String(raw.id) !== String(activityId)) {
    const err = new Error('activity id mismatch')
    err.kind = 'notFound'
    throw err
  }
}

function buildActivityDetailLoadingPatch() {
  return {
    loading: true,
    loadError: false,
    notFound: false,
    refreshError: false,
    detail: null
  }
}

function buildActivityDetailFailurePatch(err) {
  const kind = classifyActivityLoadError(err)
  return {
    loading: false,
    detail: null,
    loadError: kind === 'loadError',
    notFound: kind === 'notFound',
    refreshError: false
  }
}

function resolveActivityDetailPagePhase(state) {
  if (state.loading) return 'loading'
  if (state.loadError) return 'loadError'
  if (state.notFound) return 'notFound'
  if (state.detail && state.detail.id != null) return 'content'
  return 'notFound'
}

function hasRenderableActivityDetail(detail) {
  return !!(detail && detail.id != null)
}

function shouldSilentRefreshDetail(prev) {
  return hasRenderableActivityDetail(prev && prev.detail)
}

function shouldShowDetailRefreshBar(refreshError, loading, hasContent) {
  return !!refreshError && !loading && !!hasContent
}

function shouldShowDetailFootBar(state) {
  if (!state || state.loading || state.loadError || state.notFound) return false
  return hasRenderableActivityDetail(state.detail)
}

module.exports = {
  classifyActivityLoadError,
  assertActivityDetailRaw,
  buildActivityDetailLoadingPatch,
  buildActivityDetailFailurePatch,
  resolveActivityDetailPagePhase,
  hasRenderableActivityDetail,
  shouldSilentRefreshDetail,
  shouldShowDetailRefreshBar,
  shouldShowDetailFootBar
}
