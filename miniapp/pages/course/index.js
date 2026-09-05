// pages/course/index.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const mockGuard = require('../../utils/mockGuard')
const { decorateCourseCards } = require('../../utils/decorate')
const { loadCategoryNames } = require('../../utils/category')
const { getNavBarLayout } = require('../../utils/navbar')
const {
  FEED_LOAD,
  buildFeedLoadingPatch,
  buildFeedLoadedPatch,
  buildFeedFailurePatch,
  prevForFeedFailure,
  resolveFeedRetryMode,
  bumpListGeneration,
  isStaleCategoryRequest
} = require('../../utils/feedListPage')
const { enablePageShare, buildShareAppMessage, buildShareTimeline } = require('../../utils/pageShare')

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
    enablePageShare()
    loadCategoryNames('course').then(cats => {
      this.setData({ cats, activeCat: Math.min(this.data.activeCat, cats.length - 1) })
    })
    this._load(FEED_LOAD.initial)
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  onPullDownRefresh() {
    this._load(FEED_LOAD.pullRefresh).then(() => wx.stopPullDownRefresh())
  },

  onRetry() {
    this.setData({ refreshError: false, error: false })
    this._load(resolveFeedRetryMode(this.data.courseList.length))
  },

  onSearch() { wx.navigateTo({ url: '/packageC/search/index' }) },

  async _load(options) {
    const generation = bumpListGeneration(this)
    const catIndex = this.data.activeCat
    const prev = this.data
    const cat = catIndex ? this.data.cats[catIndex] : undefined

    this.setData(buildFeedLoadingPatch(options, prev, 'courseList'))

    try {
      const list = await get('/courses', { category: cat })
      if (isStaleCategoryRequest(this, generation, catIndex)) return

      let src = Array.isArray(list) ? list : []
      if (!src.length && mockGuard.useMock) {
        src = mock.coursesFull || []
      }
      const filtered = cat ? src.filter(c => (c.cat || c.categoryName) === cat) : src
      this.setData(buildFeedLoadedPatch('courseList', decorateCourseCards(filtered), 1, false))
    } catch (err) {
      if (isStaleCategoryRequest(this, generation, catIndex)) return
      console.warn('[course] 课程列表加载失败', err)
      this.setData(buildFeedFailurePatch(
        err,
        prevForFeedFailure(options, prev, 'courseList'),
        'courseList',
        options
      ))
    }
  },

  switchCat(e) {
    const i = e.currentTarget.dataset.index
    if (i === this.data.activeCat) return
    this.setData({ activeCat: i })
    this._load(FEED_LOAD.categorySwitch)
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageB/course/detail?id=${e.currentTarget.dataset.id}` })
  },

  onShareAppMessage() {
    return buildShareAppMessage({ title: '精品课程', path: '/pages/course/index' })
  },

  onShareTimeline() {
    return buildShareTimeline({ title: '精品课程' })
  }
})
