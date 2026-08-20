// packageA/news/detail.js
const { get, post } = require('../../utils/request')
const { mergeNewsArticle } = require('../../utils/content')
const { requireLogin } = require('../../utils/auth')
const {
  buildNewsDetailPath,
  buildNewsShareAppMessage,
  buildNewsShareTimeline
} = require('../../utils/newsShare')
const {
  mapDetailInteraction,
  applyLikeToggle,
  applyFavoriteToggle
} = require('../../utils/newsInteraction')

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
    articleId: null
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
      if (!id) return
      post(`/news/${id}/like`).then(res => {
        const patch = applyLikeToggle(this.data, res)
        this.setData(patch)
        if (patch.liked) wx.showToast({ title: '点赞成功', icon: 'none' })
      }).catch(() => {
        const patch = applyLikeToggle(this.data, { liked: !this.data.liked })
        this.setData(patch)
        if (patch.liked) wx.showToast({ title: '点赞成功', icon: 'none' })
      })
    })
  },

  onCollect() {
    requireLogin(() => {
      const id = this.data.articleId
      if (!id) return
      post(`/news/${id}/favorite`).then(res => {
        const patch = applyFavoriteToggle(this.data, res)
        this.setData(patch)
        if (patch.collected) wx.showToast({ title: '收藏成功', icon: 'none' })
      }).catch(() => {
        const patch = applyFavoriteToggle(this.data, { collected: !this.data.collected })
        this.setData(patch)
        if (patch.collected) wx.showToast({ title: '收藏成功', icon: 'none' })
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
