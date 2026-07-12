// utils/navigate.js — 内容链接跳转（Banner 等）

const TAB_PAGES = [
  '/pages/index/index',
  '/pages/news/index',
  '/pages/hall/index',
  '/pages/course/index'
]

const FIXED_PAGE_PATHS = {
  home: '/pages/index/index',
  news: '/pages/news/index',
  hall: '/pages/hall/index',
  course: '/pages/course/index',
  activity: '/pages/activity/index'
}

const CONTENT_DETAIL_PATHS = {
  news: '/packageA/news/detail',
  course: '/packageB/course/detail',
  hall: '/packageA/hall/detail',
  activity: '/packageC/activity/detail',
  craft: '/packageA/craft/detail'
}

function isTabPage(path) {
  if (!path) return false
  const base = path.split('?')[0]
  return TAB_PAGES.indexOf(base) >= 0
}

function buildQueryUrl(basePath, id) {
  return `${basePath}?id=${encodeURIComponent(String(id))}`
}

function resolveBannerPath(linkType, linkValue) {
  if (!linkType || linkType === 'none' || !linkValue) return null

  if (linkType === 'fixed') {
    return FIXED_PAGE_PATHS[linkValue] || null
  }

  const detailBase = CONTENT_DETAIL_PATHS[linkType]
  if (detailBase) {
    return buildQueryUrl(detailBase, linkValue)
  }

  if (linkType === 'page') {
    return linkValue.startsWith('/') ? linkValue : '/' + linkValue
  }

  return null
}

function openPath(url) {
  if (!url) return
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
}

/*
 * 打开后台配置的内容链接
 * linkType: none / fixed / news|course|... / page(旧) / url
 * linkValue: 频道 key、内容 ID、旧路径或外链
 */
function openContentLink(linkType, linkValue) {
  if (!linkType || linkType === 'none') return

  if (linkType === 'url') {
    if (!linkValue) return
    wx.setClipboardData({
      data: linkValue,
      success() {
        wx.showToast({ title: '链接已复制', icon: 'none' })
      }
    })
    return
  }

  const url = resolveBannerPath(linkType, linkValue)
  openPath(url)
}

module.exports = {
  openContentLink,
  isTabPage,
  resolveBannerPath
}
