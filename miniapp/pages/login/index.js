// pages/login/index.js
const { wxLogin, bindWxAccount, applyLoginData, handlePostLogin } = require('../../utils/auth')
const { post } = require('../../utils/request')
const {
  ACCOUNT_LABEL,
  FIELD_TIPS,
  WX_BIND_PROMPT,
  LAST_LOGIN_METHOD_KEY,
  initialLoginPanel,
  wxLoginFailureToast
} = require('../../utils/loginHelp')

const HELP_PAGE = '/packageC/help/login'

function rememberLoginMethod(method) {
  try {
    wx.setStorageSync(LAST_LOGIN_METHOD_KEY, method)
  } catch (e) {
    // 记不住不影响登录
  }
}

function readLastLoginMethod() {
  try {
    return wx.getStorageSync(LAST_LOGIN_METHOD_KEY) || ''
  } catch (e) {
    return ''
  }
}

Page({
  data: {
    panel: 'wx', // wx | account | bind
    accountLabel: ACCOUNT_LABEL,
    tips: FIELD_TIPS,
    openTip: '', // 同时只开一个问号
    studentNo: '',
    password: '',
    loading: false,
    statusBarHeight: 20,
    wxBindToken: '',
    // 当前聚焦的输入框字段名。两格长得一样，
    // 没有聚焦态就只剩一个光标可辨认（样式见 .field-input.on）。
    focusField: '',
    pwdVisible: {
      password: false
    }
  },

  _panelBeforeBind: 'wx',  // 退出绑定时回到这里

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({
      statusBarHeight: sys.statusBarHeight || 20,
      panel: initialLoginPanel(readLastLoginMethod())
    })
  },

  onBack() {
    if (this.data.panel === 'bind') {
      this.setData({
        panel: this._panelBeforeBind,
        wxBindToken: '',
        password: '',
        openTip: ''
      })
      return
    }
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },

  onShowAccount() {
    this.setData({ panel: 'account', openTip: '' })
  },

  onToggleTip(e) {
    const tip = e.currentTarget.dataset.tip || ''
    this.setData({ openTip: this.data.openTip === tip ? '' : tip })
  },

  onHelp() {
    wx.navigateTo({ url: HELP_PAGE })
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

  onForgotPassword() {
    if (this.data.panel === 'bind') {
      wx.showModal({
        title: '无法自助找回',
        content: '这个微信还没绑定学号 / 工号。请联系学院管理员重置密码，用临时密码登录后再绑定微信。',
        showCancel: false
      })
      return
    }
    wx.showModal({
      title: '忘记密码',
      content: '这个微信已经绑定过学号 / 工号：验证后可直接设置新密码。还没绑定：请联系学院管理员重置。',
      confirmText: '微信验证',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ url: '/packageC/profile/change-password/index?mode=wx' })
        }
      }
    })
  },

  async onWxLogin() {
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const data = await wxLogin()
      if (data && data.needBind) {
        if (this.data.panel !== 'bind') this._panelBeforeBind = this.data.panel
        this.setData({
          panel: 'bind',
          wxBindToken: data.wxBindToken || '',
          password: '',
          openTip: ''
        })
        return
      }
      rememberLoginMethod('wx')
      this._afterLogin(data)
    } catch (err) {
      const msg = wxLoginFailureToast(err)
      if (msg) wx.showToast({ title: msg, icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  async onBindWxAccount() {
    const { studentNo, password, wxBindToken } = this.data
    if (!wxBindToken) return wx.showToast({ title: '请重新点微信一键登录', icon: 'none' })
    if (!studentNo.trim()) return wx.showToast({ title: '请输入学号 / 工号', icon: 'none' })
    if (!password) return wx.showToast({ title: '请输入密码', icon: 'none' })
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const data = await bindWxAccount(wxBindToken, studentNo.trim(), password)
      rememberLoginMethod('wx')
      this._afterLogin(data)
    } catch {
      // request.js 统一错误提示
    } finally {
      this.setData({ loading: false })
    }
  },

  async onAccountLogin() {
    const { studentNo, password } = this.data
    if (!studentNo.trim()) return wx.showToast({ title: '请输入学号 / 工号', icon: 'none' })
    if (!password) return wx.showToast({ title: '请输入密码', icon: 'none' })
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const data = await post('/auth/account-login', { studentNo: studentNo.trim(), password })
      applyLoginData(data)
      rememberLoginMethod('account')
      if (data.mustChangePassword) {
        // 改密页改完会问绑定
        const { redirectToChangePassword } = require('../../utils/auth')
        redirectToChangePassword()
        return
      }
      if (data.wxBound === false) {
        wx.showModal({
          ...WX_BIND_PROMPT,
          success: async (res) => {
            if (res.confirm) {
              try {
                const { bindWxAuthenticated } = require('../../utils/auth')
                await bindWxAuthenticated()
                rememberLoginMethod('wx')
                wx.showToast({ title: '绑定成功', icon: 'success' })
              } catch {
                // request.js 已提示原因；已登录成功，照常放行
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
