// packageA/craft/detail.js — 文创详情逻辑（占位页 UI 不变）
const { get } = require('../../utils/request')
const { mergeCraftDetail } = require('../../utils/content')
const mock = require('../../mock/defaults')

Page({
  data: { craftId: null, detail: null },

  onLoad(opts) {
    const id = opts.id
    this.setData({ craftId: id })
    if (id) this._loadDetail(id)
  },

  async _loadDetail(id) {
    try {
      const raw = await get(`/crafts/${id}`).catch(() => null)
      this.setData({ detail: mergeCraftDetail(raw, mock.craftDetail) })
    } catch (err) {
      console.warn('[craft/detail] 加载失败', err)
      this.setData({ detail: mock.craftDetail })
    }
  }
})
