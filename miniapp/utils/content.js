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

function resolveEmptyContentObject(fallback, useMockFlag = useMock) {
  if (useMockFlag) {
    return fallback != null ? { ...fallback } : {}
  }
  return null
}

function mergeNewsArticle(raw, fallback) {
  const base = fallback || (useMock ? mock.newsDetail.article : {})
  if (!raw) return resolveEmptyContentObject(base)
  const explicitSummary = String(raw.summary ?? '').trim()
  const showLead = !!explicitSummary
  const lead = showLead ? explicitSummary : ''
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
    showLead,
    lead,
    /*
     * 首字下沉的契约：drop 是首字，leadRest 是**去掉首字之后**的剩余部分，
     * 两者拼起来才等于 lead；lead 本身保持完整原文不动。
     *
     * 原来只给了 drop 却照样把整段 lead 渲染出去，于是「示例内容…」被渲染成
     * 「示」+「示例内容…」，首字凭空多出一个。mock 里当年是手写 drop:'六' 配
     * lead:'月五日起…'（即 lead 已被截过），和接口下发的口径正好相反——
     * 所以这里一律自己从 lead 推导，不再信任外部传来的 drop，免得两套口径打架。
     *
     * lead 保持完整只给数据层用。展示一律 drop + leadRest，
     * 正文是不是富文本都一样——后台 WangEditor 一保存，content 就是 HTML，
     * 若只在纯文本分支做首字下沉，编辑/扩写后摘要首字会突然变回正常大小。
     */
    drop: lead ? lead.charAt(0) : '',
    leadRest: lead ? lead.slice(1) : '',
    coverImageMode: raw.coverFitMode === 'fit' ? 'aspectFit' : 'aspectFill',
    contentHtml,
    useRichText,
    paras: paras.length ? paras : (useRichText ? [] : base.paras)
  }
}

function mergeHallDetail(raw, fallback) {
  const base = fallback || (useMock ? mock.hallDetail : {})
  if (!raw) return resolveEmptyContentObject(base)
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
  if (!raw) return resolveEmptyContentObject(base)
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

/** 文创详情合并：小程序仅支持多角度图片展示 */
function mergeCraftDetail(raw, fallback) {
  const base = fallback || (useMock ? mock.craftDetail : {})
  if (!raw) return resolveEmptyContentObject(base)
  const images = raw.images && raw.images.length ? raw.images : base.images
  return {
    ...base,
    ...raw,
    name: raw.name || base.name,
    introZh: raw.introZh || base.introZh,
    introEn: raw.introEn || base.introEn,
    images,
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
  resolveEmptyContentObject,
  formatDate,
  isHtmlContent,
  stripUnsafeHtml,
  mergeNewsArticle,
  mergeHallDetail,
  mergeCourseDetail,
  mergeCraftDetail,
  mergeResourceList
}
