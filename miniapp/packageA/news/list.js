// packageA/news/list.js
const { get } = require('../../utils/request')

Page({
  data: { categories: [], newsList: [], currentCat: 0, page: 1, hasMore: true, loading: false },
  onLoad() { this._loadCategories(); this._loadList(true) },
  onReachBottom() { if (this.data.hasMore) this._loadList(false) },
  onPullDownRefresh() { this._loadList(true).then(() => wx.stopPullDownRefresh()) },
  switchCat(e) { this.setData({ currentCat: e.currentTarget.dataset.id }); this._loadList(true) },
  async _loadCategories() {
    const list = await get('/categories?type=news').catch(() => [])
    this.setData({ categories: [{ id: 0, name: '全部' }, ...(list || [])] })
  },
  async _loadList(reset) {
    if (this.data.loading) return
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })
    try {
      const res = await get('/news', { page, size: 10, categoryId: this.data.currentCat || undefined })
      const list = reset ? res.records : [...this.data.newsList, ...res.records]
      this.setData({ newsList: list, page: page + 1, hasMore: res.records.length === 10, loading: false })
    } catch { this.setData({ loading: false }) }
  },
  onCardTap(e) { wx.navigateTo({ url: `./detail?id=${e.currentTarget.dataset.id}` }) }
})
