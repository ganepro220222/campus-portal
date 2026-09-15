// packageC/fontcheck/index.js
// 内嵌宋体子集的真机自检页。验收通过后整页可删。
Page({
  data: {
    infoList: []
  },

  onLoad() {
    this.setData({ infoList: this._collect() })
  },

  _collect() {
    let info = {}
    try {
      // getDeviceInfo / getAppBaseInfo 在低版本基础库上可能没有，退回 getSystemInfoSync
      const device = typeof wx.getDeviceInfo === 'function' ? wx.getDeviceInfo() : {}
      const appBase = typeof wx.getAppBaseInfo === 'function' ? wx.getAppBaseInfo() : {}
      const legacy = (!device.model || !appBase.SDKVersion) && typeof wx.getSystemInfoSync === 'function'
        ? wx.getSystemInfoSync()
        : {}
      info = {
        品牌: device.brand || legacy.brand || '-',
        机型: device.model || legacy.model || '-',
        系统: device.system || legacy.system || '-',
        平台: device.platform || legacy.platform || '-',
        微信版本: appBase.version || legacy.version || '-',
        基础库: appBase.SDKVersion || legacy.SDKVersion || '-'
      }
    } catch (e) {
      info = { 读取失败: String((e && e.message) || e) }
    }
    return Object.keys(info).map((k) => ({ k, v: String(info[k]) }))
  },

  onCopy() {
    const text = this.data.infoList.map((i) => `${i.k}：${i.v}`).join('\n')
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'none' }),
      fail: () => wx.showToast({ title: '复制失败', icon: 'none' })
    })
  }
})
