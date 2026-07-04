// packageC/college/list.js — 学院矩阵
const mock = require('../../mock/defaults')

Page({
  data: { colleges: mock.colleges },

  onCardTap(e) {
    const name = e.currentTarget.dataset.name || ''
    wx.showToast({ title: name + ' · 主页建设中', icon: 'none' })
  }
})
