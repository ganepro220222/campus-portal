// components/nav-bar/index.js — 屋檐顶栏（书院 · 檐棂印 · 满檐）
//
// 只剩两件事要算：状态栏高度（系统给的实测值）和返回不返回。
// 屋檐与标题行的高度写死在 wxss 里走 rpx —— 它们是版面，不该跟着胶囊几何浮动；
// 胶囊落在瓦面上是定好的取舍（版面优先，不挡字、不和按钮重叠）。
const { getNavBarLayout } = require('../../utils/navbar')

Component({
  // action / below 两个插槽要同时存在，必须开多插槽
  options: { multipleSlots: true },

  properties: {
    title: { type: String, value: '' },
    back: { type: Boolean, value: true },
    // tab 页传 false：它们是 flex 列 + 内层 scroll-view，
    // 顶栏 position:fixed 会把内层滚动区顶乱，留在流里才对。
    fixed: { type: Boolean, value: true },
    // 卷首页（动态详情）传 true：顶栏**叠在画上**，底色透明、不占位。
    // 设计稿的二级页就是这么摆的——屋檐压在画上，不是页面顶上另起一条横带。
    // 画的颜色不定（用户可以传任意封面），所以标题和返回键各自垫一方半透明的纸，
    // 而不是指望画一直是浅的。
    overlay: { type: Boolean, value: false }
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
