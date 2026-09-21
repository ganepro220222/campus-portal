// utils/homeNav.js — 首页功能入口矩阵

const { isTabPage } = require('./navigate')
const { ENABLE_AI_CHAT, isAiChatPath } = require('../config/features')

const TONE_CLASSES = ['e1', 'e2', 'e3', 'e4', 'e5']

const DEFAULT_ENTRIES = [
  { id: 1, label: '书院动态', icon: 'entry-news', path: '/pages/news/index', toneClass: 'e1' },
  { id: 2, label: '展馆展示', icon: 'entry-hall', path: '/pages/hall/index', toneClass: 'e2' },
  { id: 3, label: '课程中心', icon: 'entry-course', path: '/pages/course/index', toneClass: 'e3' },
  { id: 4, label: '资源下载', icon: 'entry-resource', path: '/packageB/resource/list', toneClass: 'e4' },
  { id: 5, label: '活动报名', icon: 'entry-enroll', path: '/pages/activity/index', toneClass: 'e5' }
]

/*
 * 五个入口用的是**多色填充的器物图**，不是 icon 组件那套线描。
 *
 * 这一条是返工留下的规矩：线描是 tabBar 与顶栏那一档的语言
 * （小、要一眼认出轮廓）；入口这一档在定稿里是大的、多色的、有体积的器物。
 * icon 组件只吃一个颜色，装不下多色，所以走图片。
 * 图由 scripts/build-entry-icons.mjs 从设计稿的 icon_set() 生成。
 *
 * 展馆与课程各有两枚同名不同档的图标：
 * tabBar 走线描的 museum / course，入口走多色的 entry-hall / entry-course。
 *
 * 后台可以给入口配任意图标名；配到表外的名字就退回 icon 组件的单色线描，
 * 不至于开天窗。
 */
const ENTRY_IMAGES = {
  'entry-news':     '/assets/images/entry-news.png',
  'entry-hall':     '/assets/images/entry-hall.png',
  'entry-course':   '/assets/images/entry-course.png',
  'entry-resource': '/assets/images/entry-resource.png',
  'entry-enroll':   '/assets/images/entry-enroll.png',
  // 后台若仍按旧名配，也认
  museum:           '/assets/images/entry-hall.png',
  course:           '/assets/images/entry-course.png'
}

function normalizePath(path) {
  if (!path) return ''
  const p = String(path).trim()
  return p.startsWith('/') ? p : `/${p}`
}

function mapNavItem(raw, index) {
  if (!raw) return null
  const path = normalizePath(raw.path)
  if (!path) return null
  return {
    id: raw.id,
    label: raw.label || '',
    icon: raw.icon || 'grid',
    iconImage: ENTRY_IMAGES[raw.icon] || '',
    path,
    toneClass: TONE_CLASSES[index % TONE_CLASSES.length]
  }
}

function mergeHomeNavItems(apiList) {
  const source = (apiList && apiList.length) ? apiList : DEFAULT_ENTRIES
  return source.map(mapNavItem).filter(Boolean).filter((item) => {
    if (ENABLE_AI_CHAT) return true
    const label = item.label || ''
    return !isAiChatPath(item.path) && !label.includes('智能问答') && !label.includes('知识问答')
  })
}

function openNavItem(entry) {
  const path = entry && entry.path
  if (!path) return
  const base = path.split('?')[0]
  if (isTabPage(path)) {
    wx.switchTab({ url: base })
    return
  }
  wx.navigateTo({
    url: path,
    fail() {
      wx.showToast({ title: '页面暂未开放', icon: 'none' })
    }
  })
}

module.exports = {
  DEFAULT_ENTRIES,
  ENTRY_IMAGES,
  mergeHomeNavItems,
  openNavItem,
  normalizePath
}
