// packageB/course/player.js — 课程学习/播放器
const { get } = require('../../utils/request')
const { formatDuration } = require('../../utils/format')
const mock = require('../../mock/defaults')

const LESSONS = [
  { id: 1, title: '第一讲 · 龙场悟道', seconds: 750, state: 'done' },
  { id: 2, title: '第二讲 · 心即理', seconds: 904, state: 'done' },
  { id: 3, title: '第三讲 · 知行合一', seconds: 812, state: 'playing' },
  { id: 4, title: '第四讲 · 致良知', seconds: 968, state: 'idle' },
  { id: 5, title: '第五讲 · 事上磨练', seconds: 726, state: 'idle' },
  { id: 6, title: '第六讲 · 阳明心学的当代价值', seconds: 880, state: 'idle' }
]

const SUBTITLES = [
  '王阳明先生谪居贵州龙场，于万山丛棘、瘴疠之地静心体悟。',
  '一夕大悟格物致知之旨，方知“圣人之道，吾性自足”。',
  '知是行之始，行是知之成——此即“知行合一”之真义。',
  '致良知，便是把心中本有的善端，落实到日用伦常之间。',
  '心外无理，心外无物，格物即是正心，修身即是致良知。'
]

Page({
  data: {
    course: mock.courseDetail,
    lessons: LESSONS,
    current: 2,
    playing: false,
    cc: true,
    progress: 0,
    curTimeText: '00:00',
    totalTimeText: formatDuration(LESSONS[2].seconds),
    subtitle: SUBTITLES[0]
  },

  onLoad(opts) {
    const id = opts && opts.id
    if (!id) return
    get(`/courses/${id}`).then(c => {
      if (c && c.name) this.setData({ 'course.name': c.name })
    }).catch(() => {})
  },

  onUnload() { this._stop() },
  onHide() { this._stop(); this.setData({ playing: false }) },

  togglePlay() {
    if (this.data.playing) { this._stop(); this.setData({ playing: false }); return }
    this.setData({ playing: true })
    this._elapsed = Math.round(this.data.progress / 100 * this._total())
    this._timer = setInterval(() => this._tick(), 1000)
  },

  _total() { return this.data.lessons[this.data.current].seconds },

  _tick() {
    const total = this._total()
    this._elapsed = (this._elapsed || 0) + 1
    if (this._elapsed >= total) {
      this._elapsed = total
      this._stop()
      this.setData({ playing: false, progress: 100, curTimeText: this.data.totalTimeText })
      this._markDone()
      wx.showToast({ title: '本讲已学完', icon: 'none' })
      return
    }
    const pct = Math.round(this._elapsed / total * 100)
    const subIdx = Math.floor(this._elapsed / total * SUBTITLES.length) % SUBTITLES.length
    this.setData({
      progress: pct,
      curTimeText: formatDuration(this._elapsed),
      subtitle: SUBTITLES[subIdx]
    })
  },

  _stop() { if (this._timer) { clearInterval(this._timer); this._timer = null } },

  _markDone() {
    const lessons = this.data.lessons.slice()
    lessons[this.data.current] = { ...lessons[this.data.current], state: 'done' }
    this.setData({ lessons })
  },

  onCC() {
    this.setData({ cc: !this.data.cc })
    wx.showToast({ title: this.data.cc ? 'AI 字幕已开启' : 'AI 字幕已关闭', icon: 'none' })
  },

  selectLesson(e) {
    const i = e.currentTarget.dataset.i
    if (i === this.data.current) return
    this._stop()
    this._elapsed = 0
    this.setData({
      current: i,
      playing: false,
      progress: 0,
      curTimeText: '00:00',
      totalTimeText: formatDuration(this.data.lessons[i].seconds),
      subtitle: SUBTITLES[0]
    })
  }
})
