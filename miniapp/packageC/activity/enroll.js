// packageC/activity/enroll.js — 活动报名逻辑（占位页 UI 不变）
const { get, post } = require('../../utils/request')
const { mergeActivityDetail, mergeEnrollResult } = require('../../utils/activity')
const mock = require('../../mock/defaults')

Page({
  data: { activityId: null, detail: null, enrollResult: null },

  onLoad(opts) {
    const id = opts.id || opts.activityId
    this.setData({ activityId: id })
    if (id) this._loadDetail(id)
  },

  async _loadDetail(id) {
    try {
      const raw = await get(`/activities/${id}`).catch(() => null)
      this.setData({ detail: mergeActivityDetail(raw, mock.activityDetail) })
    } catch (err) {
      console.warn('[activity/enroll] 详情加载失败', err)
    }
  },

  /** 供后续 UI 接入时调用 */
  async submitEnroll(form) {
    const id = this.data.activityId
    if (!id) return null
    try {
      const raw = await post(`/activities/${id}/enroll`, form || {})
      const result = mergeEnrollResult(raw)
      this.setData({ enrollResult: result })
      return result
    } catch (err) {
      console.warn('[activity/enroll] 提交失败', err)
      throw err
    }
  }
})
