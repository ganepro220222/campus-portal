// utils/tabRoutes.js — tabBar 页面路由清单（单一来源）
//
// 为什么要有这么一份：自定义 tabBar 由微信在页面之外单独渲染，
// 它盖在页面内容之上，**页面里的 z-index 管不到它**——
// 书院助手抽屉（z-index 610）照样会被 z-index 500 的 tabbar 挡住底部输入框。
// 所以凡是「要贴着屏幕底部」的浮层，在 tabBar 页面上都得自己让开这段高度，
// 而组件本身不知道自己被放在哪一页，只能靠路由比对。
//
// 三处必须一致：app.json 的 tabBar.list、custom-tab-bar/index.js 的 list、本文件。
// scripts/check-tabbar-routes.js 会把三者比一遍，改漏一处就报错。

/** tabBar 页面路由（不带前导斜杠，与 getCurrentPages() 的 route 一致） */
const TAB_ROUTES = [
  'pages/index/index',
  'pages/news/index',
  'pages/hall/index',
  'pages/course/index'
]

/** 自定义 tabBar 的高度，与 custom-tab-bar/index.wxss 的 .tabbar height 保持一致 */
const TAB_BAR_HEIGHT_RPX = 108

/** 当前页是否是 tabBar 页面。取不到页面栈时按「不是」处理，宁可少让一段也不错位。 */
function isOnTabBarPage() {
  try {
    const pages = getCurrentPages()
    const current = pages && pages[pages.length - 1]
    return !!current && TAB_ROUTES.includes(current.route)
  } catch (e) {
    return false
  }
}

module.exports = { TAB_ROUTES, TAB_BAR_HEIGHT_RPX, isOnTabBarPage }
