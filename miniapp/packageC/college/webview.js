Page({
  data: {
    url: '',
    title: '学院内容'
  },

  onLoad(options) {
    const url = decodeURIComponent(options.url || '')
    const title = decodeURIComponent(options.title || '学院内容')
    if (!url || !url.startsWith('https://')) {
      wx.showToast({ title: '链接无效', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    this.setData({ url, title })
    wx.setNavigationBarTitle({ title })
  }
})
