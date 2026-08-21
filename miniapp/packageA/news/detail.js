// packageA/news/detail.js
const { get, post } = require('../../utils/request')
const { mergeNewsArticle } = require('../../utils/content')
const { requireLogin } = require('../../utils/auth')
const {
  buildNewsDetailPath,
  buildNewsShareAppMessage,
  buildNewsShareTimeline
} = require('../../utils/newsShare')
const { mapDetailInteraction } = require('../../utils/newsInteraction')
const {
  mergeLikeSuccess,
  mergeFavoriteSuccess,
  likeSuccessToast,
  favoriteSuccessToast
} = require('../../utils/newsDetailActions')
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

const CONTENT_KEY = 'article'

Page({
  data: {
    loading: true,
    loadError: false,
    notFound: false,
    refreshError: false,
    contentId: null,
    article: null,
    reco: [],
    liked: false,
    collected: false,
    likeCount: 0,
    favoriteCount: 0,
    likeLabel: '点赞',
    collectLabel: '收藏',
    articleId: null,
    likeBusy: false,
    favoriteBusy: false
  },

  onLoad(opts) {
    const entry = resolveContentDetailOnLoad(opts, { contentKey: CONTENT_KEY })
    this.setData({
      ...entry.patch,
      articleId: entry.contentId
    })
    if (!entry.shouldLoad) return
    wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
    this._loadDetail(entry.contentId)
    this._loadRelated(entry.contentId)
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

  onShareAppMessage() {
    return buildNewsShareAppMessage(this.data.article, this.data.articleId)
  },

  onShareTimeline() {
    return buildNewsShareTimeline(this.data.article, this.data.articleId)
  },

  onRetry() {
    const id = this.data.contentId
    if (!id) return
    if (this.data.loadError || this.data.notFound) {
      this._loadDetail(id)
      this._loadRelated(id)
      return
    }
    if (this.data.refreshError) {
      this.setData({ refreshError: false })
      this._loadDetail(id, { silent: true })
    }
  },

  onBackList() {
    wx.switchTab({ url: '/pages/news/index' })
  },

  async _loadDetail(id, options = {}) {
    const { silent = false } = options
    const prev = this.data
    if (!silent) {
      this.setData(buildContentDetailLoadingPatch(CONTENT_KEY))
    }
    try {
      const raw = await get(`/news/${id}`)
      const view = buildContentDetailLoadedView(
        raw,
        id,
        CONTENT_KEY,
        mergeNewsArticle,
        (row) => mapDetailInteraction(row)
      )
      this.setData({
        ...view,
        articleId: id
      })
    } catch (err) {
      console.warn('[news/detail] 详情加载失败', err)
      if (silent && shouldSilentRefreshContent(prev, CONTENT_KEY)) {
        this.setData(buildContentDetailRefreshFailurePatch(err, prev, CONTENT_KEY))
      } else {
        this.setData(buildContentDetailInitialFailurePatch(err, CONTENT_KEY))
      }
    }
  },

  _loadRelated(id) {
    get(`/news/${id}/related`).then(list => {
      if (list && list.length) this.setData({ reco: list })
    }).catch(() => {})
  },

  onLike() {
    if (!canInteractWithContent(this.data, CONTENT_KEY, 'contentId')) return
    requireLogin(() => {
      const id = this.data.contentId
      if (!id || this.data.likeBusy) return
      this.setData({ likeBusy: true })
      post(`/news/${id}/like`).then(res => {
        const patch = mergeLikeSuccess(this.data, res)
        this.setData({ ...patch, likeBusy: false })
        const toast = likeSuccessToast(patch)
        if (toast) wx.showToast({ title: toast, icon: 'none' })
      }).catch(() => {
        this.setData({ likeBusy: false })
      })
    })
  },

  onCollect() {
    if (!canInteractWithContent(this.data, CONTENT_KEY, 'contentId')) return
    requireLogin(() => {
      const id = this.data.contentId
      if (!id || this.data.favoriteBusy) return
      this.setData({ favoriteBusy: true })
      post(`/news/${id}/favorite`).then(res => {
        const patch = mergeFavoriteSuccess(this.data, res)
        this.setData({ ...patch, favoriteBusy: false })
        const toast = favoriteSuccessToast(patch)
        if (toast) wx.showToast({ title: toast, icon: 'none' })
      }).catch(() => {
        this.setData({ favoriteBusy: false })
      })
    })
  },

  onRecoTap(e) {
    const id = e.currentTarget.dataset.id
    const url = buildNewsDetailPath(id)
    if (!url) return
    wx.navigateTo({ url })
  }
})
