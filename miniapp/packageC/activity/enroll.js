// packageC/activity/enroll.js — 活动报名
const { get, post } = require('../../utils/request')
const { mergeEnrollResult } = require('../../utils/activity')
const { requireLogin } = require('../../utils/auth')
const { requestSubscribeMany, buildEnrollSubscribeRequests } = require('../../utils/subscribe')
const { mapEnrollVoucherFields } = require('../../utils/enrollVoucher')
const { validateEnrollForm } = require('../../utils/enrollForm')
const { exportVoucherQr } = require('../../utils/voucherQrCanvas')
const { resolveVoucherQrSrc } = require('../../utils/enrollVoucherPage')
const {
  buildEnrollLoadingPatch,
  buildEnrollLoadedView,
  buildEnrollFailurePatch,
  canSubmitEnroll
} = require('../../utils/enrollPageInit')

Page({
  data: {
    loading: true,
    loadError: false,
    notFound: false,
    submitting: false,
    activityId: null,
    detail: null,
    form: { name: '', phone: '', college: '', grade: '' },
    profileSnapshot: null,
    fieldErrors: { name: '', phone: '', college: '', grade: '' },
    hasEnrolled: false,
    statusLabel: '',
    enrolledHint: '',
    success: false,
    result: null,
    resultHint: '',
    showVoucherQr: false,
    voucherQrSrc: ''
  },

  onLoad(opts) {
    const id = opts.id || opts.activityId
    if (!id) {
      this.setData({ loading: false, notFound: true })
      return
    }
    this.setData({ activityId: id })
    if (!getApp().isLoggedIn()) {
      this.setData({ loading: false })
      requireLogin(() => this._init(id))
      return
    }
    this._init(id)
  },

  async _init(id) {
    this.setData(buildEnrollLoadingPatch())
    try {
      const [raw, profile] = await Promise.all([
        get(`/activities/${id}`),
        get('/profile').catch(() => null)
      ])
      const view = buildEnrollLoadedView(raw, profile, id)
      this.setData(view, () => {
        if (view.detail.enrollStatus === 'approved' && view.detail.voucherCode) {
          this._refreshVoucherQr(mapEnrollVoucherFields({
            enrollId: view.detail.enrollId,
            voucherCode: view.detail.voucherCode,
            enrollStatus: view.detail.enrollStatus
          }))
        }
      })
    } catch (err) {
      console.warn('[activity/enroll] 初始化失败', err)
      this.setData(buildEnrollFailurePatch(err))
    }
  },

  onRetry() {
    const id = this.data.activityId
    if (id) this._init(id)
  },

  onBackList() {
    wx.redirectTo({ url: '/pages/activity/index' })
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const patch = { [`form.${field}`]: e.detail.value }
    if (this.data.fieldErrors && this.data.fieldErrors[field]) {
      patch[`fieldErrors.${field}`] = ''
    }
    this.setData(patch)
  },

  async onSubmit() {
    if (!canSubmitEnroll(this.data)) return

    const { activityId, form, profileSnapshot } = this.data
    const validation = validateEnrollForm(form, profileSnapshot)
    if (!validation.ok) {
      this.setData({
        [`fieldErrors.${validation.field}`]: validation.message
      })
      wx.showToast({ title: validation.message, icon: 'none' })
      return
    }

    this.setData({ submitting: true, fieldErrors: { name: '', phone: '', college: '', grade: '' } })
    try {
      await requestSubscribeMany(buildEnrollSubscribeRequests(this.data.detail.needReview))
      const raw = await post(`/activities/${activityId}/enroll`, validation.payload)
      const result = mergeEnrollResult(raw)
      const resultHint = result.status === 'pending'
        ? '报名已提交，请等待管理员审核。'
        : '报名成功！请保存凭证码，活动当天签到使用。'
      this.setData({
        success: true,
        result,
        resultHint,
        submitting: false
      }, () => {
        this._refreshVoucherQr(mapEnrollVoucherFields(result))
      })
    } catch (err) {
      this.setData({ submitting: false })
    }
  },

  onBackDetail() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.redirectTo({ url: `/packageC/activity/detail?id=${this.data.activityId}` })
    }
  },

  onMyEnrolls() {
    wx.navigateTo({ url: '/packageC/profile/list?type=enrolls' })
  },

  async _refreshVoucherQr(ctx) {
    try {
      const view = await resolveVoucherQrSrc(ctx, {
        fetchVoucherQrUrl: async (enrollId) => {
          const voucher = await get(`/enrolls/${enrollId}/voucher`)
          return voucher && voucher.qrCodeUrl
        },
        exportLocalQr: (text) => exportVoucherQr(this, 'voucherQrCanvas', text)
      })
      this.setData({
        showVoucherQr: view.showVoucherQr,
        voucherQrSrc: view.voucherQrSrc
      })
    } catch (err) {
      console.warn('[activity/enroll] 本地二维码生成失败', err)
      this.setData({ showVoucherQr: false, voucherQrSrc: '' })
      wx.showToast({ title: '二维码生成失败，请使用凭证码签到', icon: 'none' })
    }
  },

  onPreviewQr() {
    const src = this.data.voucherQrSrc
    if (src) wx.previewImage({ urls: [src] })
  }
})
