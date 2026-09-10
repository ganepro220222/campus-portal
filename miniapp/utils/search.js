// utils/search.js — 搜索结果映射、复合 key 与分页

const TYPE_ROUTES = {
  news: (id) => `/packageA/news/detail?id=${id}`,
  hall: (id) => `/packageA/hall/detail?id=${id}`,
  craft: (id) => `/packageA/craft/detail?id=${id}`,
  course: (id) => `/packageB/course/detail?id=${id}`,
  resource: () => '/packageB/resource/list'
}

const SEARCH_PAGE_SIZE = 20
const SEARCH_TYPES = 'news,hall,craft,course,resource'

function searchKeyOf(it) {
  const type = it && it.targetType != null ? String(it.targetType) : ''
  const id = it && it.targetId != null ? String(it.targetId) : ''
  return type + ':' + id
}

function buildRoute(type, id) {
  const fn = TYPE_ROUTES[type]
  return fn ? fn(id) : ''
}

function mapSearchResults(records) {
  return (records || []).map((it) => ({
    ...it,
    searchKey: searchKeyOf(it),
    typeLabel: it.typeLabel || it.targetType,
    sub: it.sub || it.summary || '',
    route: it.route || buildRoute(it.targetType, it.targetId)
  }))
}

function extractSearchPage(res) {
  const records = res && Array.isArray(res.records) ? res.records : []
  let total = records.length
  if (res && res.total != null && res.total !== '') {
    const n = Number(res.total)
    if (Number.isFinite(n) && n >= 0) total = n
  }
  return { records, total }
}

function mergeSearchResults(existing, incoming, reset) {
  const mapped = mapSearchResults(incoming)
  if (reset) return mapped
  const seen = new Set((existing || []).map((row) => row.searchKey))
  const out = (existing || []).slice()
  for (let i = 0; i < mapped.length; i++) {
    const row = mapped[i]
    if (seen.has(row.searchKey)) continue
    seen.add(row.searchKey)
    out.push(row)
  }
  return out
}

function calcSearchHasMore(loadedCount, total) {
  return Number(loadedCount) < Number(total)
}

function shouldLoadSearchMore(state, manualRetry) {
  if (!state || !state.hasMore || state.loading || state.loadingMore) return false
  return manualRetry ? !!state.loadMoreError : !state.loadMoreError
}

function sliceSearchPage(list, page, pageSize) {
  const size = pageSize > 0 ? pageSize : SEARCH_PAGE_SIZE
  const start = (Math.max(page, 1) - 1) * size
  const all = list || []
  return {
    records: all.slice(start, start + size),
    total: all.length
  }
}

/** 关键词、代际、请求页任一不对，说明这条响应已经过期 */
function isStaleSearchResponse(page, generation, keyword, requestPage) {
  if (!page) return true
  if (generation !== page._listGeneration) return true
  if ((page.data.keyword || '').trim() !== keyword) return true
  if (Number(page.data.page) !== Number(requestPage)) return true
  return false
}

module.exports = {
  SEARCH_PAGE_SIZE,
  SEARCH_TYPES,
  searchKeyOf,
  mapSearchResults,
  buildRoute,
  extractSearchPage,
  mergeSearchResults,
  calcSearchHasMore,
  shouldLoadSearchMore,
  sliceSearchPage,
  isStaleSearchResponse
}
