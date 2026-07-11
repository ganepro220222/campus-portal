// packageA/craft/list.js — 文创列表逻辑
const { get } = require('../../utils/request')
const { decorateCrafts } = require('../../utils/decorate')
const mock = require('../../mock/defaults')
const { withListFallback } = require('../../utils/mockGuard')

Page({
  data: { craftList: [], loading: true },

  onLoad() { this._loadList() },

  async _loadList() {
    this.setData({ loading: true })
    try {
      const list = await get('/crafts').catch(() => null)
      const records = withListFallback(list, mock.crafts)
      this.setData({ craftList: decorateCrafts(records), loading: false })
    } catch (err) {
      console.warn('[craft/list] 加载失败', err)
      this.setData({ craftList: decorateCrafts(withListFallback(null, mock.crafts)), loading: false })
    }
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageA/craft/detail?id=${e.currentTarget.dataset.id}` })
  }
})
