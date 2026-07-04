// store/index.js — 轻量全局状态（无 Redux，用 getApp() 共享）
// 使用方式：const store = require('../../store/index')

const store = {
  // ── 用户状态 ──
  get userInfo()  { return getApp().globalData.userInfo },
  get token()     { return getApp().globalData.token },
  get isLoggedIn(){ return !!getApp().globalData.token },

  // ── 缓存的列表数据（避免重复请求）──
  _cache: {},

  setCache(key, data, ttlMs = 5 * 60 * 1000) {
    this._cache[key] = { data, expireAt: Date.now() + ttlMs }
  },

  getCache(key) {
    const item = this._cache[key]
    if (!item) return null
    if (Date.now() > item.expireAt) {
      delete this._cache[key]
      return null
    }
    return item.data
  },

  clearCache(key) {
    if (key) delete this._cache[key]
    else this._cache = {}
  }
}

module.exports = store
