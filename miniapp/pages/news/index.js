// pages/news/index.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const mockGuard = require('../../utils/mockGuard')
const { decorateNewsFeed } = require('../../utils/decorate')
const { loadCategoryNames } = require('../../utils/category')
const { getNavBarLayout } = require('../../utils/navbar')
const {
  FEED_LOAD,
  normalizeFeedLoadOptions,
  buildFeedLoadingPatch,
  buildFeedLoadedPatch,
  buildFeedFailurePatch,
  prevForFeedFailure,
  bumpListGeneration,
  isStaleCategoryRequest
} = require('../../utils/feedListPage')
const {
  DEFAULT_PAGE_SIZE,
  extractPageRecords,
  mergePageRecords,
  calcHasMore,
  filterByCategory,
  sliceMockPage,
  mockHasMore
} = require('../../utils/newsListPage')

Page({
  data: {
    statusBarHeight: 20,
    navContentHeight: 44,
    capsulePadding: 96,
    cats: ['全部'],
    activeCat: 0,
    newsList: [],
    page: 1,
    hasMore: true,
    loading: true,
    loadingMore: false,
    error: false,
    refreshError: false,
    loadMoreError: false
  },

  onLoad() {
    this.setData(getNavBarLayout())
    loadCategoryNames('news').then(cats => {
      this.setData({ cats, activeCat: Math.min(this.data.activeCat, cats.length - 1) })
    })
    this._loadList(FEED_LOAD.initial)
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  onPullDownRefresh() {
    this._loadList(FEED_LOAD.pullRefresh).then(() => wx.stopPullDownRefresh())
  },

  onScrollToLower() {
    if (this.data.loadMoreError) return
    if (this.data.hasMore && !this.data.loading && !this.data.loadingMore) {
      this._loadList(FEED_LOAD.loadMore)
    }
  },

  onRetryRefresh() {
    this.setData({ refreshError: false })
    this._loadList(FEED_LOAD.pullRefresh)
  },

  onRetryLoadMore() {
    this.setData({ loadMoreError: false })
    this._loadList(FEED_LOAD.loadMore)
  },

  onRetryInitial() {
    this.setData({ error: false })
    this._loadList(FEED_LOAD.initial)
  },

  async _loadList(options) {
    const loadOpts = normalizeFeedLoadOptions(options)
    const replaceOnSuccess = loadOpts.replaceOnSuccess
    if (!replaceOnSuccess && (this.data.loading || this.data.loadingMore)) return

    const generation = bumpListGeneration(this)
    const page = replaceOnSuccess ? 1 : this.data.page
    const catIndex = this.data.activeCat
    const catLabel = this.data.cats[catIndex]
    const category = catLabel && catLabel !== '全部' ? catLabel : undefined
    const prev = this.data

    this.setData(buildFeedLoadingPatch(loadOpts, prev, 'newsList'))

    try {
      const res = await get('/news', {
        page,
        size: DEFAULT_PAGE_SIZE,
        category
      })

      if (isStaleCategoryRequest(this, generation, catIndex)) return

      let records = extractPageRecords(res)
      let hasMore = calcHasMore(records, DEFAULT_PAGE_SIZE)

      if (!records.length && mockGuard.useMock) {
        const mockFull = filterByCategory(mock.newsFull || [], category)
        records = sliceMockPage(mockFull, page, DEFAULT_PAGE_SIZE)
        hasMore = mockHasMore(mockFull, page, DEFAULT_PAGE_SIZE)
      } else if (!records.length && replaceOnSuccess) {
        hasMore = false
      }

      const merged = mergePageRecords(
        replaceOnSuccess ? [] : this.data.newsList,
        decorateNewsFeed(records),
        replaceOnSuccess
      )
      this.setData(buildFeedLoadedPatch('newsList', merged, page + 1, hasMore))
    } catch (err) {
      if (isStaleCategoryRequest(this, generation, catIndex)) return
      console.warn('[news] 动态列表加载失败', err)
      this.setData(buildFeedFailurePatch(
        err,
        prevForFeedFailure(loadOpts, prev, 'newsList'),
        'newsList',
        loadOpts
      ))
    }
  },

  switchCat(e) {
    const i = e.currentTarget.dataset.index
    if (i === this.data.activeCat) return
    this.setData({ activeCat: i, hasMore: true })
    this._loadList(FEED_LOAD.categorySwitch)
  },

  onSearch() {
    wx.navigateTo({ url: '/packageC/search/index' })
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageA/news/detail?id=${e.currentTarget.dataset.id}` })
  }
})
