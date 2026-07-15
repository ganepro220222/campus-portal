// packageA/craft/viewer-webview — 工艺品沉浸式鉴赏专用 web-view（不复用 college/webview）
const { buildCraftViewerUrl, isAllowedViewerHost } = require('../../utils/craftViewer')

Page({
  data: {
    url: ''
  },

  onLoad(options) {
    const id = options.id
    const title = decodeURIComponent(options.title || '立体鉴赏')
    let url = options.url ? decodeURIComponent(options.url) : ''

    if (id && !url) {
      url = buildCraftViewerUrl(id)
    }

    if (!url || !url.startsWith('https://')) {
      wx.showToast({ title: '鉴赏页地址未配置或需 HTTPS', icon: 'none', duration: 2500 })
      setTimeout(() => wx.navigateBack(), 1600)
      return
    }

    if (!isAllowedViewerHost(url)) {
      wx.showToast({ title: '鉴赏页域名未授权', icon: 'none', duration: 2500 })
      setTimeout(() => wx.navigateBack(), 1600)
      return
    }

    this.setData({ url })
    wx.setNavigationBarTitle({ title })
  },

  onError() {
    wx.showToast({ title: '页面加载失败，请稍后重试', icon: 'none' })
  }
})
