// packageC/activity/detail.js — 活动详情
const { get, del } = require('../../utils/request')
const {
  mergeActivityDetail,
  resolveDetailAction,
  enrollStatusLabel
} = require('../../utils/activity')
const { requireLogin } = require('../../utils/auth')
const { decorateActivities } = require('../../utils/decorate')

Page({
  data: {
    loading: true,
    activityId: null,
    detail: null,
    coverClass: 'hc1',
    isLoggedIn: false,
    actionType: 'loading',
    actionHint: '',
    statusLabel: ''
  },

  onLoad(opts) {
    const id = opts.id
    this.setData({ activityId: id })
    if (id) this._loadDetail(id)
  },

  onShow() {
    const loggedIn = getApp().isLoggedIn()
    this.setData({ isLoggedIn: loggedIn })
    if (this.data.activityId && !this.data.loading) {
      this._loadDetail(this.data.activityId, false)
    }
  },

  async _loadDetail(id, showLoading = true) {
    if (showLoading) this.setData({ loading: true })
    try {
      const raw = await get(`/activities/${id}`).catch(() => null)
      const detail = mergeActivityDetail(raw)
      const decorated = decorateActivities([detail])[0]
      const action = resolveDetailAction(detail, getApp().isLoggedIn())
      this.setData({
        detail: { ...detail, coverImageMode: decorated.coverImageMode },
        coverClass: decorated.colorClass || 'hc1',
        loading: false,
        actionType: action.actionType,
        actionHint: action.hint,
        statusLabel: enrollStatusLabel(detail.enrollStatus)
      })
    } catch (err) {
      console.warn('[activity/detail] 加载失败', err)
      this.setData({ detail: null, loading: false })
    }
  },

  onLoginTap() {
    wx.navigateTo({ url: '/pages/login/index' })
  },

  onEnrollTap() {
    requireLogin(() => {
      wx.navigateTo({ url: `/packageC/activity/enroll?id=${this.data.activityId}` })
    })
  },

  async onCancelTap() {
    const { activityId, detail } = this.data
    if (!activityId || !detail) return
    wx.showModal({
      title: '取消报名',
      content: '确定取消本次活动报名？名额将释放给其他同学。',
      success: async (res) => {
        if (!res.confirm) return
        try {
          await del(`/activities/${activityId}/enroll`)
          wx.showToast({ title: '已取消报名', icon: 'success' })
          this._loadDetail(activityId, false)
        } catch (e) {
          // 错误 toast 由 request.js 处理
        }
      }
    })
  },

  async onVoucherTap() {
    const { activityId } = this.data
    if (!activityId) return
    wx.navigateTo({ url: `/packageC/activity/enroll?id=${activityId}` })
  }
})
