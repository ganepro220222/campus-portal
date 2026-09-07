// packageC/message/index.js — 站内消息中心
const { get, put } = require('../../utils/request')
const {
  buildMessageLoadingPatch,
  buildMessageLoadedPatch,
  buildMessageFailurePatch,
  markMessageReadLocally
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
    this._navigating = false
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

  _markLocalRead(id) {
    const next = markMessageReadLocally(this.data.list, this.data.unreadCount, id)
    if (!next.changed) return false
    this.setData({ list: next.list, unreadCount: next.unreadCount })
    return true
  },

  onItemTap(e) {
    const { id, route } = e.currentTarget.dataset
    if (route && this._navigating) return
    if (id) {
      this._markLocalRead(id)
      put(`/messages/${id}/read`, {}, { silent: true }).catch((err) => {
        console.warn('[message] 标已读失败', err)
      })
    }
    if (!route) return
    this._navigating = true
    wx.navigateTo({
      url: route,
      fail: () => {
        this._navigating = false
        wx.showToast({ title: '打开详情失败', icon: 'none' })
      }
    })
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
