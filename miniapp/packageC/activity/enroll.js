// packageC/activity/enroll.js — 活动报名
const { get, post } = require('../../utils/request')
const {
  mergeActivityDetail,
  mergeEnrollResult,
  enrollStatusLabel,
  hasActiveEnroll
} = require('../../utils/activity')
const { requireLogin } = require('../../utils/auth')
const { requestSubscribe } = require('../../utils/subscribe')
const {
  buildVoucherQrText,
  pickRemoteQrSrc,
  shouldShowVoucherQr,
  mapEnrollVoucherFields
} = require('../../utils/enrollVoucher')
const { exportVoucherQr } = require('../../utils/voucherQrCanvas')

Page({
  data: {
    loading: true,
    submitting: false,
    activityId: null,
    detail: null,
    form: { name: '', phone: '', college: '', grade: '' },
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
      this.setData({ loading: false })
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
    this.setData({ loading: true })
    try {
      const [raw, profile] = await Promise.all([
        get(`/activities/${id}`).catch(() => null),
        get('/profile').catch(() => null)
      ])
      const detail = mergeActivityDetail(raw)
      const active = hasActiveEnroll(detail)
      let enrolledHint = ''
      if (detail.enrollStatus === 'pending') {
        enrolledHint = '您的报名正在审核中，请耐心等待。'
      } else if (detail.enrollStatus === 'approved') {
        enrolledHint = '您已成功报名，活动当天请凭凭证码签到。'
      }
      this.setData({
        detail,
        loading: false,
        hasEnrolled: active,
        statusLabel: enrollStatusLabel(detail.enrollStatus),
        enrolledHint,
        form: {
          name: '',
          phone: '',
          college: (profile && profile.college) || '',
          grade: ''
        }
      }, () => {
        if (detail.enrollStatus === 'approved' && detail.voucherCode) {
          this._refreshVoucherQr(mapEnrollVoucherFields({
            enrollId: detail.enrollId,
            voucherCode: detail.voucherCode,
            enrollStatus: detail.enrollStatus
          }))
        }
      })
    } catch (err) {
      console.warn('[activity/enroll] 初始化失败', err)
      this.setData({ detail: null, loading: false })
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  async onSubmit() {
    if (this.data.submitting) return
    const { activityId, form } = this.data
    if (!activityId) return

    this.setData({ submitting: true })
    try {
      await requestSubscribe('enroll_success', 'enrollSuccess')
      const payload = {}
      if (form.name.trim()) payload.name = form.name.trim()
      if (form.phone.trim()) payload.phone = form.phone.trim()
      if (form.college.trim()) payload.college = form.college.trim()
      if (form.grade.trim()) payload.grade = form.grade.trim()

      const raw = await post(`/activities/${activityId}/enroll`, payload)
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
    const fields = mapEnrollVoucherFields(ctx)
    const { status, voucherCode, qrCodeUrl, enrollId } = fields
    if (!shouldShowVoucherQr(status, voucherCode)) {
      this.setData({ showVoucherQr: false, voucherQrSrc: '' })
      return
    }

    let remote = pickRemoteQrSrc(qrCodeUrl)
    if (!remote && enrollId) {
      try {
        const voucher = await get(`/enrolls/${enrollId}/voucher`)
        remote = pickRemoteQrSrc(voucher && voucher.qrCodeUrl)
      } catch (err) {
        console.warn('[activity/enroll] 凭证接口未返回二维码', err)
      }
    }
    if (remote) {
      this.setData({ showVoucherQr: true, voucherQrSrc: remote })
      return
    }

    try {
      const text = buildVoucherQrText(voucherCode)
      const path = await exportVoucherQr(this, 'voucherQrCanvas', text)
      this.setData({ showVoucherQr: true, voucherQrSrc: path })
    } catch (err) {
      console.warn('[activity/enroll] 本地二维码生成失败', err)
      this.setData({ showVoucherQr: false, voucherQrSrc: '' })
    }
  },

  onPreviewQr() {
    const src = this.data.voucherQrSrc
    if (src) wx.previewImage({ urls: [src] })
  }
})
