// packageA/craft/list.js — 文创列表逻辑
const { get } = require('../../utils/request')
const { decorateCrafts } = require('../../utils/decorate')
const mock = require('../../mock/defaults')
const mockGuard = require('../../utils/mockGuard')
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
    craftList: [],
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
    this._loadList(resolveFeedRetryMode(this.data.craftList.length))
  },

  async _loadList(options) {
    const generation = bumpListGeneration(this)
    const prev = this.data

    this.setData(buildFeedLoadingPatch(options, prev, 'craftList'))

    try {
      const list = await get('/crafts')
      if (isStaleListRequest(this, generation)) return

      let records = Array.isArray(list) ? list : []
      if (!records.length && mockGuard.useMock) {
        records = mock.crafts || []
      }
      this.setData(buildFeedLoadedPatch('craftList', decorateCrafts(records), 1, false))
    } catch (err) {
      if (isStaleListRequest(this, generation)) return
      console.warn('[craft/list] 加载失败', err)
      this.setData(buildFeedFailurePatch(
        err,
        prevForFeedFailure(options, prev, 'craftList'),
        'craftList',
        options
      ))
    }
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageA/craft/detail?id=${e.currentTarget.dataset.id}` })
  }
})
