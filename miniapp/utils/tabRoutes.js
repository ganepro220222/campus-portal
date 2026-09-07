// utils/tabRoutes.js — tabBar 页面路由
// 自定义 tabBar 不在页面层，底部浮层要按路由让开高度。
// 与 app.json tabBar.list、custom-tab-bar/index.js 保持同一份路由。

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
