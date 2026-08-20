// packageC/profile/edit.js — 个人资料编辑
const { get, put } = require('../../utils/request')
const { requireLogin, setUserInfo, getUserInfo } = require('../../utils/auth')
const { buildFormFromProfile, validateProfileForm, mergeSavedProfile } = require('../../utils/profileForm')

Page({
  data: {
    loading: true,
    submitting: false,
    form: buildFormFromProfile(null)
  },

  onLoad() {
    if (!getApp().isLoggedIn()) {
      requireLogin(() => this._load())
      return
    }
    this._load()
  },

  async _load() {
    this.setData({ loading: true })
    try {
      const profile = await get('/profile')
      this.setData({
        loading: false,
        form: buildFormFromProfile(profile)
      })
    } catch (err) {
      this.setData({ loading: false })
      console.warn('[profile/edit] load failed', err)
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    if (!field) return
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  async onSubmit() {
    if (this.data.submitting) return
    const check = validateProfileForm(this.data.form)
    if (!check.ok) {
      wx.showToast({ title: check.message, icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    try {
      const saved = await put('/profile', check.payload)
      const merged = mergeSavedProfile(getUserInfo(), saved)
      setUserInfo(merged)
      wx.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 600)
    } catch (err) {
      console.warn('[profile/edit] save failed', err)
    } finally {
      this.setData({ submitting: false })
    }
  }
})
