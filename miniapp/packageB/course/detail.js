// packageB/course/detail.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { mergeCourseDetail } = require('../../utils/content')

Page({
  data: { course: mock.courseDetail },

  onLoad(opts) {
    const id = opts && opts.id
    if (!id) return
    get(`/courses/${id}`).then(c => {
      if (c) this.setData({ course: mergeCourseDetail(c) })
    }).catch(err => {
      console.warn('[course/detail] 详情加载失败', err)
    })
  },

  onPlay() {
    const id = this.data.course.id
    if (id) {
      wx.navigateTo({ url: `/packageB/course/player?id=${id}` })
      return
    }
    wx.showToast({ title: '开始在线学习', icon: 'none' })
  },
  onCC() { wx.showToast({ title: 'AI 字幕已开启', icon: 'none' }) },
  onDownload() { wx.showToast({ title: '开始下载', icon: 'none' }) }
})
