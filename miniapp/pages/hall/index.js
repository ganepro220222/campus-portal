// pages/hall/index.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { withListFallback } = require('../../utils/mockGuard')
const { decorateHalls } = require('../../utils/decorate')
const { loadCategoryNames } = require('../../utils/category')
const { getNavBarLayout } = require('../../utils/navbar')

Page({
  data: {
    statusBarHeight: 20,
    capsulePadding: 96,
    cats: ['全部'],
    activeCat: 0,
    hallList: [],
    loading: true
  },

  onLoad() {
    this.setData(getNavBarLayout())
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

  onSearch() { wx.navigateTo({ url: '/packageC/search/index' }) },

  async _load() {
    this.setData({ loading: true })
    const cat = this.data.activeCat ? this.data.cats[this.data.activeCat] : undefined
    try {
      const list = await get('/halls', { category: cat }).catch(() => null)
      const src = withListFallback(list, mock.hallsFull)
      const filtered = cat ? src.filter(h => (h.cat || h.categoryName) === cat) : src
      this.setData({ hallList: decorateHalls(filtered), loading: false })
    } catch (err) {
      console.warn('[hall] 展馆列表加载失败', err)
      this.setData({ hallList: decorateHalls(withListFallback(null, mock.hallsFull)), loading: false })
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
