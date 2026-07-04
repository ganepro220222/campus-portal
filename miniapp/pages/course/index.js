// pages/course/index.js
const { get } = require('../../utils/request')

Page({
  data: { categories: [], courseList: [], currentCat: 0, loading: true },
  onLoad() { this._loadCategories(); this._loadList() },
  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },
  onPullDownRefresh() { this._loadList().then(() => wx.stopPullDownRefresh()) },
  async _loadCategories() {
    const list = await get('/categories?type=course').catch(() => [])
    this.setData({ categories: [{ id: 0, name: '全部' }, ...(list || [])] })
  },
  async _loadList() {
    this.setData({ loading: true })
    try {
      const list = await get('/courses', { categoryId: this.data.currentCat || undefined })
      this.setData({ courseList: list || [], loading: false })
    } catch { this.setData({ loading: false }) }
  },
  switchCat(e) { this.setData({ currentCat: e.currentTarget.dataset.id }); this._loadList() },
  onCardTap(e) { wx.navigateTo({ url: `/packageB/course/detail?id=${e.currentTarget.dataset.id}` }) }
})
