// packageC/activity/detail.js — 活动详情逻辑（占位页 UI 不变，仅预加载数据）
const { get } = require('../../utils/request')
const { mergeActivityDetail } = require('../../utils/activity')
const mock = require('../../mock/defaults')

Page({
  data: { activityId: null, detail: null },

  onLoad(opts) {
    const id = opts.id
    this.setData({ activityId: id })
    if (id) this._loadDetail(id)
  },

  async _loadDetail(id) {
    try {
      const raw = await get(`/activities/${id}`).catch(() => null)
      const detail = mergeActivityDetail(raw, mock.activityDetail)
      this.setData({ detail })
    } catch (err) {
      console.warn('[activity/detail] 加载失败', err)
      this.setData({ detail: mock.activityDetail })
    }
  }
})
