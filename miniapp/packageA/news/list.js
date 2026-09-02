// packageA/news/list.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { withListFallback, useMock } = require('../../utils/mockGuard')
const { decorateNewsFeed } = require('../../utils/decorate')
const {
  shouldRequestNextPage,
  buildLoadMoreFailurePatch
} = require('../../utils/newsListPage')

Page({
  data: {
    categories: [{ id: 0, name: '全部' }],
    newsList: [],
    currentCat: 0,
    page: 1,
    hasMore: true,
    loading: false,
    loadMoreError: false
  },

  onLoad() {
    this._loadCategories()
    this._loadList(true)
  },

  async _loadCategories() {
    try {
      const list = await get('/categories', { type: 'news' })
      this.setData({ categories: [{ id: 0, name: '全部' }, ...(list || [])] })
    } catch (err) {
      console.warn('[news/list] 分类加载失败', err)
      this.setData({
        categories: useMock
          ? mock.categories.news.map((name, i) => ({ id: i, name }))
          : [{ id: 0, name: '全部' }]
      })
    }
  },

  onReachBottom() {
    if (shouldRequestNextPage(this.data)) this._loadList(false)
  },

  onRetryLoadMore() {
    if (shouldRequestNextPage(this.data, true)) this._loadList(false)
  },

  onPullDownRefresh() { this._loadList(true).then(() => wx.stopPullDownRefresh()) },

  switchCat(e) {
    this.setData({ currentCat: e.currentTarget.dataset.id })
    this._loadList(true)
  },

  async _loadList(reset) {
    if (this.data.loading) return
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true, loadMoreError: false })
    try {
      const res = await get('/news', { page, size: 10, categoryId: this.data.currentCat || undefined })
      const records = (res && res.records) ? res.records : []
      const list = reset ? records : this.data.newsList.concat(records)
      const displayList = list.length ? list : (reset ? withListFallback(null, mock.newsFull) : list)
      const hasMore = records.length === 10
      this.setData({
        newsList: decorateNewsFeed(displayList),
        page: page + 1,
        hasMore: displayList.length ? hasMore : false,
        loading: false,
        loadMoreError: false
      })
    } catch (err) {
      console.warn('[news/list] 列表加载失败', err)
      if (reset) {
        this.setData({
          newsList: decorateNewsFeed(withListFallback(null, mock.newsFull)),
          hasMore: false,
          loading: false,
          loadMoreError: false
        })
      } else {
        this.setData(buildLoadMoreFailurePatch())
      }
    }
  },

  onCardTap(e) { wx.navigateTo({ url: `./detail?id=${e.currentTarget.dataset.id}` }) }
})
