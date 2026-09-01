// packageB/resource/list.js — 资源下载列表逻辑
const { get } = require('../../utils/request')
const { mergeResourceList } = require('../../utils/content')
const { downloadResource } = require('../../utils/resourceDownload')
const audioPlayer = require('../../utils/resourceAudioPlayer')
const { requireLogin } = require('../../utils/auth')
const { applyListCollected, patchListItemCollected, toggleFavorite } = require('../../utils/favoriteToggle')
const {
  buildFeedLoadingPatch,
  buildFeedLoadedPatch,
  buildFeedFailurePatch
} = require('../../utils/feedListPage')

// 文件类型 → 色标 / 标签 / 归类
const FT = {
  pdf:  { cls: 'ft-pdf',  label: 'PDF', kind: '文档' },
  ppt:  { cls: 'ft-ppt',  label: 'PPT', kind: '课件' },
  pptx: { cls: 'ft-ppt',  label: 'PPT', kind: '课件' },
  word: { cls: 'ft-doc',  label: 'DOC', kind: '文档' },
  doc:  { cls: 'ft-doc',  label: 'DOC', kind: '文档' },
  docx: { cls: 'ft-doc',  label: 'DOC', kind: '文档' },
  xls:  { cls: 'ft-xlsx', label: 'XLS', kind: '文档' },
  xlsx: { cls: 'ft-xlsx', label: 'XLSX', kind: '文档' },
  mp4:  { cls: 'ft-mp4',  label: 'MP4', kind: '视频' },
  mp3:  { cls: 'ft-mp3',  label: 'MP3', kind: '音频' },
  aac:  { cls: 'ft-mp3',  label: 'AAC', kind: '音频' },
  m4a:  { cls: 'ft-mp3',  label: 'M4A', kind: '音频' }
}
const CATS = ['全部', '课件', '文档', '视频', '音频']

function decorate(list) {
  return (list || []).map((it) => {
    const ft = FT[String(it.fileType || '').toLowerCase()] ||
      { cls: 'ft-doc', label: String(it.fileType || 'FILE').toUpperCase(), kind: '文档' }
    return { ...it, ftClass: ft.cls, ftLabel: ft.label, kind: ft.kind }
  })
}

Page({
  data: {
    all: [],
    resourceList: [],
    loading: true,
    error: false,
    refreshError: false,
    cats: CATS,
    activeCat: 0,
    keyword: '',
    downloadingId: null
  },

  onLoad() { this._loadList(true) },

  onHide() {
    audioPlayer.pause()
  },

  onUnload() {
    audioPlayer.destroy()
  },

  onRetry() {
    this.setData({ refreshError: false, error: false })
    this._loadList(true)
  },

  async _loadList(reset) {
    const prev = this.data
    const silent = !reset && prev.all && prev.all.length > 0
    this.setData(buildFeedLoadingPatch(reset))
    try {
      const list = await get('/resources')
      const all = applyListCollected(decorate(mergeResourceList(list)))
      this.setData(buildFeedLoadedPatch('all', all, 1, false))
      this._applyFilter()
    } catch (err) {
      console.warn('[resource/list] 加载失败', err)
      this.setData(buildFeedFailurePatch(err, silent ? prev : { all: [] }, 'all'))
      this._applyFilter()
    }
  },

  switchCat(e) {
    this.setData({ activeCat: e.currentTarget.dataset.i })
    this._applyFilter()
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value })
    this._applyFilter()
  },

  _applyFilter() {
    const { all, activeCat, cats, keyword } = this.data
    const kw = (keyword || '').trim()
    const cat = cats[activeCat]
    const resourceList = all.filter((it) => {
      const okCat = activeCat === 0 || it.kind === cat
      const okKw = !kw || String(it.name || '').indexOf(kw) >= 0
      return okCat && okKw
    })
    this.setData({ resourceList })
  },

  onDownload(e) {
    const id = e.currentTarget.dataset.id
    if (id == null || id === '') {
      wx.showToast({ title: '资源信息无效', icon: 'none' })
      return
    }
    downloadResource(id, {
      onStart: () => this.setData({ downloadingId: id }),
      onRecorded: () => this._bumpDownloadCount(id),
      onComplete: () => this.setData({ downloadingId: null })
    })
  },

  onCollect(e) {
    const id = e.currentTarget.dataset.id
    if (id == null || id === '') return
    requireLogin(() => {
      toggleFavorite('resource', id).then(res => {
        const collected = !!(res && res.collected)
        this.setData({
          all: patchListItemCollected(this.data.all, id, collected),
          resourceList: patchListItemCollected(this.data.resourceList, id, collected)
        })
        if (collected) wx.showToast({ title: '收藏成功', icon: 'none' })
      })
    })
  },

  _bumpDownloadCount(id) {
    const key = String(id)
    const bump = (it) => (String(it.id) === key
      ? { ...it, downloadCount: (it.downloadCount || 0) + 1 }
      : it)
    this.setData({
      all: this.data.all.map(bump)
    })
    this._applyFilter()
  }
})
