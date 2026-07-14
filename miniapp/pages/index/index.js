// pages/index/index.js
const { get } = require('../../utils/request')
const store   = require('../../store/index')
const mock    = require('../../mock/defaults')
const { withListFallback, mockOrEmpty } = require('../../utils/mockGuard')
const {
  decorateHalls, decorateNews, decorateCourses, decorateBanners
} = require('../../utils/decorate')
const { openContentLink } = require('../../utils/navigate')
const { getNavBarLayout } = require('../../utils/navbar')

Page({
  data: {
    banners:            mockOrEmpty(decorateBanners(mock.banners), []),
    bannerIndex:        0,
    announcements:      [],
    hallList:           mockOrEmpty(decorateHalls(mock.hallsHome), []),
    newsList:           mockOrEmpty(decorateNews(mock.newsHome), []),
    courseList:         mockOrEmpty(decorateCourses(mock.coursesHome), []),
    collegeList:        [],
    collegeHome:        [],
    hasNewAnnouncement: false,
    loading:            true,
    statusBarHeight:    20,
    navContentHeight:   44,
    capsulePadding:     96
  },

  onLoad() {
    const nav = getNavBarLayout()
    this.setData(nav)
    this._loadPage()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this._loadAnnouncements()
  },

  onPullDownRefresh() {
    store.clearCache('home')
    this._loadPage().then(() => wx.stopPullDownRefresh())
  },

  async _loadPage() {
    const cached = store.getCache('home')
    if (cached) { this.setData({ ...cached, loading: false }); return }
    try {
      const [banners, recommends, colleges] = await Promise.all([
        get('/banners').catch(() => []),
        get('/home/recommends').catch(() => ({})),
        get('/colleges/home').catch(() => [])
      ])
      const collegeAll = withListFallback(colleges, mock.collegesHome || [])
      const data = {
        banners:    decorateBanners(withListFallback(banners, mock.banners)),
        hallList:   decorateHalls(withListFallback(recommends && recommends.halls, mock.hallsHome)),
        newsList:   decorateNews(withListFallback(recommends && recommends.news, mock.newsHome)),
        courseList: decorateCourses(withListFallback(recommends && recommends.courses, mock.coursesHome)),
        collegeList: collegeAll,
        collegeHome: collegeAll.slice(0, 3)
      }
      store.setCache('home', data)
      this.setData({ ...data, loading: false })
    } catch (err) {
      console.warn('[index] 首页数据加载失败', err)
      this.setData({ loading: false })
    }
  },

  async _loadAnnouncements() {
    try {
      const list = await get('/announcements/active').catch(() => [])
      this.setData({
        announcements:      list || [],
        hasNewAnnouncement: (list || []).length > 0
      })
    } catch (err) {
      console.warn('[index] 公告加载失败', err)
    }
  },

  onBannerChange(e) { this.setData({ bannerIndex: e.detail.current }) },

  onBannerTap(e) {
    const { linkType, linkValue } = e.currentTarget.dataset
    openContentLink(linkType, linkValue)
  },

  onProfileTap() {
    const app = getApp()
    if (app.isLoggedIn && app.isLoggedIn()) {
      wx.navigateTo({ url: '/pages/profile/index' })
    } else {
      wx.navigateTo({ url: '/pages/login/index' })
    }
  },

  onBellTap() { wx.switchTab({ url: '/pages/news/index' }) },
  onNoticeTap() { wx.switchTab({ url: '/pages/news/index' }) },
  onSearchTap() { wx.navigateTo({ url: '/packageC/search/index' }) },

  onCraftTap() {
    wx.navigateTo({ url: '/packageA/craft/list' })
  },

  onEntryTap(e) {
    const key = e.currentTarget.dataset.key
    const TAB = { news: '/pages/news/index', hall: '/pages/hall/index', course: '/pages/course/index' }
    const NAV = { resource: '/packageB/resource/list', enroll: '/pages/activity/index' }
    if (TAB[key]) wx.switchTab({ url: TAB[key] })
    else if (NAV[key]) wx.navigateTo({ url: NAV[key] })
  },

  onHallTap(e) { wx.navigateTo({ url: `/packageA/hall/detail?id=${e.currentTarget.dataset.id}` }) },
  onNewsCardTap(e) { wx.navigateTo({ url: `/packageA/news/detail?id=${e.currentTarget.dataset.id}` }) },
  onCourseCardTap(e) { wx.navigateTo({ url: `/packageB/course/detail?id=${e.currentTarget.dataset.id}` }) },

  onCollegeMore() {
    wx.navigateTo({ url: '/packageC/college/list' })
  },

  onCollegeTap(e) {
    const id = e.currentTarget.dataset.id
    const item = (this.data.collegeList || []).find(c => String(c.id) === String(id))
    if (!item) return
    if (!item.appid) {
      wx.showToast({ title: '未配置目标小程序', icon: 'none' })
      return
    }
    wx.navigateToMiniProgram({
      appId: item.appid,
      path: item.path || '',
      fail: () => wx.showToast({ title: '跳转失败，请检查 AppID 是否已关联', icon: 'none', duration: 3000 })
    })
  }
})
