// pages/course/index.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { withListFallback } = require('../../utils/mockGuard')
const { decorateCourseCards } = require('../../utils/decorate')
const { loadCategoryNames } = require('../../utils/category')
const { getNavBarLayout } = require('../../utils/navbar')

Page({
  data: {
    statusBarHeight: 20,
    navContentHeight: 44,
    capsulePadding: 96,
    cats: ['全部'],
    activeCat: 0,
    courseList: [],
    loading: true
  },

  onLoad() {
    this.setData(getNavBarLayout())
    loadCategoryNames('course').then(cats => {
      this.setData({ cats, activeCat: Math.min(this.data.activeCat, cats.length - 1) })
    })
    this._load()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  onPullDownRefresh() { this._load().then(() => wx.stopPullDownRefresh()) },

  onSearch() { wx.navigateTo({ url: '/packageC/search/index' }) },

  async _load() {
    this.setData({ loading: true })
    const cat = this.data.activeCat ? this.data.cats[this.data.activeCat] : undefined
    try {
      const list = await get('/courses', { category: cat }).catch(() => null)
      const src = withListFallback(list, mock.coursesFull)
      const filtered = cat ? src.filter(c => (c.cat || c.categoryName) === cat) : src
      this.setData({ courseList: decorateCourseCards(filtered), loading: false })
    } catch (err) {
      console.warn('[course] 课程列表加载失败', err)
      this.setData({ courseList: decorateCourseCards(withListFallback(null, mock.coursesFull)), loading: false })
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
