// packageA/news/detail.js
const { get, post } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { mergeNewsArticle } = require('../../utils/content')
const { requireLogin } = require('../../utils/auth')

Page({
  data: {
    article: mock.newsDetail.article,
    reco: mock.newsDetail.reco,
    liked: false,
    collected: false,
    articleId: null
  },

  onLoad(opts) {
    const id = opts && opts.id
    if (!id) return
    this.setData({ articleId: id })
    this._loadDetail(id)
    this._loadRelated(id)
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

  onShare() { wx.showToast({ title: '已生成分享卡片', icon: 'none' }) },

  onReco(e) {
    wx.navigateTo({ url: `/packageA/news/detail?id=${e.currentTarget.dataset.id}` })
  }
})
