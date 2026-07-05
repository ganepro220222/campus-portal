// packageC/feedback/index.js — 意见反馈
const { post } = require('../../utils/request')

const TYPES = ['功能建议', '内容纠错', '使用问题', '其他']

Page({
  data: {
    types: TYPES,
    typeIndex: 0,
    content: '',
    contact: '',
    submitting: false
  },

  onType(e) { this.setData({ typeIndex: Number(e.currentTarget.dataset.i) }) },
  onContent(e) { this.setData({ content: e.detail.value }) },
  onContact(e) { this.setData({ contact: e.detail.value }) },

  onSubmit() {
    const { content, types, typeIndex, contact, submitting } = this.data
    if (submitting) return
    if (!content.trim()) return wx.showToast({ title: '请填写反馈内容', icon: 'none' })

    this.setData({ submitting: true })
    post('/feedback', {
      type: types[typeIndex],
      content: content.trim(),
      contact: contact.trim()
    }).then(() => {
      this.setData({ submitting: false })
      wx.showToast({ title: '感谢反馈，已提交', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1200)
    }).catch(() => {
      // 错误 toast 由 request.js 统一处理
      this.setData({ submitting: false })
    })
  }
})
