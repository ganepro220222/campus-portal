// utils/content.js — 接口数据与页面展示字段映射（不涉及 UI 结构）

const { formatCount } = require('./format')
const mock = require('../mock/defaults')
const { useMock } = require('../config/env')

function formatDate(val) {
  if (!val) return ''
  const s = String(val)
  return s.length >= 10 ? s.slice(0, 10) : s
}

function splitParagraphs(content) {
  if (!content) return []
  return String(content).split(/\n+/).map(s => s.trim()).filter(Boolean)
}

function mergeNewsArticle(raw, fallback) {
  const base = fallback || (useMock ? mock.newsDetail.article : {})
  if (!raw) return useMock ? base : {}
  const lead = raw.lead || raw.summary || base.lead
  const paras = raw.paras && raw.paras.length ? raw.paras : splitParagraphs(raw.content)
  return {
    ...base,
    ...raw,
    title: raw.title || base.title,
    category: raw.category || raw.categoryName || base.category,
    date: raw.date || formatDate(raw.publishTime),
    read: raw.read || formatCount(raw.viewCount || raw.readCount || 0),
    lead,
    drop: raw.drop || (lead ? lead.charAt(0) : base.drop),
    paras: paras.length ? paras : base.paras
  }
}

function mergeHallDetail(raw, fallback) {
  const base = fallback || (useMock ? mock.hallDetail : {})
  if (!raw) return useMock ? base : {}
  const tpl = base.slides || []
  const slides = (raw.slides || tpl).map((s, i) => ({
    ...(tpl[i % tpl.length] || tpl[0] || {}),
    ...s
  }))
  return {
    ...base,
    ...raw,
    name: raw.name || base.name,
    intro: raw.intro || base.intro,
    slides,
    caption: raw.caption || base.caption,
    audioTime: raw.audioTime || base.audioTime
  }
}

function mergeCourseDetail(raw, fallback) {
  const base = fallback || (useMock ? mock.courseDetail : {})
  if (!raw) return useMock ? base : {}
  return {
    ...base,
    ...raw,
    name: raw.name || base.name,
    intro: raw.intro || base.intro,
    audience: raw.audience || raw.targetAudience || base.audience,
    category: raw.category || base.category,
    tags: raw.tags || base.tags,
    resources: raw.resources || base.resources
  }
}

function mergeCraftDetail(raw, fallback) {
  const base = fallback || (useMock ? mock.craftDetail : {})
  if (!raw) return useMock ? base : {}
  return {
    ...base,
    ...raw,
    name: raw.name || base.name,
    introZh: raw.introZh || base.introZh,
    introEn: raw.introEn || base.introEn,
    images: raw.images && raw.images.length ? raw.images : base.images,
    contact: raw.contact || base.contact
  }
}

function mergeResourceList(records, fallback) {
  const base = fallback || (useMock ? mock.resources : [])
  const list = records && records.length ? records : (useMock ? base : [])
  return list.map((it) => ({
    ...it,
    fileSizeText: it.fileSizeText || formatFileSize(it.fileSizeKb)
  }))
}

function formatFileSize(kb) {
  if (!kb) return ''
  if (kb >= 1024) return (kb / 1024).toFixed(1) + ' MB'
  return kb + ' KB'
}

module.exports = {
  formatDate,
  mergeNewsArticle,
  mergeHallDetail,
  mergeCourseDetail,
  mergeCraftDetail,
  mergeResourceList
}
