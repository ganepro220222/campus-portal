// pages/news/index.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { decorateNewsFeed } = require('../../utils/decorate')

const CATS = ['全部', '书院动态', '活动通知', '文化传承']

Page({
  data: {
    statusBarHeight: 20,
    cats: CATS,
    activeCat: 0,
    newsList: [],
    loading: true
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 })
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
    const cat = this.data.activeCat ? CATS[this.data.activeCat] : undefined
    try {
      const list = await get('/news', { category: cat }).catch(() => null)
      const src = (list && list.length) ? list : mock.newsFull
      const filtered = cat ? src.filter(n => (n.category || n.categoryName) === cat) : src
      this.setData({ newsList: decorateNewsFeed(filtered), loading: false })
    } catch (err) {
      console.warn('[news] 资讯列表加载失败', err)
      this.setData({ newsList: decorateNewsFeed(mock.newsFull), loading: false })
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
