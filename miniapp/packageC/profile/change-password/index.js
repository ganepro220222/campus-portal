// pages/change-password/index.js
const {
  applyLoginData,
  getToken,
  clearMustChangePasswordFlag,
  isMustChangePasswordRequired
} = require('../../../utils/auth')
const { post } = require('../../../utils/request')
const {
  shouldApplyChangePasswordSuccess,
  changePassword401PageAction,
  canLogoutDuringChangePassword,
  resolveChangePasswordMode,
  needsOldPassword,
  requiresLoginForChangePasswordPage,
  changePasswordPageCopy,
  buildChangePasswordPayload,
  validateNewPasswordPair
} = require('../../../utils/changePasswordFlow')

function wxLoginCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (!res.code) return reject(new Error('wx.login 失败'))
        resolve(res.code)
      },
      fail: reject
    })
  })
}

Page({
  data: {
    mode: 'forced',
    title: '请设置新密码',
    subtitle: '',
    showOldPassword: false,
    canLeave: false,
    showLogout: true,
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    loading: false,
    statusBarHeight: 20,
    focusField: '',
    pwdVisible: {
      oldPassword: false,
      newPassword: false,
      confirmPassword: false
    }
  },

  _submitSeq: 0,

  onLoad(options) {
    const sys = wx.getSystemInfoSync()
    const mode = resolveChangePasswordMode(
      options && options.mode,
      isMustChangePasswordRequired()
    )
    if (requiresLoginForChangePasswordPage(mode) && !getToken()) {
      wx.reLaunch({ url: '/pages/login/index' })
      return
    }
    this._applyMode(mode, { statusBarHeight: sys.statusBarHeight || 20 })
  },

  _applyMode(mode, extra) {
    const copy = changePasswordPageCopy(mode)
    this.setData({
      ...extra,
      mode,
      title: copy.title,
      subtitle: copy.subtitle,
      showOldPassword: needsOldPassword(mode),
      canLeave: mode !== 'forced',
      showLogout: mode === 'forced',
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  },

  onBack() {
    if (this.data.mode === 'forced') {
      wx.showToast({ title: '请先完成密码修改', icon: 'none' })
      return
    }
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.reLaunch({ url: '/pages/login/index' })
    }
  },

  onForgotViaWx() {
    if (this.data.loading) return
    this._applyMode('wx')
  },

  onInput(e) {
    this.setData({ [e.currentTarget.dataset.field]: e.detail.value })
  },

  onFieldFocus(e) {
    this.setData({ focusField: e.currentTarget.dataset.field || '' })
  },

  onFieldBlur(e) {
    if (this.data.focusField === e.currentTarget.dataset.field) {
      this.setData({ focusField: '' })
    }
  },

  onTogglePwd(e) {
    const field = e.currentTarget.dataset.field
    if (!field || !(field in this.data.pwdVisible)) return
    this.setData({ ['pwdVisible.' + field]: !this.data.pwdVisible[field] })
  },

  async onChangePassword() {
    const { mode, oldPassword, newPassword, confirmPassword, showOldPassword } = this.data
    if (showOldPassword && !oldPassword) {
      return wx.showToast({ title: '请输入当前密码', icon: 'none' })
    }
    const pairError = validateNewPasswordPair(newPassword, confirmPassword)
    if (pairError) return wx.showToast({ title: pairError, icon: 'none' })
    if (this.data.loading) return
    const seq = ++this._submitSeq
    this.setData({ loading: true })
    try {
      let wxCode = ''
      if (mode === 'wx') {
        wxCode = await wxLoginCode()
      }
      const data = await post(
        '/auth/change-password',
        buildChangePasswordPayload({ mode, oldPassword, newPassword, wxCode }),
        { silent: true }
      )
      if (!shouldApplyChangePasswordSuccess(seq, this._submitSeq)) return
      applyLoginData(data)
      clearMustChangePasswordFlag()
      wx.showToast({ title: '修改成功', icon: 'success' })
      setTimeout(() => wx.reLaunch({ url: '/pages/index/index' }), 500)
    } catch (err) {
      if (!shouldApplyChangePasswordSuccess(seq, this._submitSeq)) return
      const action401 = changePassword401PageAction(err, true)
      if (action401.toast) {
        wx.showToast({ title: action401.toast, icon: 'none', duration: 2500 })
        return
      }
      wx.showToast({ title: (err && err.message) || '修改失败', icon: 'none' })
    } finally {
      if (shouldApplyChangePasswordSuccess(seq, this._submitSeq)) {
        this.setData({ loading: false })
      }
    }
  },

  onLogout() {
    if (!canLogoutDuringChangePassword(this.data.loading)) return
    this._submitSeq += 1
    getApp().logout()
  }
})
