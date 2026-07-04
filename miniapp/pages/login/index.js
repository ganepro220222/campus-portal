// pages/login/index.js —— 登录（对齐 demo 深色风格，保留微信/学号鉴权）
const { wxLogin } = require('../../utils/auth')
const { post }    = require('../../utils/request')

Page({
  data: {
    studentNo: '',
    password: '',
    loading: false,
    statusBarHeight: 20
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 })
  },

  onInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value })
  },

  // 微信授权登录
  async onWxLogin() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      await wxLogin()
      this._loginSuccess()
    } catch (err) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 学号密码登录
  async onAccountLogin() {
    const { studentNo, password } = this.data
    if (!studentNo.trim()) return wx.showToast({ title: '请输入学号/账号', icon: 'none' })
    if (!password)          return wx.showToast({ title: '请输入密码', icon: 'none' })
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const data = await post('/auth/account-login', { studentNo: studentNo.trim(), password })
      const { setToken, setUserInfo } = require('../../utils/auth')
      setToken(data.token)
      setUserInfo(data.member)
      getApp().globalData.token = data.token
      this._loginSuccess()
    } catch {
      // 错误 toast 由 request.js 统一处理
    } finally {
      this.setData({ loading: false })
    }
  },

  _loginSuccess() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/index/index' })
    }
  }
})
