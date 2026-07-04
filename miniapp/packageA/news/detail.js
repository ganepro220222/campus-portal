// packageA/news/detail.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')

Page({
  data: {
    article: mock.newsDetail.article,
    reco: mock.newsDetail.reco,
    liked: false,
    collected: false
  },

  onLoad(opts) {
    const id = opts && opts.id
    if (!id) return
    get(`/news/${id}`).then(a => {
      if (a) this.setData({ article: { ...mock.newsDetail.article, ...a } })
    }).catch(err => {
      console.warn('[news/detail] 详情加载失败', err)
    })
  },

  onLike() {
    const liked = !this.data.liked
    this.setData({ liked })
    if (liked) wx.showToast({ title: '点赞成功', icon: 'none' })
  },
  onCollect() {
    const collected = !this.data.collected
    this.setData({ collected })
    if (collected) wx.showToast({ title: '收藏成功', icon: 'none' })
  },
  onShare() { wx.showToast({ title: '已生成分享卡片', icon: 'none' }) },
  onReco(e) {
    wx.navigateTo({ url: `/packageA/news/detail?id=${e.currentTarget.dataset.id}` })
  }
})
