// pages/login/index.js
const { wxLogin, bindWxAccount } = require('../../utils/auth')
const { post }    = require('../../utils/request')

Page({
  data: {
    studentNo: '',
    password: '',
    loading: false,
    statusBarHeight: 20,
    bindMode: false,
    wxBindToken: ''
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 })
  },

  onBack() {
    if (this.data.bindMode) {
      this.setData({ bindMode: false, wxBindToken: '', studentNo: '', password: '' })
      return
    }
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  onInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value })
  },

  async onWxLogin() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const data = await wxLogin()
      if (data && data.needBind) {
        this.setData({
          bindMode: true,
          wxBindToken: data.wxBindToken || ''
        })
        wx.showToast({ title: '请绑定学号', icon: 'none' })
        return
      }
      this._loginSuccess()
    } catch (err) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async onBindWxAccount() {
    const { studentNo, password, wxBindToken } = this.data
    if (!wxBindToken) return wx.showToast({ title: '请重新微信登录', icon: 'none' })
    if (!studentNo.trim()) return wx.showToast({ title: '请输入学号/账号', icon: 'none' })
    if (!password) return wx.showToast({ title: '请输入密码', icon: 'none' })
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      await bindWxAccount(wxBindToken, studentNo.trim(), password)
      this._loginSuccess()
    } catch {
      // request.js 统一错误提示
    } finally {
      this.setData({ loading: false })
    }
  },

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
      if (data.wxBound === false) {
        wx.showModal({
          title: '绑定微信',
          content: '绑定后可使用微信一键登录，是否现在绑定？',
          confirmText: '绑定',
          success: async (res) => {
            if (res.confirm) {
              try {
                const { bindWxAuthenticated } = require('../../utils/auth')
                await bindWxAuthenticated()
                wx.showToast({ title: '绑定成功', icon: 'success' })
              } catch {
                // 忽略，已学号登录成功
              }
            }
            this._loginSuccess()
          }
        })
        return
      }
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
