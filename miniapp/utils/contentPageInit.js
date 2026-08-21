// utils/contentPageInit.js — 内容详情页：加载状态（逻辑层，视觉样式由 UI 批次对接）

const {
  assertActivityDetailRaw,
  classifyActivityLoadError,
  buildActivityDetailLoadingPatch,
  buildActivityDetailFailurePatch,
  hasRenderableActivityDetail
} = require('./activityDetailLoad')

function buildContentDetailMissingIdPatch(contentKey) {
  return buildContentDetailInitialFailurePatch(
    { code: 404, message: 'missing content id' },
    contentKey
  )
}

function buildContentDetailInitialFailurePatch(err, contentKey) {
  return {
    ...buildActivityDetailFailurePatch(err),
    [contentKey]: null
  }
}

function buildContentDetailRefreshFailurePatch(err, prev, contentKey) {
  const hasContent = hasRenderableContent(prev, contentKey)
  if (!hasContent) {
    return buildContentDetailInitialFailurePatch(err, contentKey)
  }
  if (classifyActivityLoadError(err) === 'notFound') {
    return buildContentDetailInitialFailurePatch(err, contentKey)
  }
  return {
    loading: false,
    refreshError: true,
    loadError: false,
    notFound: false
  }
}

function hasRenderableContent(state, contentKey) {
  return hasRenderableActivityDetail(state && state[contentKey])
}

function shouldSilentRefreshContent(prev, contentKey) {
  return hasRenderableContent(prev, contentKey)
}

function shouldRefreshContentOnShow(hasShownOnce, loading) {
  if (!hasShownOnce) return false
  return !loading
}

function resolveContentDetailOnLoad(opts, options = {}) {
  const idKeys = options.idKeys || ['id']
  const contentKey = options.contentKey || 'content'
  const safeOpts = opts || {}
  let contentId = null
  for (const key of idKeys) {
    if (safeOpts[key]) {
      contentId = safeOpts[key]
      break
    }
  }
  if (!contentId) {
    return {
      shouldLoad: false,
      contentId: null,
      contentKey,
      patch: {
        contentId: null,
        ...buildContentDetailMissingIdPatch(contentKey)
      }
    }
  }
  return {
    shouldLoad: true,
    contentId,
    contentKey,
    patch: { contentId }
  }
}

function buildContentDetailLoadedView(raw, contentId, contentKey, mergeFn, mapExtra) {
  assertActivityDetailRaw(raw, contentId)
  const merged = mergeFn(raw)
  if (!hasRenderableActivityDetail(merged)) {
    const err = new Error('content detail unavailable')
    err.kind = 'notFound'
    throw err
  }
  return {
    loading: false,
    loadError: false,
    notFound: false,
    refreshError: false,
    [contentKey]: merged,
    ...(typeof mapExtra === 'function' ? mapExtra(raw, merged) : {})
  }
}

function buildContentDetailLoadingPatch(contentKey) {
  return {
    ...buildActivityDetailLoadingPatch(),
    [contentKey]: null
  }
}

function canInteractWithContent(state, contentKey, contentIdKey = 'contentId') {
  if (!state || state.loading || state.loadError || state.notFound) return false
  if (!hasRenderableContent(state, contentKey)) return false
  const expectId = state[contentIdKey]
  if (!expectId) return false
  if (String(state[contentKey].id) !== String(expectId)) return false
  return true
}

module.exports = {
  buildContentDetailMissingIdPatch,
  buildContentDetailInitialFailurePatch,
  buildContentDetailRefreshFailurePatch,
  buildContentDetailLoadedView,
  buildContentDetailLoadingPatch,
  resolveContentDetailOnLoad,
  hasRenderableContent,
  shouldSilentRefreshContent,
  shouldRefreshContentOnShow,
  canInteractWithContent
}
