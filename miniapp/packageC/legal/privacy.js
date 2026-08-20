// packageC/legal/privacy.js — 隐私与用户协议（远程 + 缓存 + 内置基线）
const { loadLegalDocuments } = require('../../utils/legalDocuments')

Page({
  data: {
    privacyHtml: '',
    agreementHtml: '',
    loading: true,
    source: '',
    sourceHint: '',
    showRetry: false
  },

  onLoad() {
    this.load()
  },

  async load() {
    this.setData({ loading: true })
    const doc = await loadLegalDocuments()
    this.setData({
      privacyHtml: doc.privacy,
      agreementHtml: doc.agreement,
      source: doc.source,
      sourceHint: doc.hint,
      showRetry: doc.source !== 'remote' || doc.fetchError,
      loading: false
    })
  },

  onRetry() {
    if (this.data.loading) return
    this.load()
  }
})
