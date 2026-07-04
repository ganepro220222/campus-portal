// pages/index/index.js
const { get } = require('../../utils/request')
const store   = require('../../store/index')

// ── 色阶 / 图标（后端无对应字段时按 index 顺序分配）──
const HALL_COLORS   = ['hc1', 'hc2', 'hc3', 'hc4', 'hc5']
const BANNER_COLORS = ['s1', 's2', 's3']
const NEWS_ICONS    = ['file', 'flag', 'star', 'megaphone']
const COURSE_ICONS  = ['course', 'clock', 'book']

// ── 网络失败兜底数据 ──
const DEFAULT_BANNERS = [
  { id: 1, title: '王阳明“知行合一”专题讲座圆满举行', description: '名家云集，共探黔中阳明心学的当代价值', colorClass: 's1', category: '书院动态' },
  { id: 2, title: '“通途之路”研学品牌正式启动', description: '线上承载 · 线下研学，打造协同育人新格局', colorClass: 's2', category: '通途之路' },
  { id: 3, title: '屯堡地戏走进校园 · 六百年非遗活态传承', description: '沉浸式线上展馆同步上线，可听语音讲解', colorClass: 's3', category: '文化传承' }
]
const DEFAULT_HALLS = [
  { id: 1, name: '阳明文化馆' }, { id: 2, name: '屯堡文化馆' },
  { id: 3, name: '红色文化馆' }, { id: 4, name: '民族文化馆' },
  { id: 5, name: '交通文化馆' }, { id: 6, name: '校史馆' }
]
const DEFAULT_NEWS = [
  { id: 1, title: '中华文化书院举办王阳明“知行合一”专题讲座', categoryName: '书院动态', publishTime: '2026-06-05' },
  { id: 2, title: '“通途之路”研学品牌启动仪式在我校举行', categoryName: '活动通知', publishTime: '2026-06-03' },
  { id: 3, title: '屯堡地戏走进校园：非遗活态传承公开课开讲', categoryName: '文化传承', publishTime: '2026-06-01' }
]
const DEFAULT_COURSES = [
  { id: 1, name: '阳明心学十二讲', categoryName: 'AI 字幕', lessonCount: 12, audience: '全校学生' },
  { id: 2, name: '长征精神与红色交通史', categoryName: '思政必修', lessonCount: 8, audience: '全校学生' }
]

function decorateHalls(list) {
  return (list || []).map((it, i) => ({
    ...it,
    colorClass: it.colorClass || HALL_COLORS[i % HALL_COLORS.length],
    shortName: it.shortName || (it.name || '').replace(/馆$/, '')
  }))
}
function decorateNews(list) {
  return (list || []).map((it, i) => ({
    ...it,
    categoryName: it.categoryName || it.category || '书院动态',
    colorClass: it.colorClass || HALL_COLORS[i % HALL_COLORS.length],
    icon: it.icon || NEWS_ICONS[i % NEWS_ICONS.length]
  }))
}
function decorateCourses(list) {
  return (list || []).map((it, i) => ({
    ...it,
    categoryName: it.categoryName || '文化课程',
    colorClass: it.colorClass || HALL_COLORS[i % HALL_COLORS.length],
    icon: it.icon || COURSE_ICONS[i % COURSE_ICONS.length]
  }))
}
function decorateBanners(list) {
  return (list || []).map((it, i) => ({
    ...it,
    colorClass: it.colorClass || BANNER_COLORS[i % BANNER_COLORS.length]
  }))
}

Page({
  data: {
    banners:            DEFAULT_BANNERS,
    bannerIndex:        0,
    announcements:      [],
    hallList:           decorateHalls(DEFAULT_HALLS),
    newsList:           decorateNews(DEFAULT_NEWS),
    courseList:         decorateCourses(DEFAULT_COURSES),
    hasNewAnnouncement: false,
    loading:            true,
    statusBarHeight:    20
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 })
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
      const [banners, recommends] = await Promise.all([
        get('/banners').catch(() => []),
        get('/home/recommends').catch(() => ({}))
      ])
      const data = {
        banners:    (banners && banners.length) ? decorateBanners(banners) : DEFAULT_BANNERS,
        hallList:   decorateHalls((recommends && recommends.halls && recommends.halls.length) ? recommends.halls : DEFAULT_HALLS),
        newsList:   decorateNews((recommends && recommends.news && recommends.news.length) ? recommends.news : DEFAULT_NEWS),
        courseList: decorateCourses((recommends && recommends.courses && recommends.courses.length) ? recommends.courses : DEFAULT_COURSES)
      }
      store.setCache('home', data)
      this.setData({ ...data, loading: false })
    } catch {
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
    } catch {}
  },

  onBannerChange(e) { this.setData({ bannerIndex: e.detail.current }) },

  onBannerTap() { wx.switchTab({ url: '/pages/news/index' }) },

  // 顶栏「我的」：已登录进个人中心，未登录去登录页
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

  // 功能入口
  onEntryTap(e) {
    const key = e.currentTarget.dataset.key
    const TAB = { news: '/pages/news/index', hall: '/pages/hall/index', course: '/pages/course/index' }
    const NAV = { resource: '/packageB/resource/list', enroll: '/pages/activity/index' }
    if (TAB[key]) wx.switchTab({ url: TAB[key] })
    else if (NAV[key]) wx.navigateTo({ url: NAV[key] })
  },

  onHallTap(e) { wx.navigateTo({ url: `/packageA/hall/detail?id=${e.currentTarget.dataset.id}` }) },
  onNewsCardTap(e) { wx.navigateTo({ url: `/packageA/news/detail?id=${e.currentTarget.dataset.id}` }) },
  onCourseCardTap(e) { wx.navigateTo({ url: `/packageB/course/detail?id=${e.currentTarget.dataset.id}` }) }
})
