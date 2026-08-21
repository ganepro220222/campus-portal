// utils/detailPageInit.js — 活动详情页：加载成功/失败视图

const {
  mergeActivityDetail,
  resolveDetailAction,
  enrollStatusLabel
} = require('./activity')
const {
  assertActivityDetailRaw,
  classifyActivityLoadError,
  buildActivityDetailLoadingPatch,
  buildActivityDetailFailurePatch,
  hasRenderableActivityDetail
} = require('./activityDetailLoad')

function buildDetailLoadedView(raw, activityId, isLoggedIn, decorateDetail) {
  assertActivityDetailRaw(raw, activityId)
  const merged = mergeActivityDetail(raw)
  if (!hasRenderableActivityDetail(merged)) {
    const err = new Error('activity detail unavailable')
    err.kind = 'notFound'
    throw err
  }
  const decorated = decorateDetail(merged)
  const action = resolveDetailAction(merged, isLoggedIn)
  return {
    loading: false,
    loadError: false,
    notFound: false,
    refreshError: false,
    detail: {
      ...merged,
      coverImageMode: decorated.coverImageMode
    },
    coverClass: decorated.colorClass || 'hc1',
    actionType: action.actionType,
    actionHint: action.hint,
    statusLabel: enrollStatusLabel(merged.enrollStatus)
  }
}

function buildDetailInitialFailurePatch(err) {
  return {
    ...buildActivityDetailFailurePatch(err),
    coverClass: 'hc1',
    actionType: 'loading',
    actionHint: '',
    statusLabel: ''
  }
}

function buildDetailRefreshFailurePatch(err, prev) {
  const hasContent = hasRenderableActivityDetail(prev && prev.detail)
  if (!hasContent) {
    return buildDetailInitialFailurePatch(err)
  }
  const kind = classifyActivityLoadError(err)
  if (kind === 'notFound') {
    return buildDetailInitialFailurePatch(err)
  }
  return {
    loading: false,
    refreshError: true,
    loadError: false,
    notFound: false
  }
}

function shouldRefreshDetailOnShow(hasShownOnce, loading) {
  if (!hasShownOnce) return false
  return !loading
}

function buildDetailMissingIdPatch() {
  return buildDetailInitialFailurePatch({
    code: 404,
    message: 'missing activity id'
  })
}

function resolveDetailOnLoad(opts) {
  const safeOpts = opts || {}
  const id = safeOpts.id || safeOpts.activityId
  if (!id) {
    return {
      shouldLoad: false,
      activityId: null,
      patch: {
        activityId: null,
        ...buildDetailMissingIdPatch()
      }
    }
  }
  return {
    shouldLoad: true,
    activityId: id,
    patch: { activityId: id }
  }
}

module.exports = {
  buildDetailLoadedView,
  buildDetailInitialFailurePatch,
  buildDetailRefreshFailurePatch,
  buildDetailMissingIdPatch,
  resolveDetailOnLoad,
  buildDetailLoadingPatch: buildActivityDetailLoadingPatch,
  shouldRefreshDetailOnShow
}
