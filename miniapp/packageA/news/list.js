// packageA/news/list.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { decorateNewsFeed } = require('../../utils/decorate')

Page({
  data: { categories: [{ id: 0, name: '全部' }], newsList: [], currentCat: 0, page: 1, hasMore: true, loading: false },

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
        categories: mock.categories.news.map((name, i) => ({ id: i, name }))
      })
    }
  },

  onReachBottom() { if (this.data.hasMore) this._loadList(false) },
  onPullDownRefresh() { this._loadList(true).then(() => wx.stopPullDownRefresh()) },

  switchCat(e) {
    this.setData({ currentCat: e.currentTarget.dataset.id })
    this._loadList(true)
  },

  async _loadList(reset) {
    if (this.data.loading) return
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    try {
      const res = await get('/news', { page, size: 10, categoryId: this.data.currentCat || undefined })
      const records = (res && res.records) ? res.records : []
      const list = reset ? records : this.data.newsList.concat(records)
      const hasMore = records.length === 10
      this.setData({
        newsList: decorateNewsFeed(list.length ? list : (reset ? mock.newsFull : list)),
        page: page + 1,
        hasMore: list.length ? hasMore : false,
        loading: false
      })
    } catch (err) {
      console.warn('[news/list] 列表加载失败', err)
      if (reset) {
        this.setData({ newsList: decorateNewsFeed(mock.newsFull), hasMore: false, loading: false })
      } else {
        this.setData({ loading: false, hasMore: false })
      }
    }
  },

  onCardTap(e) { wx.navigateTo({ url: `./detail?id=${e.currentTarget.dataset.id}` }) }
})
