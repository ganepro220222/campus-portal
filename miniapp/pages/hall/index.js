// pages/hall/index.js
const { get } = require('../../utils/request')

Page({
  data: { categories: [], hallList: [], currentCat: 0, loading: true },

  onLoad() { this._loadCategories(); this._loadList() },
  onPullDownRefresh() { this._loadList().then(() => wx.stopPullDownRefresh()) },

  async _loadCategories() {
    const list = await get('/categories?type=hall').catch(() => [])
    this.setData({ categories: [{ id: 0, name: '全部' }, ...(list || [])] })
  },

  async _loadList() {
    this.setData({ loading: true })
    try {
      const list = await get('/halls', { categoryId: this.data.currentCat || undefined })
      this.setData({ hallList: list || [], loading: false })
    } catch { this.setData({ loading: false }) }
  },

  switchCat(e) {
    this.setData({ currentCat: e.currentTarget.dataset.id })
    this._loadList()
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageA/hall/detail?id=${e.currentTarget.dataset.id}` })
  }
})
