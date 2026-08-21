// packageC/profile/list.js — 个人中心通用列表（收藏/报名/下载/足迹/徽章）
const { get } = require('../../utils/request')
const { downloadResource } = require('../../utils/resourceDownload')
const {
  buildLoadedViewState,
  buildErrorViewState
} = require('../../utils/profileListPage')

const CONFIG = {
  favorites:  { title: '我的收藏',   api: '/profile/favorites',  empty: '暂无收藏' },
  enrolls:    { title: '我的报名',   api: '/profile/enrolls',    empty: '暂无报名' },
  downloads:  { title: '下载记录',   api: '/profile/downloads',  empty: '暂无下载记录' },
  footprints: { title: '学习足迹',   api: '/profile/footprints', empty: '近 30 天暂无足迹' },
  badges:     { title: '学习徽章',   api: '/profile/badges',     empty: '暂无徽章数据' }
}

const TYPE_META = {
  favorites:  { icon: 'heart',     cls: 'tc-rose' },
  enrolls:    { icon: 'calendar',  cls: 'tc-blue' },
  downloads:  { icon: 'download',  cls: 'tc-green' },
  footprints: { icon: 'footprint', cls: 'tc-slate' },
  badges:     { icon: 'medal',     cls: 'tc-gold' }
}

Page({
  data: {
    type: '',
    list: [],
    timelineGroups: [],
    isEmpty: true,
    loading: true,
    error: false,
    navTitle: '我的',
    emptyText: '暂无数据',
    typeIcon: 'heart',
    typeCls: 'tc-rose',
    redownloadingId: null
  },

  onLoad(options) {
    const type = options.type || 'favorites'
    const cfg = CONFIG[type] || CONFIG.favorites
    const meta = TYPE_META[type] || TYPE_META.favorites
    this.setData({ type, navTitle: cfg.title, emptyText: cfg.empty, typeIcon: meta.icon, typeCls: meta.cls })
    this._load(type, cfg.api)
  },

  onRetry() {
    const type = this.data.type || 'favorites'
    const cfg = CONFIG[type] || CONFIG.favorites
    this._load(type, cfg.api)
  },

  async _load(type, api) {
    this.setData({ loading: true, error: false })
    try {
      const raw = await get(api)
      this.setData(buildLoadedViewState(type, raw))
    } catch (e) {
      this.setData(buildErrorViewState(this.data))
      console.warn('[profile/list] 列表加载失败', type, e)
    }
  },

  onItemTap(e) {
    const route = e.currentTarget.dataset.route
    if (route) {
      wx.navigateTo({ url: route, fail: () => {} })
    }
  },

  onRedownload(e) {
    const id = e.currentTarget.dataset.id
    if (!id || this.data.redownloadingId) return
    this.setData({ redownloadingId: id })
    downloadResource(id, {
      onRecorded: () => {
        if (this.data.type === 'downloads') {
          this._load('downloads', CONFIG.downloads.api)
        }
      },
      onComplete: () => {
        this.setData({ redownloadingId: null })
      }
    })
  }
})
