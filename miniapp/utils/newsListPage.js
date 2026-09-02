// utils/newsListPage.js — 动态列表分页辅助（Tab 页 / 分包列表共用）

const DEFAULT_PAGE_SIZE = 10

function extractPageRecords(res) {
  if (res && Array.isArray(res.records)) return res.records
  if (Array.isArray(res)) return res
  return []
}

function mergePageRecords(existing, records, reset) {
  const base = reset ? [] : (existing || [])
  return base.concat(records || [])
}

function calcHasMore(records, pageSize) {
  return (records || []).length >= pageSize
}

/**
 * 自动触底在分页失败后必须停住，只有显式点击重试才能再次请求同一页。
 */
function shouldRequestNextPage({ hasMore, loading, loadMoreError }, manualRetry = false) {
  if (!hasMore || loading) return false
  return manualRetry ? !!loadMoreError : !loadMoreError
}

/**
 * 分页失败只结束 loading 并展示重试入口；不覆盖 page / hasMore。
 */
function buildLoadMoreFailurePatch() {
  return {
    loading: false,
    loadMoreError: true
  }
}

function filterByCategory(list, categoryName) {
  if (!categoryName || categoryName === '全部') return list || []
  return (list || []).filter(n => (n.category || n.categoryName) === categoryName)
}

function sliceMockPage(list, page, pageSize) {
  const size = pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE
  const start = (Math.max(page, 1) - 1) * size
  return (list || []).slice(start, start + size)
}

function mockHasMore(fullList, page, pageSize) {
  const size = pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE
  return page * size < (fullList || []).length
}

module.exports = {
  DEFAULT_PAGE_SIZE,
  extractPageRecords,
  mergePageRecords,
  calcHasMore,
  shouldRequestNextPage,
  buildLoadMoreFailurePatch,
  filterByCategory,
  sliceMockPage,
  mockHasMore
}
