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

/* 去掉粘贴带来的近白背景（min≥240 且色差≤12）；荧光笔与 background 含 url() 的保留。
 * 须排在 styleRichNodes 之前。与 admin/src/utils/pastedBackground.mjs 同逻辑。 */
function isPastedWhite(color) {
  const t = String(color || '').trim().toLowerCase()
  if (!t) return false
  if (t === 'white' || t === 'transparent') return true
  let rgb = null
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(t)
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1]
    rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  }
  const fn = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(t)
  if (fn) rgb = [+fn[1], +fn[2], +fn[3]]
  if (!rgb) return false
  const lo = Math.min(rgb[0], rgb[1], rgb[2])
  const hi = Math.max(rgb[0], rgb[1], rgb[2])
  return lo >= 240 && hi - lo <= 12
}

function dropPastedBackgrounds(html) {
  if (!html) return ''
  return String(html).replace(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi, (full, _q, dq, sq) => {
    const raw = dq !== undefined ? dq : sq
    const kept = raw.split(';').filter((decl) => {
      const m = /^\s*(background|background-color)\s*:\s*([\s\S]+)$/i.exec(decl)
      if (!m) return true
      if (/url\(/i.test(m[2])) return true        // 背景图，别碰
      return !isPastedWhite(m[2])
    })
    const out = kept.join(';').replace(/^;+|;+$/g, '').trim()
    return out ? ' style="' + out + '"' : ''
  })
}

/* rich-text 只认节点上的 style。引文 / 插图按设计稿注入内联样式；
 * 拼在原有 style 前面，同属性时编辑器侧覆盖。 */
const QUOTE_STYLE = [
  'margin:36rpx 0',
  'padding:24rpx 28rpx',
  'border-left:6rpx solid #E4CEA8',   /* ＝ --wood-30，设计稿的 --wood-light */
  'background:rgba(107,74,50,.045)',
  'font-size:28rpx',
  'line-height:1.9',
  'color:#4C505C'                      /* ＝ --ink-2 */
].join(';')

const FIG_STYLE = [
  'display:block',
  'width:100%',
  'box-sizing:border-box',
  'margin:36rpx 0',
  'padding:14rpx',
  'border:1rpx solid #E4DCC8',         /* ＝ --line */
  'border-radius:12rpx',
  'background:#F6F2E6'                 /* ＝ --paper-1 */
].join(';')

function injectStyle(tag, style, html) {
  const open = new RegExp('<' + tag + '\\b([^>]*)>', 'gi')
  return html.replace(open, (full, attrs) => {
    const has = /\sstyle\s*=\s*("([^"]*)"|'([^']*)')/i.exec(attrs)
    if (!has) return '<' + tag + attrs + ' style="' + style + '">'
    const own = (has[2] !== undefined ? has[2] : has[3]).trim().replace(/^;|;$/g, '')
    const merged = own ? style + ';' + own : style
    return '<' + tag + attrs.replace(has[0], ' style="' + merged + '"') + '>'
  })
}

function styleRichNodes(html) {
  if (!html) return ''
  return injectStyle('img', FIG_STYLE, injectStyle('blockquote', QUOTE_STYLE, html))
}

/* 摘要显示宽度不足 22（全角 1、半角 0.5）则用 drop--raised，不做首字下沉。 */
const DROP_CAP_MIN_DISPLAY_WIDTH = 22

function displayWidth(text) {
  let width = 0
  for (const ch of String(text || '')) {
    width += /[\x00-\xff]/.test(ch) ? 0.5 : 1
  }
  return width
}

function shouldDropCap(lead) {
  return displayWidth(lead) >= DROP_CAP_MIN_DISPLAY_WIDTH
}

function splitLeadChars(lead) {
  const leadChars = lead ? Array.from(lead) : []
  return {
    drop: leadChars[0] || '',
    leadRest: leadChars.slice(1).join('')
  }
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
  const contentHtml = isHtmlContent(raw.content)
    ? styleRichNodes(dropPastedBackgrounds(stripUnsafeHtml(raw.content)))
    : ''
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
    /* drop / leadRest 从 lead 用 Array.from 切开，不用外部 drop，避免 emoji 被拆开或首字重复。 */
    ...splitLeadChars(lead),
    dropCap: shouldDropCap(lead),
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
  isPastedWhite,
  dropPastedBackgrounds,
  mergeNewsArticle,
  mergeHallDetail,
  mergeCourseDetail,
  mergeCraftDetail,
  mergeResourceList,
  displayWidth,
  shouldDropCap,
  splitLeadChars,
  DROP_CAP_MIN_DISPLAY_WIDTH
}
