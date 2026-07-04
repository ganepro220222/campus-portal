// pages/index/index.js
const { get } = require('../../utils/request')
const store   = require('../../store/index')

// ── 展馆色阶（后端无 colorClass 字段时按 index 顺序分配）──
const HALL_COLORS   = ['hc1','hc2','hc3','hc4','hc5']
const BANNER_COLORS = ['s1','s2','s3']

// ── 网络请求失败时的默认兜底数据 ──
const DEFAULT_BANNERS = [
  { id: 1, title: '中华文化书院·云端平台', description: '线上展馆 · 课程中心 · 活动报名', colorClass: 's1', category: '书院动态' },
  { id: 2, title: '阳明心学十二讲 · 全新上线', description: '知行合一，致良知', colorClass: 's2', category: '在线课程' },
  { id: 3, title: '屯堡文化馆 · 沉浸式游览', description: '六百年遗风，地戏活化石', colorClass: 's3', category: '线上展馆' }
]
const DEFAULT_HALLS = [
  { id: 1, name: '阳明文化馆', colorClass: 'hc1' },
  { id: 2, name: '屯堡文化馆', colorClass: 'hc2' },
  { id: 3, name: '红色文化馆', colorClass: 'hc3' },
  { id: 4, name: '非遗文化馆', colorClass: 'hc4' },
  { id: 5, name: '交通文化馆', colorClass: 'hc5' }
]

// 为列表数据补充颜色字段
function withColors(list, palette) {
  return (list || []).map((item, i) => ({
    ...item,
    colorClass: item.colorClass || palette[i % palette.length]
  }))
}

Page({
  data: {
    banners:              DEFAULT_BANNERS,
    bannerIndex:          0,
    announcements:        [],
    hallList:             DEFAULT_HALLS,
    newsList:             [],
    courseList:           [],
    hasNewAnnouncement:   false,
    loading:              true,
    statusBarHeight:      20
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 })
    this._loadPage()
  },

  onShow() {
    this._loadAnnouncements()
  },

  onPullDownRefresh() {
    store.clearCache('home')
    this._loadPage().then(() => wx.stopPullDownRefresh())
  },

  async _loadPage() {
    const cached = store.getCache('home')
    if (cached) {
      this.setData({ ...cached, loading: false })
      return
    }
    try {
      const [banners, recommends] = await Promise.all([
        get('/banners').catch(() => []),
        get('/home/recommends').catch(() => ({}))
      ])

      const finalBanners = withColors(banners, BANNER_COLORS).length
        ? withColors(banners, BANNER_COLORS)
        : DEFAULT_BANNERS
      const finalHalls = withColors(recommends?.halls, HALL_COLORS).length
        ? withColors(recommends?.halls, HALL_COLORS)
        : DEFAULT_HALLS

      const data = {
        banners:    finalBanners,
        hallList:   finalHalls,
        newsList:   withColors(recommends?.news, HALL_COLORS),
        courseList: withColors(recommends?.courses, HALL_COLORS)
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

  onBannerChange(e) {
    this.setData({ bannerIndex: e.detail.current })
  },

  onBannerTap(e) {
    const { linkType, linkValue } = e.currentTarget.dataset
    if (linkType === 'page' && linkValue) wx.navigateTo({ url: linkValue })
  },

  onBellTap() {
    wx.navigateTo({ url: '/packageA/news/list' })
  },

  onNoticeTap() {
    wx.navigateTo({ url: '/packageA/news/list' })
  },

  onNavTap(e) {
    const { path } = e.currentTarget.dataset
    if (!path) return
    const tabPaths = [
      '/pages/index/index', '/pages/hall/index',
      '/pages/course/index', '/pages/activity/index', '/pages/profile/index'
    ]
    if (tabPaths.includes(path)) wx.switchTab({ url: path })
    else wx.navigateTo({ url: path })
  },

  onHallTap(e) {
    wx.navigateTo({ url: `/packageA/hall/detail?id=${e.currentTarget.dataset.id}` })
  },

  onSearchTap() {
    wx.navigateTo({ url: '/packageC/search/index' })
  },

  onNewsCardTap(e) {
    wx.navigateTo({ url: `/packageA/news/detail?id=${e.currentTarget.dataset.id}` })
  },

  onCourseCardTap(e) {
    wx.navigateTo({ url: `/packageB/course/detail?id=${e.currentTarget.dataset.id}` })
  }
})
