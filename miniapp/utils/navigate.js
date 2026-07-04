// utils/navigate.js — 内容链接跳转（Banner 等）

const TAB_PAGES = [
  '/pages/index/index',
  '/pages/news/index',
  '/pages/hall/index',
  '/pages/course/index'
]

function isTabPage(path) {
  if (!path) return false
  const base = path.split('?')[0]
  return TAB_PAGES.indexOf(base) >= 0
}

/*
 * 打开后台配置的内容链接
 * linkType  page — 小程序内路径；url — 外链（暂复制到剪贴板并提示）
 * linkValue 路径或 URL
 */
function openContentLink(linkType, linkValue) {
  if (!linkType || !linkValue) return

  if (linkType === 'page') {
    const url = linkValue.startsWith('/') ? linkValue : '/' + linkValue
    if (isTabPage(url)) {
      wx.switchTab({ url: url.split('?')[0] })
      return
    }
    wx.navigateTo({
      url,
      fail(err) {
        console.warn('[navigate] 页面跳转失败', url, err)
      }
    })
    return
  }

  if (linkType === 'url') {
    wx.setClipboardData({
      data: linkValue,
      success() {
        wx.showToast({ title: '链接已复制', icon: 'none' })
      }
    })
  }
}

module.exports = { openContentLink, isTabPage }
