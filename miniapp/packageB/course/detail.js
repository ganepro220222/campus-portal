// packageB/course/detail.js —— 课程详情（对齐 demo 课程栏）
const { get } = require('../../utils/request')

const DEFAULT = {
  name: '阳明心学十二讲',
  tags: ['书院动态', 'AI 字幕', '配套资源'],
  audience: '全校学生',
  duration: '12 课时',
  openTime: '2026-06',
  category: '阳明文化',
  intro: '本课程围绕王阳明“心即理”“知行合一”“致良知”三大命题展开，结合龙场悟道的黔中实践，带领学生走进阳明心学的思想世界，涵养家国情怀与笃行精神。',
  resources: [
    { type: 'pdf', name: '阳明心学讲义（第一讲）.pdf', size: 'PDF · 2.4 MB' },
    { type: 'ppt', name: '知行合一·课堂课件.pptx', size: 'PPT · 6.1 MB' },
    { type: 'mp3', name: '致良知·音频导读.mp3', size: 'MP3 · 18 MB' }
  ]
}

Page({
  data: { course: DEFAULT },

  onLoad(opts) {
    const id = opts && opts.id
    if (!id) return
    get(`/courses/${id}`).then(c => {
      if (c) this.setData({ course: { ...DEFAULT, ...c } })
    }).catch(() => {})
  },

  onPlay() { wx.showToast({ title: '开始在线学习', icon: 'none' }) },
  onCC() { wx.showToast({ title: 'AI 字幕已开启', icon: 'none' }) },
  onDownload() { wx.showToast({ title: '开始下载', icon: 'none' }) }
})
