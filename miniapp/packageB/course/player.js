// packageB/course/player.js — 真视频播放 + 进度上报（详细方案 Phase 3）
const { get, post } = require('../../utils/request')
const { requireLogin } = require('../../utils/auth')
const mock = require('../../mock/defaults')

const REPORT_INTERVAL_SEC = 20

Page({
  data: {
    course: mock.courseDetail,
    videoUrl: '',
    cover: '',
    hasSubtitle: false,
    subtitleUrl: '',
    initialTime: 0,
    cc: true,
    subtitleText: '',
    progressPercent: 0,
    completed: false,
    playing: false
  },

  onLoad(opts) {
    const id = opts && opts.id
    if (!id) return
    this._courseId = id
    this._lastReportSec = 0
    this._vttCues = []

    Promise.all([
      get(`/courses/${id}`),
      get(`/courses/${id}/progress`).catch(() => null)
    ]).then(([course, progress]) => {
      if (!course) return
      const initialTime = progress && progress.lastPositionSeconds ? progress.lastPositionSeconds : 0
      this.setData({
        course,
        videoUrl: course.videoUrl || '',
        cover: course.cover || '',
        hasSubtitle: !!course.hasSubtitle && !!course.subtitleUrl,
        subtitleUrl: course.subtitleUrl || '',
        initialTime,
        progressPercent: progress && progress.progressPercent ? Number(progress.progressPercent) : 0,
        completed: !!(progress && progress.completed)
      })
      if (course.subtitleUrl) {
        this._loadVtt(course.subtitleUrl)
      }
    }).catch(err => {
      console.warn('[course/player] 加载失败', err)
      wx.showToast({ title: '课程加载失败', icon: 'none' })
    })
  },

  onUnload() {
    this._flushProgress(true)
  },

  onHide() {
    this._flushProgress(true)
  },

  onPlay() {
    this.setData({ playing: true })
  },

  onPause() {
    this.setData({ playing: false })
    this._flushProgress(true)
  },

  onTimeUpdate(e) {
    const cur = Math.floor(e.detail.currentTime || 0)
    const total = Math.floor(e.detail.duration || 0)
    this._currentPosition = cur
    this._currentDuration = total
    if (this.data.cc && this._vttCues.length) {
      const cue = this._findCue(cur)
      if (cue !== this.data.subtitleText) {
        this.setData({ subtitleText: cue })
      }
    }
    if (cur - this._lastReportSec >= REPORT_INTERVAL_SEC) {
      this._lastReportSec = cur
      this._reportProgress(cur, total)
    }
  },

  onEnded() {
    const total = this._videoDuration()
    this._reportProgress(total, total)
    this.setData({ playing: false, completed: true, progressPercent: 100 })
    wx.showToast({ title: '课程学习完成', icon: 'none' })
  },

  onVideoError() {
    wx.showToast({ title: '视频播放失败，请稍后重试', icon: 'none' })
  },

  onCC() {
    this.setData({ cc: !this.data.cc })
    wx.showToast({ title: this.data.cc ? 'AI 字幕已开启' : 'AI 字幕已关闭', icon: 'none' })
  },

  _videoDuration() {
    try {
      const ctx = wx.createVideoContext('courseVideo', this)
      return ctx && ctx.duration ? Math.floor(ctx.duration) : 0
    } catch (e) {
      return 0
    }
  },

  _reportProgress(position, total) {
    requireLogin(() => {
      post(`/courses/${this._courseId}/progress`, {
        lastPositionSeconds: position,
        totalDurationSeconds: total
      }).then(res => {
        if (!res) return
        this.setData({
          progressPercent: res.progressPercent ? Number(res.progressPercent) : this.data.progressPercent,
          completed: !!res.completed
        })
      }).catch(() => {})
    })
  },

  _flushProgress(force) {
    if (!force || !this._courseId) return
    const pos = this._currentPosition != null ? this._currentPosition : (this.data.initialTime || 0)
    const total = this._currentDuration || 0
    this._reportProgress(pos, total)
  },

  _loadVtt(url) {
    wx.request({
      url,
      method: 'GET',
      success: (res) => {
        if (typeof res.data === 'string') {
          this._vttCues = this._parseVtt(res.data)
        }
      }
    })
  },

  _parseVtt(text) {
    const lines = text.replace(/\r/g, '').split('\n')
    const cues = []
    let i = 0
    while (i < lines.length) {
      const line = lines[i].trim()
      if (line.includes('-->')) {
        const parts = line.split('-->')
        const start = this._parseVttTime(parts[0])
        const end = this._parseVttTime(parts[1])
        i++
        const buf = []
        while (i < lines.length && lines[i].trim() !== '') {
          buf.push(lines[i].trim())
          i++
        }
        cues.push({ start, end, text: buf.join(' ') })
      }
      i++
    }
    return cues
  },

  _parseVttTime(raw) {
    if (!raw) return 0
    const t = raw.trim().split(':')
    if (t.length === 3) {
      return parseInt(t[0], 10) * 3600 + parseInt(t[1], 10) * 60 + parseFloat(t[2])
    }
    if (t.length === 2) {
      return parseInt(t[0], 10) * 60 + parseFloat(t[1])
    }
    return 0
  },

  _findCue(sec) {
    for (const cue of this._vttCues) {
      if (sec >= cue.start && sec <= cue.end) {
        return cue.text
      }
    }
    return ''
  }
})
