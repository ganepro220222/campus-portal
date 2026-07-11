// pages/activity/index.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { withListFallback } = require('../../utils/mockGuard')
const { decorateActivities } = require('../../utils/decorate')

Page({
  data: { activityList: [], loading: true },

  onLoad() { this._loadList() },
  onPullDownRefresh() { this._loadList().then(() => wx.stopPullDownRefresh()) },

  async _loadList() {
    this.setData({ loading: true })
    try {
      const res = await get('/activities', { page: 1, size: 20 }).catch(() => null)
      const records = withListFallback(res && res.records, mock.activities)
      this.setData({ activityList: decorateActivities(records), loading: false })
    } catch (err) {
      console.warn('[activity] 活动列表加载失败', err)
      this.setData({ activityList: decorateActivities(withListFallback(null, mock.activities)), loading: false })
    }
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageC/activity/detail?id=${e.currentTarget.dataset.id}` })
  }
})
