// packageC/activity/detail.js — 活动详情
const { get, del } = require('../../utils/request')
const { requireLogin } = require('../../utils/auth')
const { decorateActivities } = require('../../utils/decorate')
const {
  buildDetailLoadedView,
  buildDetailInitialFailurePatch,
  buildDetailRefreshFailurePatch,
  buildDetailLoadingPatch,
  resolveDetailOnLoad,
  shouldRefreshDetailOnShow
} = require('../../utils/detailPageInit')
const { shouldSilentRefreshDetail } = require('../../utils/activityDetailLoad')

Page({
  data: {
    loading: true,
    loadError: false,
    notFound: false,
    refreshError: false,
    activityId: null,
    detail: null,
    coverClass: 'hc1',
    isLoggedIn: false,
    actionType: 'loading',
    actionHint: '',
    statusLabel: ''
  },

  onLoad(opts) {
    const entry = resolveDetailOnLoad(opts)
    this.setData(entry.patch)
    if (entry.shouldLoad) {
      this._loadDetail(entry.activityId)
    }
  },

  onShow() {
    const loggedIn = getApp().isLoggedIn()
    this.setData({ isLoggedIn: loggedIn })
    if (shouldRefreshDetailOnShow(this._hasShownOnce, this.data.loading)) {
      this._loadDetail(this.data.activityId, { silent: true })
    }
    this._hasShownOnce = true
  },

  async _loadDetail(id, options = {}) {
    const { showLoading = true, silent = false } = options
    const prev = this.data
    if (showLoading) {
      this.setData(buildDetailLoadingPatch())
    }
    try {
      const raw = await get(`/activities/${id}`)
      const view = buildDetailLoadedView(raw, id, getApp().isLoggedIn(), (merged) => {
        return decorateActivities([merged])[0]
      })
      this.setData(view)
    } catch (err) {
      console.warn('[activity/detail] 加载失败', err)
      if (silent && shouldSilentRefreshDetail(prev)) {
        this.setData(buildDetailRefreshFailurePatch(err, prev))
      } else {
        this.setData(buildDetailInitialFailurePatch(err))
      }
    }
  },

  onRetry() {
    const id = this.data.activityId
    if (!id) return
    if (this.data.loadError || this.data.notFound) {
      this._loadDetail(id)
      return
    }
    if (this.data.refreshError) {
      this.setData({ refreshError: false })
      this._loadDetail(id, { showLoading: false, silent: true })
    }
  },

  onBackList() {
    wx.redirectTo({ url: '/pages/activity/index' })
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
          this._loadDetail(activityId, { showLoading: false, silent: true })
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
