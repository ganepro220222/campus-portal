// pages/course/index.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const mockGuard = require('../../utils/mockGuard')
const { decorateCourseCards } = require('../../utils/decorate')
const { loadCategoryNames } = require('../../utils/category')
const { getNavBarLayout } = require('../../utils/navbar')
const {
  buildFeedLoadingPatch,
  buildFeedLoadedPatch,
  buildFeedFailurePatch
} = require('../../utils/feedListPage')

Page({
  data: {
    statusBarHeight: 20,
    navContentHeight: 44,
    capsulePadding: 96,
    cats: ['全部'],
    activeCat: 0,
    courseList: [],
    loading: true,
    error: false,
    refreshError: false
  },

  onLoad() {
    this.setData(getNavBarLayout())
    loadCategoryNames('course').then(cats => {
      this.setData({ cats, activeCat: Math.min(this.data.activeCat, cats.length - 1) })
    })
    this._load(true)
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  onPullDownRefresh() { this._load(true).then(() => wx.stopPullDownRefresh()) },

  onRetry() {
    this.setData({ refreshError: false, error: false })
    this._load(true)
  },

  onSearch() { wx.navigateTo({ url: '/packageC/search/index' }) },

  async _load(reset) {
    const prev = this.data
    const silent = !reset && prev.courseList && prev.courseList.length > 0
    this.setData(buildFeedLoadingPatch(reset))
    const cat = this.data.activeCat ? this.data.cats[this.data.activeCat] : undefined
    try {
      const list = await get('/courses', { category: cat })
      let src = Array.isArray(list) ? list : []
      if (!src.length && mockGuard.useMock) {
        src = mock.coursesFull || []
      }
      const filtered = cat ? src.filter(c => (c.cat || c.categoryName) === cat) : src
      this.setData(buildFeedLoadedPatch('courseList', decorateCourseCards(filtered), 1, false))
    } catch (err) {
      console.warn('[course] 课程列表加载失败', err)
      this.setData(buildFeedFailurePatch(err, silent ? prev : { courseList: [] }, 'courseList'))
    }
  },

  switchCat(e) {
    const i = e.currentTarget.dataset.index
    if (i === this.data.activeCat) return
    this.setData({ activeCat: i })
    this._load(true)
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageB/course/detail?id=${e.currentTarget.dataset.id}` })
  }
})
