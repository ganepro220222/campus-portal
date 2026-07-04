// packageB/resource/list.js — 资源列表逻辑（占位页 UI 不变）
const { get } = require('../../utils/request')
const { mergeResourceList } = require('../../utils/content')
const mock = require('../../mock/defaults')

Page({
  data: { resourceList: [], loading: true },

  onLoad() { this._loadList() },

  async _loadList() {
    this.setData({ loading: true })
    try {
      const list = await get('/resources').catch(() => null)
      this.setData({
        resourceList: mergeResourceList(list),
        loading: false
      })
    } catch (err) {
      console.warn('[resource/list] 加载失败', err)
      this.setData({ resourceList: mergeResourceList(null), loading: false })
    }
  }
})
