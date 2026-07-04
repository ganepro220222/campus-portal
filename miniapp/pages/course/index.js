// pages/course/index.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { decorateCourseCards } = require('../../utils/decorate')

const CATS = ['全部', '阳明文化', '思政必修', '文化传承', '美育素养']

Page({
  data: {
    statusBarHeight: 20,
    cats: CATS,
    activeCat: 0,
    courseList: [],
    loading: true
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 })
    this._load()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  onPullDownRefresh() { this._load().then(() => wx.stopPullDownRefresh()) },

  async _load() {
    this.setData({ loading: true })
    const cat = this.data.activeCat ? CATS[this.data.activeCat] : undefined
    try {
      const list = await get('/courses', { category: cat }).catch(() => null)
      const src = (list && list.length) ? list : mock.coursesFull
      const filtered = cat ? src.filter(c => (c.cat || c.categoryName) === cat) : src
      this.setData({ courseList: decorateCourseCards(filtered), loading: false })
    } catch (err) {
      console.warn('[course] 课程列表加载失败', err)
      this.setData({ courseList: decorateCourseCards(mock.coursesFull), loading: false })
    }
  },

  switchCat(e) {
    const i = e.currentTarget.dataset.index
    if (i === this.data.activeCat) return
    this.setData({ activeCat: i })
    this._load()
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageB/course/detail?id=${e.currentTarget.dataset.id}` })
  }
})
