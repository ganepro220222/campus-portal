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
const { mergeHomeNavItems, openNavItem, DEFAULT_ENTRIES } = require('../../utils/homeNav')
const {
  shouldShowHomeError,
  shouldShowHomeRefreshError,
  mergeHomeCache,
  hasCacheableHomeData,
  viewListsFromHomeCache,
  resolveHomeSection
} = require('../../utils/homePageLoad')

function settle(promise, empty) {
  return promise
    .then((value) => ({ ok: true, value }))
    .catch(() => ({ ok: false, value: empty }))
}

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
    navEntries:         DEFAULT_ENTRIES,
    hasNewAnnouncement: false,
    loading:            true,
    homeError:          false,
    refreshError:       false,
    sectionErrors:      { banners: false, recommends: false, colleges: false },
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

  onRetryHome() {
    this._homeRefreshing = false
    this.setData({ homeError: false, refreshError: false })
    this._refreshHome({ previous: store.getCache('home') })
  },

  async _loadPage() {
    const cached = store.getCache('home')
    if (cached) {
      this.setData({
        ...viewListsFromHomeCache(cached, DEFAULT_ENTRIES),
        loading: false,
        homeError: false
      })
      this._refreshHome({ previous: cached })
      return
    }
    this.setData({ loading: true, homeError: false, refreshError: false })
    await this._refreshHome({ previous: null })
  },

  async _refreshHome({ previous }) {
    if (this._homeRefreshing) return
    this._homeRefreshing = true
    try {
      const [bannersR, recommendsR, collegesR, navR] = await Promise.all([
        settle(get('/banners'), []),
        settle(get('/home/recommends'), {}),
        settle(get('/colleges/home'), []),
        settle(get('/home/nav-items'), [])
      ])
      const flags = {
        banners: bannersR.ok,
        recommends: recommendsR.ok,
        colleges: collegesR.ok,
        navItems: navR.ok
      }
      if (shouldShowHomeError(!!previous, flags)) {
        this.setData({
          loading: false,
          homeError: true,
          refreshError: false,
          sectionErrors: { banners: true, recommends: true, colleges: true }
        })
        return
      }

      const failed = {
        banners: !flags.banners,
        recommends: !flags.recommends,
        colleges: !flags.colleges,
        navItems: !flags.navItems
      }
      const collegeAll = failed.colleges
        ? resolveHomeSection(true, [], previous && previous.collegeList)
        : withListFallback(collegesR.value, mock.collegesHome || [])
      const next = {
        banners: failed.banners
          ? []
          : decorateBanners(withListFallback(bannersR.value, mock.banners)),
        hallList: failed.recommends
          ? []
          : decorateHalls(withListFallback(recommendsR.value && recommendsR.value.halls, mock.hallsHome)),
        newsList: failed.recommends
          ? []
          : decorateNews(withListFallback(recommendsR.value && recommendsR.value.news, mock.newsHome)),
        courseList: failed.recommends
          ? []
          : decorateCourses(withListFallback(recommendsR.value && recommendsR.value.courses, mock.coursesHome)),
        collegeList: collegeAll,
        collegeHome: collegeAll.slice(0, 3),
        navEntries: flags.navItems ? mergeHomeNavItems(navR.value) : mergeHomeNavItems([])
      }
      const view = {
        banners: resolveHomeSection(failed.banners, next.banners, previous && previous.banners),
        hallList: resolveHomeSection(failed.recommends, next.hallList, previous && previous.hallList),
        newsList: resolveHomeSection(failed.recommends, next.newsList, previous && previous.newsList),
        courseList: resolveHomeSection(failed.recommends, next.courseList, previous && previous.courseList),
        collegeList: resolveHomeSection(failed.colleges, next.collegeList, previous && previous.collegeList),
        collegeHome: resolveHomeSection(failed.colleges, next.collegeHome, previous && previous.collegeHome),
        navEntries: failed.navItems
          ? ((previous && previous.navEntries) || DEFAULT_ENTRIES)
          : next.navEntries
      }
      const cache = mergeHomeCache(previous, view, failed)
      if (hasCacheableHomeData(cache)) {
        store.setCache('home', cache)
      }
      this.setData({
        ...view,
        loading: false,
        homeError: false,
        refreshError: shouldShowHomeRefreshError(!!previous, flags),
        sectionErrors: {
          banners: failed.banners,
          recommends: failed.recommends,
          colleges: failed.colleges
        }
      })
    } catch (err) {
      console.warn('[index] 首页数据加载失败', err)
      if (!previous) {
        this.setData({ loading: false, homeError: true })
      } else {
        this.setData({ loading: false, refreshError: true })
      }
    } finally {
      this._homeRefreshing = false
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
    const index = Number(e.currentTarget.dataset.index)
    const entry = (this.data.navEntries || [])[index]
    if (entry) openNavItem(entry)
  },

  onSectionMore(e) {
    const path = e.currentTarget.dataset.path
    if (path) openNavItem({ path })
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
