// packageB/course/detail.js
const { get } = require('../../utils/request')
const { mergeCourseDetail } = require('../../utils/content')
const { requireLogin } = require('../../utils/auth')
const { downloadResource } = require('../../utils/resourceDownload')
const { formatDuration } = require('../../utils/format')

Page({
  data: { course: mergeCourseDetail(null), progressHint: '' },

  onLoad(opts) {
    const id = opts && opts.id
    if (!id) return
    this._courseId = id
    get(`/courses/${id}`).then(c => {
      if (c) this.setData({ course: mergeCourseDetail(c) })
    }).catch(err => {
      console.warn('[course/detail] 详情加载失败', err)
    })
    get(`/courses/${id}/progress`).then(p => {
      if (!p || !p.lastPositionSeconds) return
      const hint = p.completed
        ? '已完成学习'
        : `上次学到 ${formatDuration(p.lastPositionSeconds)}，点击继续`
      this.setData({ progressHint: hint })
    }).catch(() => {})
  },

  onPlay() {
    const id = this._courseId || this.data.course.id
    if (!id) {
      wx.showToast({ title: '课程信息加载中', icon: 'none' })
      return
    }
    if (!this.data.course.videoUrl) {
      wx.showToast({ title: '课程视频暂未配置', icon: 'none' })
      return
    }
    requireLogin(() => {
      wx.navigateTo({ url: `/packageB/course/player?id=${id}` })
    })
  },

  onCC() {
    wx.showToast({ title: this.data.course.hasSubtitle ? '播放器内可开关字幕' : '暂无字幕', icon: 'none' })
  },

  onDownload(e) {
    const id = e.currentTarget.dataset.id
    if (!id) {
      wx.showToast({ title: '演示数据无法下载，请连接后端', icon: 'none' })
      return
    }
    downloadResource(id)
  }
})
