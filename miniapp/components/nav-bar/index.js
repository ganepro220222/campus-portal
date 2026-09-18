// components/nav-bar/index.js — 屋檐顶栏（书院 · 檐棂印 · 满檐）
//
// 只剩两件事要算：状态栏高度（系统给的实测值）和返回不返回。
// 屋檐与标题行的高度写死在 wxss 里走 rpx —— 它们是版面，不该跟着胶囊几何浮动；
// 胶囊落在瓦面上是定好的取舍（版面优先，不挡字、不和按钮重叠）。
const { getNavBarLayout } = require('../../utils/navbar')

Component({
  properties: {
    title: { type: String, value: '' },
    back: { type: Boolean, value: true }
  },

  data: {
    statusBarHeight: 20
  },

  lifetimes: {
    attached() {
      const { statusBarHeight } = getNavBarLayout()
      this.setData({ statusBarHeight })
    }
  },

  methods: {
    onBack() {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack()
      } else {
        wx.switchTab({ url: '/pages/index/index' }).catch(() => {
          wx.reLaunch({ url: '/pages/index/index' })
        })
      }
    }
  }
})
