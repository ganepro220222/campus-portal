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

/*
 * 正文里从别处粘来的**白底**要去掉。
 *
 * 真出过：后台编辑的动态发到小程序上，每一段文字背后都拖着一块纯白，
 * 而页面的纸是 #F7F3E8。量过截图：底 #F7F3E8 占 407 行、纯 #FFFFFF 占 237 行，
 * 而 #FFFFFF 不在这套令牌里的任何一个——不是我们画的，是正文自带的。
 * 从公众号 / Word / 网页里粘进编辑器的内容，常在 <p>/<span>/<section> 上
 * 带着 `background:#fff` 或 `background-color:rgb(255,255,255)`；
 * <rich-text> 认内联 style，于是忠实地把那块白画了出来。
 *
 * 只删**浅且近中性**的那一档：
 *   浅  —— 三个通道的最小值 ≥ 240
 *   中性 —— 最大通道减最小通道 ≤ 12
 * 这样纯白、#FAFAFA、rgb(255,255,255) 都会被清掉，
 * 而作者**有意**打的荧光笔（黄、绿这类饱和色）留得住——
 * 那是排版意图，不该替人做主删掉。
 * 值里带 url() 的一概不动：那是背景图，改不干净不如不改。
 *
 * ⚠ 后台 admin/src/utils/pastedBackground.mjs 里有一份一模一样的实现（两个包不能
 *   互相 import：小程序是独立的 CommonJS 包）。两边必须同步，
 *   scripts/test-pasted-background-parity.mjs 会拿同一张用例表逐条比对。
 *
 * 为什么在这里删而不是只在后台删：已经发出去的那些改不了了，
 * 在渲染这一侧兜住，老内容不用回去重编。后台那边也加了同样一条，
 * 免得新内容继续带进来（admin/src/utils/html.ts）。
 *
 * 放在 styleRichNodes **之前**：这一刀只过作者的 HTML，
 * 我们自己往引文和插图上注入的样式压根不进这道过滤。
 * （插图纸托 #F6F2E6 最小通道 230，本来也够不着 240 的线；
 *   但把注入排在后面，将来换个更浅的纸也不会被自己吃掉。）
 */
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

/*
 * 正文里的**引文**和**插图**要按方案 A 的样子出来。
 *
 * 为什么不能写在 wxss 里：正文走的是 <rich-text>，它**不认外部 class**，
 * 节点上只有 style 属性会生效。所以设计稿的 .art-quote / .art-fig .fig-box
 * 在小程序这边落不了地——那两段样式写了也没人读。
 * 后台用的是 wangEditor，工具栏没排除 blockQuote、图片上传也开着，
 * 所以这两种节点是真会出现的，不是假想。
 *
 * 取值照搬设计稿（shuyuan.css 的 .art-quote / .art-fig .fig-box），
 * 令牌换成字面量——data 里同样没有 var() 可用：
 *   引文：左沿一道木色粗线 + 一层极淡的暖底（设计稿 rgba(107,74,50,.045)）
 *   插图：纸托 + 细框，图片"裱"在纸上，不是一块贴上去的方块
 * box-shadow 没搬：rich-text 对它的支持各端不一，不如不画。
 *
 * **前缀注入**：把样式拼在原有 style 的前面，编辑器自己写的（居中、字号）
 * 排在后面，同属性时后者赢——不覆盖作者的排版意图。
 */
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

/*
 * 首字下沉需要文字绕排住那个大字，否则大字会孤零零杵在摘要区的虚线上方。
 * 实测（375px 宽、正文 29rpx/1.9、首字 78rpx/0.92）：
 *   摘要一行 = 28px，撑不住 36px 高的首字；两行 = 55px，才刚好盖住。
 *   一行放得下约 21 个全角字符，所以摘要不足 22 个全角宽就不做下沉，
 *   改成行内略抬高（drop--raised）。有摘要就一定放大首字，只是形态不同，
 *   避免老师对比两条动态时以为短的那条坏了。
 * 用显示宽度而不是 length：全角算 1、半角算 0.5，否则 22 个英文字母只占半行，
 * 照样会触发下沉。for...of / Array.from 按码点遍历，emoji 不会被拆成两个半个。
 */
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
