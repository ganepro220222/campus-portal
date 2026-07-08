// utils/navbar.js — 自定义导航栏与微信胶囊按钮对齐

/**
 * 计算自定义顶栏布局参数（适配右上角 ··· ○ 胶囊区域）
 * @returns {{ statusBarHeight: number, navContentHeight: number, capsulePadding: number }}
 */
function getNavBarLayout() {
  const sys = wx.getSystemInfoSync()
  const menu = wx.getMenuButtonBoundingClientRect()
  const statusBarHeight = sys.statusBarHeight || 20
  const navContentHeight = (menu.top - statusBarHeight) * 2 + menu.height
  // 屏幕右缘到胶囊左缘的距离 + 8px 间距
  const capsulePadding = sys.windowWidth - menu.left + 8
  return { statusBarHeight, navContentHeight, capsulePadding }
}

module.exports = { getNavBarLayout }
