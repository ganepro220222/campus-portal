// pages/news/index.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const mockGuard = require('../../utils/mockGuard')
const { decorateNewsFeed } = require('../../utils/decorate')
const { loadCategoryNames } = require('../../utils/category')
const { getNavBarLayout } = require('../../utils/navbar')
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
    loadingMore: false
  },

  onLoad() {
    this.setData(getNavBarLayout())
    loadCategoryNames('news').then(cats => {
      this.setData({ cats, activeCat: Math.min(this.data.activeCat, cats.length - 1) })
    })
    this._loadList(true)
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  onPullDownRefresh() {
    this._loadList(true).then(() => wx.stopPullDownRefresh())
  },

  onScrollToLower() {
    if (this.data.hasMore && !this.data.loading && !this.data.loadingMore) {
      this._loadList(false)
    }
  },

  async _loadList(reset) {
    if (!reset && (this.data.loading || this.data.loadingMore)) return
    const page = reset ? 1 : this.data.page
    const catLabel = this.data.cats[this.data.activeCat]
    const category = catLabel && catLabel !== '全部' ? catLabel : undefined

    this.setData(reset ? { loading: true } : { loadingMore: true })

    try {
      const res = await get('/news', {
        page,
        size: DEFAULT_PAGE_SIZE,
        category
      }).catch(() => null)

      let records = extractPageRecords(res)
      let hasMore = calcHasMore(records, DEFAULT_PAGE_SIZE)

      if (!records.length && mockGuard.useMock) {
        const mockFull = filterByCategory(mock.newsFull || [], category)
        records = sliceMockPage(mockFull, page, DEFAULT_PAGE_SIZE)
        hasMore = mockHasMore(mockFull, page, DEFAULT_PAGE_SIZE)
      } else if (!records.length && !reset) {
        hasMore = false
      }

      const merged = mergePageRecords(
        reset ? [] : this.data.newsList,
        decorateNewsFeed(records),
        reset
      )
      this.setData({
        newsList: merged,
        page: page + 1,
        hasMore: merged.length ? hasMore : false,
        loading: false,
        loadingMore: false
      })
    } catch (err) {
      console.warn('[news] 动态列表加载失败', err)
      this.setData({ loading: false, loadingMore: false, hasMore: false })
    }
  },

  switchCat(e) {
    const i = e.currentTarget.dataset.index
    if (i === this.data.activeCat) return
    this.setData({ activeCat: i, hasMore: true })
    this._loadList(true)
  },

  onSearch() {
    wx.navigateTo({ url: '/packageC/search/index' })
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageA/news/detail?id=${e.currentTarget.dataset.id}` })
  }
})
