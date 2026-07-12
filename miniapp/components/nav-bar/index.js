// components/nav-bar/index.js — 通用自定义导航栏（高度随胶囊几何自适应，跨机型一致）
const { getNavBarLayout } = require('../../utils/navbar')

Component({
  properties: {
    title: { type: String, value: '' },
    bg: { type: String, value: '#2B356E' },
    color: { type: String, value: '#ffffff' },
    back: { type: Boolean, value: true }
  },

  data: {
    statusBarHeight: 20,
    navContentHeight: 44
  },

  lifetimes: {
    attached() {
      const { statusBarHeight, navContentHeight } = getNavBarLayout()
      this.setData({ statusBarHeight, navContentHeight })
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
