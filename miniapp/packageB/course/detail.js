// packageB/course/detail.js
const { get } = require('../../utils/request')
const { mergeCourseDetail } = require('../../utils/content')
const { requireLogin } = require('../../utils/auth')
const { downloadResource } = require('../../utils/resourceDownload')
const { formatDuration } = require('../../utils/format')
const { mapCollectedFromDetail, applyCollectedToggle, toggleFavorite } = require('../../utils/favoriteToggle')
const {
  buildContentDetailLoadedView,
  buildContentDetailInitialFailurePatch,
  buildContentDetailRefreshFailurePatch,
  buildContentDetailLoadingPatch,
  resolveContentDetailOnLoad,
  shouldSilentRefreshContent,
  shouldRefreshContentOnShow,
  canInteractWithContent
} = require('../../utils/contentPageInit')

const CONTENT_KEY = 'course'

Page({
  data: {
    loading: true,
    loadError: false,
    notFound: false,
    refreshError: false,
    contentId: null,
    course: null,
    progressHint: '',
    collected: false,
    collectLabel: '收藏'
  },

  onLoad(opts) {
    const entry = resolveContentDetailOnLoad(opts, { contentKey: CONTENT_KEY })
    this.setData(entry.patch)
    if (!entry.shouldLoad) return
    this._loadDetail(entry.contentId)
  },

  onShow() {
    if (!shouldRefreshContentOnShow(this._hasShownOnce, this.data.loading)) {
      this._hasShownOnce = true
      return
    }
    const id = this.data.contentId
    if (id) this._loadDetail(id, { silent: true })
    this._hasShownOnce = true
  },

  onRetry() {
    const id = this.data.contentId
    if (!id) return
    if (this.data.loadError || this.data.notFound) {
      this._loadDetail(id)
      return
    }
    if (this.data.refreshError) {
      this.setData({ refreshError: false })
      this._loadDetail(id, { silent: true })
    }
  },

  onBackList() {
    wx.switchTab({ url: '/pages/course/index' })
  },

  async _loadDetail(id, options = {}) {
    const { silent = false } = options
    const prev = this.data
    if (!silent) {
      this.setData(buildContentDetailLoadingPatch(CONTENT_KEY))
    }
    try {
      const raw = await get(`/courses/${id}`)
      const view = buildContentDetailLoadedView(
        raw,
        id,
        CONTENT_KEY,
        mergeCourseDetail,
        (row) => mapCollectedFromDetail(row)
      )
      this.setData(view)
      this._loadProgress(id)
    } catch (err) {
      console.warn('[course/detail] 详情加载失败', err)
      if (silent && shouldSilentRefreshContent(prev, CONTENT_KEY)) {
        this.setData(buildContentDetailRefreshFailurePatch(err, prev, CONTENT_KEY))
      } else {
        this.setData(buildContentDetailInitialFailurePatch(err, CONTENT_KEY))
      }
    }
  },

  _loadProgress(id) {
    get(`/courses/${id}/progress`).then(p => {
      if (!p || !p.lastPositionSeconds) return
      const hint = p.completed
        ? '已完成学习'
        : `上次学到 ${formatDuration(p.lastPositionSeconds)}，点击继续`
      this.setData({ progressHint: hint })
    }).catch(() => {})
  },

  onPlay() {
    if (!canInteractWithContent(this.data, CONTENT_KEY, 'contentId')) return
    const id = this.data.contentId
    if (!this.data.course.hasVideo) {
      wx.showToast({ title: '课程视频暂未配置', icon: 'none' })
      return
    }
    requireLogin(() => {
      wx.navigateTo({ url: `/packageB/course/player?id=${id}` })
    })
  },

  onCC() {
    if (!canInteractWithContent(this.data, CONTENT_KEY, 'contentId')) return
    wx.showToast({ title: this.data.course.hasSubtitle ? '播放器内可开关字幕' : '暂无字幕', icon: 'none' })
  },

  onDownload(e) {
    if (!canInteractWithContent(this.data, CONTENT_KEY, 'contentId')) return
    const id = e.currentTarget.dataset.id
    if (!id) {
      wx.showToast({ title: '演示数据无法下载，请连接后端', icon: 'none' })
      return
    }
    downloadResource(id)
  },

  onCollect() {
    if (!canInteractWithContent(this.data, CONTENT_KEY, 'contentId')) return
    const id = this.data.contentId
    requireLogin(() => {
      toggleFavorite('course', id).then(res => {
        const patch = applyCollectedToggle(this.data, res)
        this.setData(patch)
        if (patch.collected) wx.showToast({ title: '收藏成功', icon: 'none' })
      })
    })
  }
})
