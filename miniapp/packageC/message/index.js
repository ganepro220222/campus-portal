// packageC/message/index.js — 站内消息中心
const { get, put } = require('../../utils/request')
const {
  buildMessageLoadingPatch,
  buildMessageLoadedPatch,
  buildMessageFailurePatch
} = require('../../utils/messageCenterLoad')

Page({
  data: {
    list: [],
    unreadCount: 0,
    loading: true,
    error: false,
    refreshError: false
  },

  onShow() {
    this._load()
  },

  onPullDownRefresh() {
    this._load().finally(() => wx.stopPullDownRefresh())
  },

  onRetry() {
    this._load()
  },

  async _load() {
    const hasList = this.data.list.length > 0
    this.setData(buildMessageLoadingPatch(hasList))
    try {
      const list = await get('/messages')
      const stats = await get('/profile/stats').catch(() => null)
      this.setData(buildMessageLoadedPatch(list, stats))
    } catch (e) {
      this.setData(buildMessageFailurePatch(hasList))
    }
  },

  async onItemTap(e) {
    const { id, route } = e.currentTarget.dataset
    if (id) {
      try {
        await put(`/messages/${id}/read`)
      } catch (err) {
        console.warn('[message] 标已读失败', err)
      }
      const list = this.data.list.map(m =>
        String(m.id) === String(id) ? { ...m, readStatus: 1 } : m
      )
      const unreadCount = list.filter(m => m.readStatus === 0).length
      this.setData({ list, unreadCount })
    }
    if (route) {
      wx.navigateTo({ url: route, fail: () => {} })
    }
  },

  async onReadAll() {
    try {
      await put('/messages/read-all')
      const list = this.data.list.map(m => ({ ...m, readStatus: 1 }))
      this.setData({ list, unreadCount: 0 })
      wx.showToast({ title: '已全部标为已读', icon: 'none' })
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    }
  }
})
