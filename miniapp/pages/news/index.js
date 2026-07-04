// pages/news/index.js —— 新闻资讯（底部 Tab）
const { get } = require('../../utils/request')

const CATS = ['全部', '书院动态', '活动通知', '文化传承']
const THUMB_COLORS = ['hc1', 'hc3', 'hc2', 'hc4', 'hc5']
const THUMB_ICONS  = ['file', 'flag', 'star', 'course', 'megaphone']

const DEFAULT_NEWS = [
  { id: 1, title: '中华文化书院举办王阳明“知行合一”专题讲座', category: '书院动态', publishTime: '2026-06-05', readCount: 1234 },
  { id: 2, title: '“通途之路”研学品牌启动仪式在我校举行', category: '活动通知', publishTime: '2026-06-03', readCount: 980 },
  { id: 3, title: '屯堡地戏走进校园：非遗活态传承公开课开讲', category: '文化传承', publishTime: '2026-06-01', readCount: 1500 },
  { id: 4, title: '阳明心学十二讲课程上线，欢迎选学', category: '书院动态', publishTime: '2026-05-28', readCount: 860 },
  { id: 5, title: '红色交通史主题展在校史馆开展', category: '文化传承', publishTime: '2026-05-25', readCount: 742 },
  { id: 6, title: '关于开展 2026 年传统文化系列研学活动的通知', category: '活动通知', publishTime: '2026-05-20', readCount: 655 }
]

function fmtRead(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function decorate(list) {
  return (list || []).map((item, i) => ({
    ...item,
    categoryName: item.categoryName || item.category || '书院动态',
    readText: fmtRead(item.readCount || 0),
    colorClass: item.colorClass || THUMB_COLORS[i % THUMB_COLORS.length],
    icon: item.icon || THUMB_ICONS[i % THUMB_ICONS.length]
  }))
}

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
      const src = (list && list.length) ? list : DEFAULT_NEWS
      const filtered = cat ? src.filter(n => (n.category || n.categoryName) === cat) : src
      this.setData({ newsList: decorate(filtered), loading: false })
    } catch {
      this.setData({ newsList: decorate(DEFAULT_NEWS), loading: false })
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
