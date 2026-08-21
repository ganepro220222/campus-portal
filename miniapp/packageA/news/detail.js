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

Page({
  data: {
    article: mergeNewsArticle(null),
    reco: [],
    liked: false,
    collected: false,
    likeCount: 0,
    favoriteCount: 0,
    likeLabel: '点赞',
    collectLabel: '收藏',
    articleId: null,
    interactionBusy: false
  },

  onLoad(opts) {
    const id = opts && opts.id
    if (!id) return
    this.setData({ articleId: id })
    wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
    this._loadDetail(id)
    this._loadRelated(id)
  },

  onShareAppMessage() {
    return buildNewsShareAppMessage(this.data.article, this.data.articleId)
  },

  onShareTimeline() {
    return buildNewsShareTimeline(this.data.article, this.data.articleId)
  },

  _loadDetail(id) {
    get(`/news/${id}`).then(a => {
      if (!a) return
      this.setData({
        article: mergeNewsArticle(a),
        ...mapDetailInteraction(a)
      })
    }).catch(err => {
      console.warn('[news/detail] 详情加载失败', err)
    })
  },

  _loadRelated(id) {
    get(`/news/${id}/related`).then(list => {
      if (list && list.length) this.setData({ reco: list })
    }).catch(() => {})
  },

  onLike() {
    requireLogin(() => {
      const id = this.data.articleId
      if (!id || this.data.interactionBusy) return
      this.setData({ interactionBusy: true })
      post(`/news/${id}/like`).then(res => {
        const patch = mergeLikeSuccess(this.data, res)
        this.setData({ ...patch, interactionBusy: false })
        const toast = likeSuccessToast(patch)
        if (toast) wx.showToast({ title: toast, icon: 'none' })
      }).catch(() => {
        this.setData({ interactionBusy: false })
      })
    })
  },

  onCollect() {
    requireLogin(() => {
      const id = this.data.articleId
      if (!id || this.data.interactionBusy) return
      this.setData({ interactionBusy: true })
      post(`/news/${id}/favorite`).then(res => {
        const patch = mergeFavoriteSuccess(this.data, res)
        this.setData({ ...patch, interactionBusy: false })
        const toast = favoriteSuccessToast(patch)
        if (toast) wx.showToast({ title: toast, icon: 'none' })
      }).catch(() => {
        this.setData({ interactionBusy: false })
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
