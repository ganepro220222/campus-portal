// packageC/craft/viewer-webview — 工艺品沉浸式鉴赏专用 web-view（与 college/webview 同包，避免 packageA 预加载编译失败）
const { buildCraftViewerUrl, isAllowedViewerHost, isValidViewerUrl } = require('../../utils/craftViewer')

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

    if (!isValidViewerUrl(url)) {
      wx.showToast({ title: '鉴赏页地址未配置', icon: 'none', duration: 2500 })
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
