// packageC/college/list.js — 学院矩阵
const { request } = require('../../utils/request')
const mock = require('../../mock/defaults')

Page({
  data: {
    colleges: [],
    loading: true
  },

  onLoad() {
    this.loadColleges()
  },

  onPullDownRefresh() {
    this.loadColleges().finally(() => wx.stopPullDownRefresh())
  },

  async loadColleges() {
    this.setData({ loading: true })
    try {
      const list = await request('/colleges', 'GET')
      this.setData({ colleges: list || [], loading: false })
    } catch (e) {
      this.setData({ colleges: mock.colleges, loading: false })
    }
  },

  onCardTap(e) {
    const id = e.currentTarget.dataset.id
    const item = (this.data.colleges || []).find(c => String(c.id) === String(id))
    if (!item) return

    const type = item.contentType || 'manual'
    if (type === 'jump') {
      if (!item.appid) {
        wx.showToast({ title: '未配置目标小程序', icon: 'none' })
        return
      }
      wx.navigateToMiniProgram({
        appId: item.appid,
        path: item.path || '',
        fail: () => wx.showToast({ title: '跳转失败，请检查 AppID 是否已关联', icon: 'none', duration: 3000 })
      })
      return
    }
    if (type === 'embed_h5') {
      if (!item.contentUrl) {
        wx.showToast({ title: '未配置 H5 地址', icon: 'none' })
        return
      }
      wx.navigateTo({
        url: '/packageC/college/webview?url=' + encodeURIComponent(item.contentUrl) + '&title=' + encodeURIComponent(item.name || '')
      })
      return
    }
    if (type === 'api_sync') {
      wx.showToast({ title: '接口同步功能建设中', icon: 'none' })
      return
    }
    wx.showModal({
      title: item.name,
      content: item.desc || item.description || '暂无详细介绍',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
