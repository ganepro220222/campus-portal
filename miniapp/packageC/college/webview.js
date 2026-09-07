const {
  WEBVIEW_ROUTE,
  resolveWebviewBoot
} = require('../../utils/collegeWebview')
const { shouldNavigateBackAfterSubmit } = require('../../utils/feedbackPage')

Page({
  data: {
    url: '',
    title: '学院内容'
  },

  onLoad(options) {
    const boot = resolveWebviewBoot(options)
    if (!boot.ok) {
      wx.showToast({ title: '链接无效', icon: 'none' })
      this._leaveTimer = setTimeout(() => {
        this._leaveTimer = null
        if (!shouldNavigateBackAfterSubmit(getCurrentPages(), WEBVIEW_ROUTE)) return
        wx.navigateBack()
      }, 1500)
      return
    }
    this.setData({ url: boot.url, title: boot.title })
    wx.setNavigationBarTitle({ title: boot.title })
  },

  onUnload() {
    if (this._leaveTimer) {
      clearTimeout(this._leaveTimer)
      this._leaveTimer = null
    }
  }
})
