// packageB/course/player.js — 真视频播放 + 进度上报
const { get, post } = require('../../utils/request')
const { requireLogin } = require('../../utils/auth')
const { mergeCourseDetail } = require('../../utils/content')
const {
  resolveEndedReport,
  shouldReportByInterval,
  isSeekBackward,
  resolveVideoResumePosition,
  resolveResumeInitialTime,
  coerceVttText,
  withVideoReloadNonce,
  looksLikeVtt,
  isVideoPlaybackStable
} = require('../../utils/coursePlayerProgress')

const REPORT_INTERVAL_SEC = 20

Page({
  data: {
    course: mergeCourseDetail(null),
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
    this._videoRetryCount = 0
    this._subtitleRetryCount = 0
    this._videoReloading = false
    this._subtitleReloading = false
    this._videoRecoveryStartPosition = null
    this._videoUrlReloadTotal = 0
    this._progressBaselineSent = false

    requireLogin(() => {
      Promise.all([
        get(`/courses/${id}`),
        get(`/courses/${id}/play`),
        get(`/courses/${id}/progress`).catch(() => null)
      ]).then(([course, play, progress]) => {
        if (!course) return
        const initialTime = resolveResumeInitialTime({
          lastPositionSeconds: progress && progress.lastPositionSeconds,
          completed: !!(progress && progress.completed),
          totalDurationSeconds: progress && progress.totalDurationSeconds
        })
        const media = play || {}
        this.setData({
          course,
          videoUrl: media.videoUrl || '',
          cover: course.cover || '',
          hasSubtitle: !!media.hasSubtitle && !!media.subtitleUrl,
          subtitleUrl: media.subtitleUrl || '',
          initialTime,
          progressPercent: progress && progress.progressPercent ? Number(progress.progressPercent) : 0,
          completed: !!(progress && progress.completed)
        })
        if (media.hasSubtitle || media.subtitleUrl) {
          this._loadVtt()
        }
      }).catch(err => {
        console.warn('[course/player] 加载失败', err)
        wx.showToast({ title: '课程加载失败', icon: 'none' })
      })
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

  onSeekComplete(e) {
    const cur = Math.floor(e.detail.currentTime || this._currentPosition || 0)
    const total = Math.floor(this._currentDuration || 0)
    this._currentPosition = cur
    if (!this._courseId || total <= 0) {
      this._lastReportSec = cur
      return
    }
    if (isSeekBackward(cur, this._lastReportSec)) {
      this._lastReportSec = cur
      this._reportProgress(cur, total).catch(() => {})
      return
    }
    this._lastReportSec = cur
  },

  onVideoLoadedMetadata() {
    this._applyPendingVideoResume()
  },

  onTimeUpdate(e) {
    const cur = Math.floor(e.detail.currentTime || 0)
    const total = Math.floor(e.detail.duration || 0)
    this._currentPosition = cur
    this._currentDuration = total
    if (!this._progressBaselineSent && total > 0 && this._courseId) {
      this._progressBaselineSent = true
      const baseline = this.data.initialTime || 0
      this._lastReportSec = baseline
      this._reportProgress(baseline, total).catch(() => {})
    }
    if (this._videoRetryCount > 0) {
      if (this._videoRecoveryStartPosition == null && cur > 0) {
        this._videoRecoveryStartPosition = cur
      }
      if (isVideoPlaybackStable({
        recoveryStartPosition: this._videoRecoveryStartPosition,
        currentSec: cur
      })) {
        this._videoRetryCount = 0
        this._videoRecoveryStartPosition = null
      }
    }
    if (this.data.cc && this._vttCues.length) {
      const cue = this._findCue(cur)
      if (cue !== this.data.subtitleText) {
        this.setData({ subtitleText: cue })
      }
    }
    if (shouldReportByInterval(cur, this._lastReportSec, REPORT_INTERVAL_SEC)) {
      this._lastReportSec = cur
      this._reportProgress(cur, total).catch(() => {})
    }
  },

  async onEnded(e) {
    const alreadyCompleted = this.data.completed
    const { position, total } = resolveEndedReport({
      detailDuration: e && e.detail && e.detail.duration,
      cachedDuration: this._currentDuration,
      cachedPosition: this._currentPosition
    })
    this.setData({ playing: false, initialTime: 0 })
    if (alreadyCompleted) {
      const ctx = wx.createVideoContext('courseVideo', this)
      ctx.seek(0)
      this._currentPosition = 0
      this._lastReportSec = 0
      return
    }
    if (total <= 0) {
      wx.showToast({ title: '进度保存失败，请稍后重试', icon: 'none' })
      return
    }
    try {
      const res = await this._reportProgress(position, total)
      if (!res) {
        wx.showToast({ title: '进度保存失败，请稍后重试', icon: 'none' })
        return
      }
      this.setData({
        progressPercent: res.progressPercent ? Number(res.progressPercent) : this.data.progressPercent,
        completed: !!res.completed
      })
      if (res.completed && !alreadyCompleted) {
        wx.showToast({ title: '课程学习完成', icon: 'none' })
      }
    } catch (err) {
      console.warn('[course/player] 结束上报失败', err)
      wx.showToast({ title: '进度保存失败，请稍后重试', icon: 'none' })
    }
  },

  onVideoError() {
    if (this._videoReloading) return
    if (this._videoUrlReloadTotal >= 3) {
      wx.showToast({ title: '视频播放失败，请稍后重试', icon: 'none' })
      return
    }
    if (this._videoRetryCount >= 2) {
      wx.showToast({ title: '视频播放失败，请稍后重试', icon: 'none' })
      return
    }
    this._videoRetryCount += 1
    this._videoRecoveryStartPosition = null
    this._videoReloading = true
    this._reloadVideoUrl(true).finally(() => {
      this._videoReloading = false
    })
  },

  async _reloadVideoUrl(silent) {
    try {
      const play = await get(`/courses/${this._courseId}/play`)
      if (!play || !play.videoUrl) {
        throw new Error('no-video')
      }
      const resumePosition = resolveVideoResumePosition({
        currentPosition: this._currentPosition,
        initialTime: this.data.initialTime
      })
      const wasPlaying = this.data.playing
      this._videoUrlReloadTotal += 1
      this._pendingVideoResume = { position: resumePosition, playing: wasPlaying }
      this._videoRecoveryStartPosition = resumePosition > 0 ? resumePosition : null
      const nextUrl = play.videoUrl === this.data.videoUrl
        ? withVideoReloadNonce(play.videoUrl)
        : play.videoUrl
      this.setData({ videoUrl: nextUrl })
      if (!silent) {
        wx.showToast({ title: '已刷新视频地址', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '视频播放失败，请稍后重试', icon: 'none' })
    }
  },

  _applyPendingVideoResume() {
    const pending = this._pendingVideoResume
    if (!pending) return
    this._pendingVideoResume = null
    const ctx = wx.createVideoContext('courseVideo', this)
    const pos = Math.floor(pending.position || 0)
    if (pos > 0) {
      ctx.seek(pos)
      this._currentPosition = pos
      this._lastReportSec = pos
      this._videoRecoveryStartPosition = pos
    }
    if (pending.playing) {
      ctx.play()
    }
  },

  async _reloadSubtitleUrl(silent) {
    this._loadVtt()
    if (!silent) {
      wx.showToast({ title: '已刷新字幕', icon: 'none' })
    }
  },

  onCC() {
    this.setData({ cc: !this.data.cc })
    wx.showToast({ title: this.data.cc ? 'AI 字幕已开启' : 'AI 字幕已关闭', icon: 'none' })
  },

  _reportProgress(position, total) {
    return new Promise((resolve, reject) => {
      requireLogin(() => {
        post(`/courses/${this._courseId}/progress`, {
          lastPositionSeconds: position,
          totalDurationSeconds: total
        }).then(res => {
          if (res) {
            this.setData({
              progressPercent: res.progressPercent ? Number(res.progressPercent) : this.data.progressPercent,
              completed: !!res.completed
            })
          }
          resolve(res)
        }).catch(reject)
      })
    })
  },

  _flushProgress(force) {
    if (!force || !this._courseId) return
    const total = this._currentDuration || 0
    if (total <= 0) return
    const pos = this._currentPosition != null ? this._currentPosition : (this.data.initialTime || 0)
    this._reportProgress(pos, total).catch(() => {})
  },

  _handleSubtitleFailure() {
    if (this._subtitleReloading) return
    if (this._subtitleRetryCount < 2) {
      this._subtitleRetryCount += 1
      this._subtitleReloading = true
      this._reloadSubtitleUrl(true).finally(() => {
        this._subtitleReloading = false
      })
      return
    }
    this.setData({ hasSubtitle: false, subtitleUrl: '' })
    wx.showToast({ title: '字幕暂不可用', icon: 'none' })
  },

  _loadVtt() {
    // 走 API（request 合法域名），不直拉 CDN，避免开发者工具/真机 downloadFile 读 VTT 失败。
    get(`/courses/${this._courseId}/subtitle`, {}, { silent: true }).then((data) => {
      const text = coerceVttText(typeof data === 'string' ? data : (data && data.vtt))
      if (!looksLikeVtt(text)) {
        this._handleSubtitleFailure()
        return
      }
      this._vttCues = this._parseVtt(text)
      this._subtitleRetryCount = 0
      this.setData({ hasSubtitle: true })
    }).catch(() => this._handleSubtitleFailure())
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
