// packageC/help/login.js — 「无法登录？」问答
const { get } = require('../../utils/request')
const { normalizeLoginHelp, loginFaqItems } = require('../../utils/loginHelp')

Page({
  data: {
    items: loginFaqItems(null),
    openId: '', // 同时只展开一条；?q= 可指定
    phone: '',
    email: ''
  },

  onLoad(options) {
    const q = options && options.q
    if (q && this.data.items.some((x) => x.id === q)) {
      this.setData({ openId: q })
    }
    this._load()
  },

  /* 不带 token（手机里可能留着失效的旧 token）；取不到就用默认值，不弹错 */
  _load() {
    get('/auth/login-help', {}, { anonymous: true, silent: true })
      .then((res) => {
        const help = normalizeLoginHelp(res)
        this.setData({
          items: loginFaqItems(help),
          phone: help.phone,
          email: help.email
        })
      })
      .catch(() => {})
  },

  onToggle(e) {
    const id = e.currentTarget.dataset.id || ''
    this.setData({ openId: this.data.openId === id ? '' : id })
  },

  onCopy(e) {
    const val = e.currentTarget.dataset.val
    if (!val) return
    wx.setClipboardData({ data: String(val), success() { wx.showToast({ title: '已复制', icon: 'none' }) } })
  }
})
