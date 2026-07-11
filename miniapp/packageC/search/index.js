// packageC/search/index.js — 全局搜索逻辑
const { get } = require('../../utils/request')
const { mapSearchResults, buildRoute } = require('../../utils/search')
const mock = require('../../mock/defaults')
const { useMock } = require('../../utils/mockGuard')

const HISTORY_KEY = 'search_history'

// 接口不可用时的本地检索索引（仅 dev mock 模式）
function localIndex() {
  const idx = []
  ;(mock.newsFull || []).forEach(n => idx.push({ title: n.title, targetType: 'news', targetId: n.id, typeLabel: '新闻', sub: n.category }))
  ;(mock.hallsFull || []).forEach(h => idx.push({ title: h.name, targetType: 'hall', targetId: h.id, typeLabel: '展馆', sub: h.desc }))
  ;(mock.crafts || []).forEach(c => idx.push({ title: c.name, targetType: 'craft', targetId: c.id, typeLabel: '文创', sub: c.intro }))
  ;(mock.coursesFull || []).forEach(c => idx.push({ title: c.name, targetType: 'course', targetId: c.id, typeLabel: '课程', sub: c.desc }))
  ;(mock.resources || []).forEach(r => idx.push({ title: r.name, targetType: 'resource', targetId: r.id, typeLabel: '资源', sub: r.categoryName }))
  return idx
}

function localSearch(q) {
  const kw = q.toLowerCase()
  return localIndex()
    .filter(it => (it.title || '').toLowerCase().indexOf(kw) >= 0 || (it.sub || '').toLowerCase().indexOf(kw) >= 0)
    .map(it => ({ ...it, route: buildRoute(it.targetType, it.targetId) }))
}

Page({
  data: {
    keyword: '',
    results: [],
    searched: false,
    hotTags: ['阳明文化', '屯堡地戏', '红色交通', '非遗银饰', '知行合一'],
    history: []
  },

  onLoad() {
    this.setData({ history: wx.getStorageSync(HISTORY_KEY) || [] })
  },

  onInput(e) { this.setData({ keyword: e.detail.value }) },
  onConfirm() { this.doSearch(this.data.keyword) },
  onTag(e) { this.doSearch(e.currentTarget.dataset.k) },

  onClear() { this.setData({ keyword: '', results: [], searched: false }) },

  async doSearch(keyword) {
    const q = (keyword || '').trim()
    this.setData({ keyword: q })
    if (!q) { this.setData({ results: [], searched: false }); return }

    let results = []
    try {
      const res = await get('/search', { q, types: 'news,hall,craft,course,resource', page: 1, size: 20 }).catch(() => null)
      const records = (res && res.records) ? res.records : []
      results = mapSearchResults(records)
    } catch (err) {
      console.warn('[search] 搜索失败', err)
    }
    if (!results.length && useMock) results = localSearch(q)
    this.setData({ results, searched: true })
    this._saveHistory(q)
  },

  _saveHistory(q) {
    let history = (wx.getStorageSync(HISTORY_KEY) || []).filter(k => k !== q)
    history.unshift(q)
    history = history.slice(0, 10)
    wx.setStorageSync(HISTORY_KEY, history)
    this.setData({ history })
  },

  clearHistory() {
    wx.removeStorageSync(HISTORY_KEY)
    this.setData({ history: [] })
  },

  onResultTap(e) {
    const route = e.currentTarget.dataset.route
    if (!route) { wx.showToast({ title: '内容建设中', icon: 'none' }); return }
    wx.navigateTo({ url: route, fail() { wx.showToast({ title: '打开失败', icon: 'none' }) } })
  }
})
