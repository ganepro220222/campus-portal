// utils/homeNav.js — 首页功能入口矩阵

const { isTabPage } = require('./navigate')
const { ENABLE_AI_CHAT, isAiChatPath } = require('../config/features')

const TONE_CLASSES = ['e1', 'e2', 'e3', 'e4', 'e5']

const DEFAULT_ENTRIES = [
  { id: 1, label: '书院动态', icon: 'entry-news', path: '/pages/news/index', toneClass: 'e1' },
  { id: 2, label: '展馆展示', icon: 'museum', path: '/pages/hall/index', toneClass: 'e2' },
  { id: 3, label: '课程中心', icon: 'course', path: '/pages/course/index', toneClass: 'e3' },
  { id: 4, label: '资源下载', icon: 'entry-resource', path: '/packageB/resource/list', toneClass: 'e4' },
  { id: 5, label: '报名', icon: 'entry-enroll', path: '/pages/activity/index', toneClass: 'e5' }
]

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
    path,
    toneClass: TONE_CLASSES[index % TONE_CLASSES.length]
  }
}

function mergeHomeNavItems(apiList) {
  const source = (apiList && apiList.length) ? apiList : DEFAULT_ENTRIES
  return source.map(mapNavItem).filter(Boolean).filter((item) => {
    if (ENABLE_AI_CHAT) return true
    const label = item.label || ''
    return !isAiChatPath(item.path) && !label.includes('智能问答')
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
  mergeHomeNavItems,
  openNavItem,
  normalizePath
}
