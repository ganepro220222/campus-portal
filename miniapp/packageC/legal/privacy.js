// packageC/legal/privacy.js — 隐私与用户协议（内容由后台「协议内容」配置，即时生效）
const { get } = require('../../utils/request')

Page({
  data: {
    privacyHtml: '',
    agreementHtml: '',
    loading: true
  },

  onLoad() {
    this.load()
  },

  load() {
    this.setData({ loading: true })
    get('/config/documents')
      .then((res) => {
        const d = res || {}
        this.setData({
          privacyHtml: d.privacy || '',
          agreementHtml: d.agreement || '',
          loading: false
        })
      })
      .catch(() => this.setData({ loading: false }))
  },

  // 后台未配置或拉取失败时，由 onRetry 重新请求。
  onRetry() {
    if (this.data.loading) return
    this.load()
  }
})
