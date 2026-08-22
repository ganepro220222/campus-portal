// pages/activity/index.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const mockGuard = require('../../utils/mockGuard')
const { decorateActivities } = require('../../utils/decorate')
const {
  FEED_LOAD,
  buildFeedLoadingPatch,
  buildFeedLoadedPatch,
  buildFeedFailurePatch,
  prevForFeedFailure,
  resolveFeedRetryMode,
  bumpListGeneration,
  isStaleListRequest
} = require('../../utils/feedListPage')

Page({
  data: {
    activityList: [],
    loading: true,
    error: false,
    refreshError: false
  },

  onLoad() { this._loadList(FEED_LOAD.initial) },

  onPullDownRefresh() {
    this._loadList(FEED_LOAD.pullRefresh).then(() => wx.stopPullDownRefresh())
  },

  onRetry() {
    this.setData({ refreshError: false, error: false })
    this._loadList(resolveFeedRetryMode(this.data.activityList.length))
  },

  async _loadList(options) {
    const generation = bumpListGeneration(this)
    const prev = this.data

    this.setData(buildFeedLoadingPatch(options, prev, 'activityList'))

    try {
      const res = await get('/activities', { page: 1, size: 20 })
      if (isStaleListRequest(this, generation)) return

      let records = res && res.records ? res.records : []
      if (!records.length && mockGuard.useMock) {
        records = mock.activities || []
      }
      this.setData(buildFeedLoadedPatch('activityList', decorateActivities(records), 2, false))
    } catch (err) {
      if (isStaleListRequest(this, generation)) return
      console.warn('[activity] 活动列表加载失败', err)
      this.setData(buildFeedFailurePatch(
        err,
        prevForFeedFailure(options, prev, 'activityList'),
        'activityList'
      ))
    }
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageC/activity/detail?id=${e.currentTarget.dataset.id}` })
  }
})
