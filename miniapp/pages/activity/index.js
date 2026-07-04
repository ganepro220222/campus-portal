// pages/activity/index.js
const { get } = require('../../utils/request')
const { formatDate } = require('../../utils/format')

Page({
  data: { activityList: [], loading: true },
  onLoad() { this._loadList() },
  onPullDownRefresh() { this._loadList().then(() => wx.stopPullDownRefresh()) },
  async _loadList() {
    this.setData({ loading: true })
    try {
      const res = await get('/activities', { page: 1, size: 20 })
      this.setData({ activityList: res.records || [], loading: false })
    } catch { this.setData({ loading: false }) }
  },
  onCardTap(e) { wx.navigateTo({ url: `/packageC/activity/detail?id=${e.currentTarget.dataset.id}` }) }
})
