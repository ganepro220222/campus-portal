// pages/login/index.js
const { wxLogin, bindWxAccount, applyLoginData, handlePostLogin, getToken } = require('../../utils/auth')
const { post } = require('../../utils/request')

Page({
  data: {
    studentNo: '',
    password: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    loading: false,
    statusBarHeight: 20,
    bindMode: false,
    changePasswordMode: false,
    wxBindToken: '',
    // 当前聚焦的输入框字段名。深色表单上两格长得一样，
    // 没有聚焦态就只剩一个光标可辨认（样式见 .field-input.on）。
    focusField: '',
    /* 各密码框的显隐开关。逐个存而不是共用一个：改密页有三格
       （当前 / 新 / 确认），"新密码"与"确认密码"往往要同时看着比对。 */
    pwdVisible: {
      password: false,
      oldPassword: false,
      newPassword: false,
      confirmPassword: false
    }
  },

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 })
    if (options.mode === 'changePassword') {
      const { getToken, redirectToChangePassword } = require('../../utils/auth')
      if (getToken()) {
        redirectToChangePassword()
      }
    }
  },

  onBack() {
    if (this.data.changePasswordMode) {
      wx.showToast({ title: '请先完成密码修改', icon: 'none' })
      return
    }
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

  onFieldFocus(e) {
    this.setData({ focusField: e.currentTarget.dataset.field || '' })
  },

  /* 失焦时只清掉"还是自己"的那一次：两格之间切换时 blur 与 focus 的先后
     在不同基础库上并不一致，无条件清空会把刚聚上的那格也一起熄掉。 */
  onFieldBlur(e) {
    if (this.data.focusField === e.currentTarget.dataset.field) {
      this.setData({ focusField: '' })
    }
  },

  /* 点眼睛会让输入框失焦（小程序里点任何 view 都会），因而聚焦态那圈金边会消失。
     没有去做"切完再自动聚回来"：`focus` 属性得靠 false→true 翻转触发，
     和这里的 blur 清理逻辑绕在一起容易把键盘搞出闪烁，
     而显隐通常是打完或打之前点一下，不是边打边点。 */
  onTogglePwd(e) {
    const field = e.currentTarget.dataset.field
    if (!field || !(field in this.data.pwdVisible)) return
    this.setData({ ['pwdVisible.' + field]: !this.data.pwdVisible[field] })
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
        wx.showToast({ title: '请绑定账号', icon: 'none' })
        return
      }
      this._afterLogin(data)
    } catch (err) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async onBindWxAccount() {
    const { studentNo, password, wxBindToken } = this.data
    if (!wxBindToken) return wx.showToast({ title: '请重新微信登录', icon: 'none' })
    if (!studentNo.trim()) return wx.showToast({ title: '请输入账号', icon: 'none' })
    if (!password) return wx.showToast({ title: '请输入密码', icon: 'none' })
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const data = await bindWxAccount(wxBindToken, studentNo.trim(), password)
      this._afterLogin(data)
    } catch {
      // request.js 统一错误提示
    } finally {
      this.setData({ loading: false })
    }
  },

  async onAccountLogin() {
    const { studentNo, password } = this.data
    if (!studentNo.trim()) return wx.showToast({ title: '请输入账号', icon: 'none' })
    if (!password) return wx.showToast({ title: '请输入密码', icon: 'none' })
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const data = await post('/auth/account-login', { studentNo: studentNo.trim(), password })
      applyLoginData(data)
      if (data.mustChangePassword) {
        const { redirectToChangePassword } = require('../../utils/auth')
        redirectToChangePassword()
        return
      }
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

  async onChangePassword() {
    const { oldPassword, newPassword, confirmPassword } = this.data
    if (!oldPassword) return wx.showToast({ title: '请输入当前密码', icon: 'none' })
    if (!newPassword) return wx.showToast({ title: '请输入新密码', icon: 'none' })
    if (newPassword.length < 8) return wx.showToast({ title: '新密码至少8位', icon: 'none' })
    if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return wx.showToast({ title: '新密码须含字母和数字', icon: 'none' })
    }
    if (newPassword !== confirmPassword) {
      return wx.showToast({ title: '两次输入不一致', icon: 'none' })
    }
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const data = await post('/auth/change-password', { oldPassword, newPassword })
      applyLoginData(data)
      wx.showToast({ title: '修改成功', icon: 'success' })
      this.setData({ changePasswordMode: false })
      setTimeout(() => this._loginSuccess(), 500)
    } catch {
      // request.js 统一错误提示
    } finally {
      this.setData({ loading: false })
    }
  },

  _enterChangePasswordMode() {
    if (!getToken()) return false
    this.setData({
      changePasswordMode: true,
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      password: '',
      bindMode: false
    })
    wx.showToast({ title: '请修改初始密码', icon: 'none' })
    return true
  },

  _afterLogin(data) {
    if (handlePostLogin(data, () => this._loginSuccess())) {
      return
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
