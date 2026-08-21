// pages/activity/index.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const mockGuard = require('../../utils/mockGuard')
const { decorateActivities } = require('../../utils/decorate')
const {
  buildFeedLoadingPatch,
  buildFeedLoadedPatch,
  buildFeedFailurePatch
} = require('../../utils/feedListPage')

Page({
  data: {
    activityList: [],
    loading: true,
    error: false,
    refreshError: false
  },

  onLoad() { this._loadList(true) },

  onPullDownRefresh() { this._loadList(true).then(() => wx.stopPullDownRefresh()) },

  onRetry() {
    this.setData({ refreshError: false, error: false })
    this._loadList(true)
  },

  async _loadList(reset) {
    const prev = this.data
    const silent = !reset && prev.activityList && prev.activityList.length > 0
    this.setData(buildFeedLoadingPatch(reset))
    try {
      const res = await get('/activities', { page: 1, size: 20 })
      let records = res && res.records ? res.records : []
      if (!records.length && mockGuard.useMock) {
        records = mock.activities || []
      }
      this.setData(buildFeedLoadedPatch('activityList', decorateActivities(records), 2, false))
    } catch (err) {
      console.warn('[activity] 活动列表加载失败', err)
      this.setData(buildFeedFailurePatch(err, silent ? prev : { activityList: [] }, 'activityList'))
    }
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageC/activity/detail?id=${e.currentTarget.dataset.id}` })
  }
})
