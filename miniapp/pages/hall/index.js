// pages/hall/index.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { decorateHalls } = require('../../utils/decorate')
const { loadCategoryNames } = require('../../utils/category')

Page({
  data: {
    statusBarHeight: 20,
    cats: mock.categories.hall,
    activeCat: 0,
    hallList: [],
    loading: true
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 })
    loadCategoryNames('hall').then(cats => {
      this.setData({ cats, activeCat: Math.min(this.data.activeCat, cats.length - 1) })
    })
    this._load()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  onPullDownRefresh() { this._load().then(() => wx.stopPullDownRefresh()) },

  async _load() {
    this.setData({ loading: true })
    const cat = this.data.activeCat ? this.data.cats[this.data.activeCat] : undefined
    try {
      const list = await get('/halls', { category: cat }).catch(() => null)
      const src = (list && list.length) ? list : mock.hallsFull
      const filtered = cat ? src.filter(h => (h.cat || h.categoryName) === cat) : src
      this.setData({ hallList: decorateHalls(filtered), loading: false })
    } catch (err) {
      console.warn('[hall] 展馆列表加载失败', err)
      this.setData({ hallList: decorateHalls(mock.hallsFull), loading: false })
    }
  },

  switchCat(e) {
    const i = e.currentTarget.dataset.index
    if (i === this.data.activeCat) return
    this.setData({ activeCat: i })
    this._load()
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageA/hall/detail?id=${e.currentTarget.dataset.id}` })
  }
})
