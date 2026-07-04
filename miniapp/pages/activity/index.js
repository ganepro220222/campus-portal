// pages/activity/index.js —— 活动报名（二级页，从首页入口进入）
const { get } = require('../../utils/request')

const CARD_COLORS = ['hc1', 'hc3', 'hc2', 'hc5']
const CARD_ICONS  = ['megaphone', 'flag', 'star', 'calendar']

const DEFAULT_ACTS = [
  { id: 1, title: '“知行合一”阳明文化专题讲座', startTime: '2026-06-15 14:30', location: '明德讲堂', enrolledCount: 186, quota: 300, tag: '讲座' },
  { id: 2, title: '“通途之路”研学品牌启动仪式', startTime: '2026-06-20 09:00', location: '学术报告厅', enrolledCount: 240, quota: 240, tag: '活动' },
  { id: 3, title: '屯堡地戏非遗活态传承公开课', startTime: '2026-06-25 15:00', location: '非遗技艺馆', enrolledCount: 88, quota: 120, tag: '公开课' },
  { id: 4, title: '红色交通史主题研学行', startTime: '2026-07-02 08:30', location: '遵义会议会址', enrolledCount: 56, quota: 80, tag: '研学' }
]

function decorate(list) {
  return (list || []).map((it, i) => ({
    ...it,
    colorClass: it.colorClass || CARD_COLORS[i % CARD_COLORS.length],
    icon: it.icon || CARD_ICONS[i % CARD_ICONS.length],
    full: it.quota > 0 && it.enrolledCount >= it.quota
  }))
}

Page({
  data: { activityList: [], loading: true },

  onLoad() { this._loadList() },
  onPullDownRefresh() { this._loadList().then(() => wx.stopPullDownRefresh()) },

  async _loadList() {
    this.setData({ loading: true })
    try {
      const res = await get('/activities', { page: 1, size: 20 }).catch(() => null)
      const records = (res && res.records && res.records.length) ? res.records : DEFAULT_ACTS
      this.setData({ activityList: decorate(records), loading: false })
    } catch {
      this.setData({ activityList: decorate(DEFAULT_ACTS), loading: false })
    }
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageC/activity/detail?id=${e.currentTarget.dataset.id}` })
  }
})
