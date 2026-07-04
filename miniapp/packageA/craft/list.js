// packageA/craft/list.js — 文创列表逻辑（占位页 UI 不变）
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')

Page({
  data: { craftList: [], loading: true },

  onLoad() { this._loadList() },

  async _loadList() {
    this.setData({ loading: true })
    try {
      const list = await get('/crafts').catch(() => null)
      const craftList = (list && list.length) ? list : mock.crafts
      this.setData({ craftList, loading: false })
    } catch (err) {
      console.warn('[craft/list] 加载失败', err)
      this.setData({ craftList: mock.crafts, loading: false })
    }
  }
})
