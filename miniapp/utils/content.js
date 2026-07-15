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

function isHtmlContent(content) {
  if (!content) return false
  return /<[a-z][\s\S]*>/i.test(String(content))
}

function stripUnsafeHtml(html) {
  if (!html) return ''
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
}

function mergeNewsArticle(raw, fallback) {
  const base = fallback || (useMock ? mock.newsDetail.article : {})
  if (!raw) return useMock ? base : {}
  const lead = raw.lead || raw.summary || base.lead
  const contentHtml = isHtmlContent(raw.content) ? stripUnsafeHtml(raw.content) : ''
  const useRichText = !!contentHtml
  const paras = useRichText
    ? []
    : (raw.paras && raw.paras.length ? raw.paras : splitParagraphs(raw.content))
  return {
    ...base,
    ...raw,
    title: raw.title || base.title,
    category: raw.category || raw.categoryName || base.category,
    date: raw.date || formatDate(raw.publishTime),
    read: raw.read || formatCount(raw.viewCount || raw.readCount || 0),
    lead,
    drop: raw.drop || (lead ? lead.charAt(0) : base.drop),
    contentHtml,
    useRichText,
    paras: paras.length ? paras : (useRichText ? [] : base.paras)
  }
}

function mergeHallDetail(raw, fallback) {
  const base = fallback || (useMock ? mock.hallDetail : {})
  if (!raw) return useMock ? base : {}
  const slides = (raw.slides && raw.slides.length)
    ? raw.slides.map((s, i) => ({
      cls: 'gi' + ((i % 3) + 1),
      icon: 'museum',
      ...s
    }))
    : (useMock ? (base.slides || []) : [{ cls: 'gi1', icon: 'museum' }])
  const sections = (raw.sections && raw.sections.length)
    ? raw.sections.map((sec, si) => ({
      ...sec,
      anchorId: `section-${sec.id || si + 1}`,
      items: (sec.items || []).map((item, ii) => ({
        ...item,
        cls: 'gi' + ((ii % 3) + 1),
        icon: 'museum'
      }))
    }))
    : (base.sections || [])
  const vrUrl = raw.vrUrl || base.vrUrl || ''
  return {
    ...base,
    ...raw,
    name: raw.name || base.name,
    shortName: raw.shortName || base.shortName,
    intro: raw.intro || base.intro,
    slides,
    sections,
    hasImmersive: sections.length > 0,
    caption: raw.caption || base.caption,
    currentCaption: raw.caption || base.caption,
    audioTime: raw.audioTime || base.audioTime,
    audioUrl: raw.audioUrl || base.audioUrl || '',
    vrUrl,
    vrReady: raw.vrReady === true || (vrUrl && String(vrUrl).startsWith('https://'))
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

/** 是否具备可用的 3D 模型地址（docs：preview_type=model3d 且 GLB URL 有效） */
function hasCraftModel3d(previewType, model3dUrl) {
  return previewType === 'model3d'
    && !!model3dUrl
    && /^https?:\/\//i.test(String(model3dUrl))
}

function buildModelScaleFromTransform(transform) {
  if (!transform || typeof transform.scale !== 'number') return '1.2 1.2 1.2'
  const s = transform.scale * 1.2
  return `${s} ${s} ${s}`
}

function buildModelPositionFromTransform(transform) {
  if (!transform) return '0 0 0'
  const x = typeof transform.offsetX === 'number' ? transform.offsetX : 0
  const y = typeof transform.offsetY === 'number' ? transform.offsetY : 0
  const z = typeof transform.offsetZ === 'number' ? transform.offsetZ : 0
  return `${x} ${y} ${z}`
}

function mergeCraftDetail(raw, fallback) {
  const base = fallback || (useMock ? mock.craftDetail : {})
  if (!raw) return useMock ? base : {}
  const previewType = raw.previewType || base.previewType || 'multi_image'
  const model3dUrl = raw.model3dUrl || base.model3dUrl || ''
  const canUse3d = hasCraftModel3d(previewType, model3dUrl)
  const transform = raw.transform || base.transform || null
  return {
    ...base,
    ...raw,
    name: raw.name || base.name,
    introZh: raw.introZh || base.introZh,
    introEn: raw.introEn || base.introEn,
    previewType,
    model3dUrl,
    canUse3d,
    viewerEnabled: raw.viewerEnabled === true || base.viewerEnabled === true,
    transform,
    modelScale: buildModelScaleFromTransform(transform),
    modelPosition: buildModelPositionFromTransform(transform),
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
  isHtmlContent,
  stripUnsafeHtml,
  mergeNewsArticle,
  mergeHallDetail,
  mergeCourseDetail,
  hasCraftModel3d,
  mergeCraftDetail,
  mergeResourceList
}
