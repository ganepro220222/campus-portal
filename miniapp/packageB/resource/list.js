// packageB/resource/list.js — 资源下载列表逻辑
const { get } = require('../../utils/request')
const { mergeResourceList } = require('../../utils/content')

// 文件类型 → 色标 / 标签 / 归类
const FT = {
  pdf:  { cls: 'ft-pdf',  label: 'PDF', kind: '文档' },
  ppt:  { cls: 'ft-ppt',  label: 'PPT', kind: '课件' },
  pptx: { cls: 'ft-ppt',  label: 'PPT', kind: '课件' },
  word: { cls: 'ft-doc',  label: 'DOC', kind: '文档' },
  doc:  { cls: 'ft-doc',  label: 'DOC', kind: '文档' },
  docx: { cls: 'ft-doc',  label: 'DOC', kind: '文档' },
  xls:  { cls: 'ft-xlsx', label: 'XLS', kind: '文档' },
  xlsx: { cls: 'ft-xlsx', label: 'XLS', kind: '文档' },
  mp4:  { cls: 'ft-mp4',  label: 'MP4', kind: '视频' },
  mp3:  { cls: 'ft-mp3',  label: 'MP3', kind: '音频' }
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
  data: { all: [], resourceList: [], loading: true, cats: CATS, activeCat: 0, keyword: '' },

  onLoad() { this._loadList() },

  async _loadList() {
    this.setData({ loading: true })
    let all
    try {
      const list = await get('/resources').catch(() => null)
      all = decorate(mergeResourceList(list))
    } catch (err) {
      console.warn('[resource/list] 加载失败', err)
      all = decorate(mergeResourceList(null))
    }
    this.setData({ all, loading: false })
    this._applyFilter()
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
    const name = e.currentTarget.dataset.name || ''
    wx.showToast({ title: '开始下载 ' + name, icon: 'none' })
  }
})
