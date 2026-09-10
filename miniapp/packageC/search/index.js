// packageC/search/index.js — 全局搜索逻辑
const { get } = require('../../utils/request')
const {
  SEARCH_PAGE_SIZE,
  SEARCH_TYPES,
  mapSearchResults,
  extractSearchPage,
  mergeSearchResults,
  calcSearchHasMore,
  shouldLoadSearchMore,
  sliceSearchPage,
  isStaleSearchResponse
} = require('../../utils/search')
const mock = require('../../mock/defaults')
const { useMock } = require('../../utils/mockGuard')
const { loadMiniappConfig, DEFAULT_MINIAPP_CONFIG } = require('../../utils/miniappConfig')
const { bumpListGeneration } = require('../../utils/feedListPage')

const HISTORY_KEY = 'search_history'

function emptySearchState(extra) {
  return Object.assign({
    results: [],
    total: 0,
    page: 1,
    hasMore: false,
    loading: false,
    loadingMore: false,
    loadMoreError: false,
    errorText: ''
  }, extra || {})
}

// 接口不可用时的本地检索索引（仅 dev mock 模式）
function localIndex() {
  const idx = []
  ;(mock.newsFull || []).forEach(n => idx.push({ title: n.title, targetType: 'news', targetId: n.id, typeLabel: '动态', sub: n.category }))
  ;(mock.hallsFull || []).forEach(h => idx.push({ title: h.name, targetType: 'hall', targetId: h.id, typeLabel: '展馆', sub: h.desc }))
  ;(mock.crafts || []).forEach(c => idx.push({ title: c.name, targetType: 'craft', targetId: c.id, typeLabel: '文创', sub: c.intro }))
  ;(mock.coursesFull || []).forEach(c => idx.push({ title: c.name, targetType: 'course', targetId: c.id, typeLabel: '课程', sub: c.desc }))
  ;(mock.resources || []).forEach(r => idx.push({ title: r.name, targetType: 'resource', targetId: r.id, typeLabel: '资源', sub: r.categoryName }))
  return idx
}

function localSearchAll(q) {
  const kw = q.toLowerCase()
  return mapSearchResults(
    localIndex().filter(it => (it.title || '').toLowerCase().indexOf(kw) >= 0 || (it.sub || '').toLowerCase().indexOf(kw) >= 0)
  )
}

Page({
  data: {
    keyword: '',
    results: [],
    total: 0,
    page: 1,
    hasMore: false,
    searched: false,
    loading: false,
    loadingMore: false,
    loadMoreError: false,
    errorText: '',
    hotTags: DEFAULT_MINIAPP_CONFIG.searchHotTags,
    history: []
  },

  onLoad() {
    this.setData({ history: wx.getStorageSync(HISTORY_KEY) || [] })
    loadMiniappConfig().then((cfg) => {
      if (cfg && cfg.searchHotTags && cfg.searchHotTags.length) {
        this.setData({ hotTags: cfg.searchHotTags })
      }
    }).catch(() => {})
  },

  onInput(e) { this.setData({ keyword: e.detail.value }) },
  onConfirm() { this._searchFirst(this.data.keyword) },
  onTag(e) { this._searchFirst(e.currentTarget.dataset.k) },

  onClear() {
    this.setData(emptySearchState({ keyword: '', searched: false }))
  },

  onScrollToLower() {
    this._loadMore(false)
  },

  onRetryLoadMore() {
    this._loadMore(true)
  },

  _searchFirst(keyword) {
    const q = (keyword || '').trim()
    const seq = bumpListGeneration(this)
    if (!q) {
      this.setData(emptySearchState({ keyword: '', searched: false }))
      return
    }
    this.setData(emptySearchState({
      keyword: q,
      searched: true,
      loading: true
    }))
    return this._fetchPage({ seq, keyword: q, requestPage: 1, reset: true })
  },

  _loadMore(manualRetry) {
    if (!shouldLoadSearchMore(this.data, manualRetry)) return
    const q = (this.data.keyword || '').trim()
    if (!q) return
    const requestPage = this.data.page
    const seq = bumpListGeneration(this)
    this.setData({ loadingMore: true, loadMoreError: false })
    return this._fetchPage({ seq, keyword: q, requestPage, reset: false })
  },

  async _fetchPage({ seq, keyword, requestPage, reset }) {
    let records = []
    let total = 0
    let failed = false
    try {
      const res = await get('/search', {
        q: keyword,
        types: SEARCH_TYPES,
        page: requestPage,
        size: SEARCH_PAGE_SIZE
      })
      const extracted = extractSearchPage(res)
      records = extracted.records
      total = extracted.total
    } catch (err) {
      console.warn('[search] 搜索失败', err)
      failed = true
    }
    if (isStaleSearchResponse(this, seq, keyword, requestPage)) return

    if (failed && !useMock) {
      if (reset) {
        this.setData({
          results: [],
          total: 0,
          hasMore: false,
          loading: false,
          loadingMore: false,
          searched: true,
          errorText: '搜索失败，请稍后重试'
        })
      } else {
        this.setData({ loading: false, loadingMore: false, loadMoreError: true })
      }
      return
    }

    if ((failed && useMock) || (reset && !records.length && useMock)) {
      const local = sliceSearchPage(localSearchAll(keyword), requestPage, SEARCH_PAGE_SIZE)
      records = local.records
      total = local.total
    }

    const prevLen = reset ? 0 : (this.data.results || []).length
    const results = mergeSearchResults(this.data.results, records, reset)
    this.setData({
      results,
      total,
      page: requestPage + 1,
      hasMore: calcSearchHasMore(results.length, total, records.length, results.length - prevLen),
      searched: true,
      errorText: '',
      loading: false,
      loadingMore: false,
      loadMoreError: false
    })
    if (reset) this._saveHistory(keyword)
  },

  _saveHistory(q) {
    let history = (wx.getStorageSync(HISTORY_KEY) || []).filter(k => k !== q)
    history.unshift(q)
    history = history.slice(0, 10)
    wx.setStorageSync(HISTORY_KEY, history)
    this.setData({ history })
  },

  clearHistory() {
    wx.removeStorageSync(HISTORY_KEY)
    this.setData({ history: [] })
  },

  onResultTap(e) {
    const route = e.currentTarget.dataset.route
    if (!route) { wx.showToast({ title: '内容建设中', icon: 'none' }); return }
    wx.navigateTo({ url: route, fail() { wx.showToast({ title: '打开失败', icon: 'none' }) } })
  }
})
