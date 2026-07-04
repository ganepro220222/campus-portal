// packageC/search/index.js — 全局搜索逻辑（占位页 UI 不变）
const { get } = require('../../utils/request')
const { mapSearchResults } = require('../../utils/search')

Page({
  data: { keyword: '', results: [], searched: false },

  /** 供后续 UI 接入时调用 */
  async doSearch(keyword) {
    const q = (keyword || '').trim()
    this.setData({ keyword: q })
    if (!q) {
      this.setData({ results: [], searched: false })
      return
    }
    try {
      const res = await get('/search', {
        q,
        types: 'news,hall,craft,course,resource',
        page: 1,
        size: 20
      }).catch(() => null)
      const records = (res && res.records) ? res.records : []
      this.setData({
        results: mapSearchResults(records),
        searched: true
      })
    } catch (err) {
      console.warn('[search] 搜索失败', err)
      this.setData({ results: [], searched: true })
    }
  }
})
