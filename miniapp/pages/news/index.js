// pages/news/index.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { withListFallback } = require('../../utils/mockGuard')
const { decorateNewsFeed } = require('../../utils/decorate')
const { loadCategoryNames } = require('../../utils/category')
const { getNavBarLayout } = require('../../utils/navbar')

Page({
  data: {
    statusBarHeight: 20,
    navContentHeight: 44,
    capsulePadding: 96,
    cats: ['全部'],
    activeCat: 0,
    newsList: [],
    loading: true
  },

  onLoad() {
    this.setData(getNavBarLayout())
    loadCategoryNames('news').then(cats => {
      this.setData({ cats, activeCat: Math.min(this.data.activeCat, cats.length - 1) })
    })
    this._load()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  onPullDownRefresh() {
    this._load().then(() => wx.stopPullDownRefresh())
  },

  async _load() {
    this.setData({ loading: true })
    const cat = this.data.activeCat ? this.data.cats[this.data.activeCat] : undefined
    try {
      const list = await get('/news', { category: cat }).catch(() => null)
      const src = withListFallback(list, mock.newsFull)
      const filtered = cat ? src.filter(n => (n.category || n.categoryName) === cat) : src
      this.setData({ newsList: decorateNewsFeed(filtered), loading: false })
    } catch (err) {
      console.warn('[news] 资讯列表加载失败', err)
      this.setData({ newsList: decorateNewsFeed(withListFallback(null, mock.newsFull)), loading: false })
    }
  },

  switchCat(e) {
    const i = e.currentTarget.dataset.index
    if (i === this.data.activeCat) return
    this.setData({ activeCat: i })
    this._load()
  },

  onSearch() {
    wx.navigateTo({ url: '/packageC/search/index' })
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageA/news/detail?id=${e.currentTarget.dataset.id}` })
  }
})
