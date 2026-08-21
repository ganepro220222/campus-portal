// packageA/craft/list.js — 文创列表逻辑
const { get } = require('../../utils/request')
const { decorateCrafts } = require('../../utils/decorate')
const mock = require('../../mock/defaults')
const mockGuard = require('../../utils/mockGuard')
const {
  buildFeedLoadingPatch,
  buildFeedLoadedPatch,
  buildFeedFailurePatch
} = require('../../utils/feedListPage')

Page({
  data: {
    craftList: [],
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
    const silent = !reset && prev.craftList && prev.craftList.length > 0
    this.setData(buildFeedLoadingPatch(reset))
    try {
      const list = await get('/crafts')
      let records = Array.isArray(list) ? list : []
      if (!records.length && mockGuard.useMock) {
        records = mock.crafts || []
      }
      this.setData(buildFeedLoadedPatch('craftList', decorateCrafts(records), 1, false))
    } catch (err) {
      console.warn('[craft/list] 加载失败', err)
      this.setData(buildFeedFailurePatch(err, silent ? prev : { craftList: [] }, 'craftList'))
    }
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageA/craft/detail?id=${e.currentTarget.dataset.id}` })
  }
})
