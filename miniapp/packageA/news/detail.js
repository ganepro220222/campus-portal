// packageA/news/detail.js
const { get, post } = require('../../utils/request')
const { mergeNewsArticle } = require('../../utils/content')
const { requireLogin } = require('../../utils/auth')
const { buildNewsShareAppMessage, buildNewsShareTimeline } = require('../../utils/newsShare')

Page({
  data: {
    article: mergeNewsArticle(null),
    reco: [],
    liked: false,
    collected: false,
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
      if (a) this.setData({ article: mergeNewsArticle(a) })
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
        const liked = res && res.liked != null ? res.liked : !this.data.liked
        this.setData({ liked })
        if (liked) wx.showToast({ title: '点赞成功', icon: 'none' })
      }).catch(() => {
        const liked = !this.data.liked
        this.setData({ liked })
        if (liked) wx.showToast({ title: '点赞成功', icon: 'none' })
      })
    })
  },

  onCollect() {
    requireLogin(() => {
      const id = this.data.articleId
      if (!id) return
      post(`/news/${id}/favorite`).then(res => {
        const collected = res && res.collected != null ? res.collected : !this.data.collected
        this.setData({ collected })
        if (collected) wx.showToast({ title: '收藏成功', icon: 'none' })
      }).catch(() => {
        const collected = !this.data.collected
        this.setData({ collected })
        if (collected) wx.showToast({ title: '收藏成功', icon: 'none' })
      })
    })
  },

  onRecoTap(e) {
    wx.navigateTo({ url: `./detail?id=${e.currentTarget.dataset.id}` })
  }
})
