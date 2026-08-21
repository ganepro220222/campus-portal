// utils/profileListPage.js — 个人中心列表页：数据归一化与视图状态

const { groupFootprintsByDate } = require('./footprintTimeline')
const { mapDownloadRecordItem } = require('./downloadRecord')

const ENROLL_STATUS = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
}

function normalizeProfileListItem(type, item) {
  if (type === 'enrolls') {
    const statusLabel = ENROLL_STATUS[item.status] || item.status
    const activityHint = item.activityStatusLabel || ''
    return {
      ...item,
      title: item.activityTitle,
      subtitle: item.activityLocation,
      statusLabel: activityHint ? `${statusLabel} · ${activityHint}` : statusLabel,
      statusClass: item.status || 'pending',
      route: item.activityStatus === 'cancelled' || !item.activityId
        ? ''
        : `/packageC/activity/detail?id=${item.activityId}`
    }
  }
  if (type === 'footprints') {
    return item
  }
  if (type === 'downloads') {
    return mapDownloadRecordItem(item)
  }
  if (type === 'badges') {
    return { ...item, title: item.name, createTime: item.achievedAt }
  }
  if (type === 'favorites') {
    return {
      ...item,
      subtitle: item.targetTypeLabel || ''
    }
  }
  return item
}

function normalizeProfileList(type, list) {
  return (list || []).map(item => normalizeProfileListItem(type, item))
}

function buildLoadedViewState(type, raw) {
  if (type === 'footprints') {
    const timelineGroups = groupFootprintsByDate(raw || [])
    return {
      timelineGroups,
      list: [],
      isEmpty: !timelineGroups.length,
      error: false,
      refreshError: false,
      loading: false
    }
  }
  const list = normalizeProfileList(type, raw)
  return {
    timelineGroups: [],
    list,
    isEmpty: !list.length,
    error: false,
    refreshError: false,
    loading: false
  }
}

function buildErrorViewState(prev) {
  const hasContent = !!(prev.list && prev.list.length)
    || !!(prev.timelineGroups && prev.timelineGroups.length)
  return {
    loading: false,
    error: true,
    refreshError: false,
    isEmpty: !hasContent
  }
}

function buildSilentRefreshErrorViewState() {
  return { refreshError: true }
}

function shouldShowRefreshErrorBar(refreshError, loading, hasContent) {
  return !!refreshError && !loading && !!hasContent
}

function shouldShowBusinessEmpty(isEmpty, error) {
  return isEmpty && !error
}

function shouldShowLoadError(error, loading) {
  return error && !loading
}

/** 从详情返回后需刷新的列表类型（取消收藏/取消报名等） */
const REFRESH_ON_SHOW_TYPES = new Set(['favorites', 'enrolls'])

function shouldRefreshOnShow(hasShownOnce, type) {
  if (!hasShownOnce) return false
  return REFRESH_ON_SHOW_TYPES.has(type)
}

function shouldSilentRefresh(prev) {
  return !!(prev.list && prev.list.length)
    || !!(prev.timelineGroups && prev.timelineGroups.length)
}

module.exports = {
  normalizeProfileList,
  normalizeProfileListItem,
  buildLoadedViewState,
  buildErrorViewState,
  buildSilentRefreshErrorViewState,
  shouldShowBusinessEmpty,
  shouldShowLoadError,
  shouldShowRefreshErrorBar,
  REFRESH_ON_SHOW_TYPES,
  shouldRefreshOnShow,
  shouldSilentRefresh
}
