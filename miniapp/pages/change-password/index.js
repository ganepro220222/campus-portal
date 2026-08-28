// pages/change-password/index.js
const { applyLoginData, getToken, clearMustChangePasswordFlag, setMustChangePasswordFlag } = require('../../utils/auth')
const { post } = require('../../utils/request')

Page({
  data: {
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

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 })
    if (!getToken()) {
      wx.reLaunch({ url: '/pages/login/index' })
    }
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
      const data = await post('/auth/change-password', { oldPassword, newPassword }, { silent: true })
      applyLoginData(data)
      clearMustChangePasswordFlag()
      wx.showToast({ title: '修改成功', icon: 'success' })
      setTimeout(() => wx.reLaunch({ url: '/pages/index/index' }), 500)
    } catch (err) {
      wx.showToast({ title: (err && err.message) || '修改失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})
