/**
 * 工作台排序 / 筛选 / 分组（纯函数，studio.html 与单元测试共用）。
 *
 * 上百件展品时，「按什么排」和「先处理哪些」比多点几下更重要，
 * 所以除了常规的序号 / 名称 / 时间，还提供：
 *   · 待完善优先 —— 把缺东西的直接顶到最前；
 *   · 背景环境   —— 同一张全景图 / 同一个预设的展品自动挨在一起（即「分组」）。
 */

/** 环境预设的中文名。键必须与 light-rig.mjs 的 ENV_PRESETS 一致（有单测兜底） */
export const ENV_PRESET_LABELS = {
  room: '内置房间',
  studio: '影棚柔光',
  gallery: '博物馆暖阁',
  overcast: '户外阴天',
  night: '夜展暗场',
}

/** 数字片段的可排序键：先比有效位数，再比数值（支持最长 32 位编号）。 */
function numericPartKey(part) {
  const digits = part.replace(/^0+/, '') || '0'
  return `${String(digits.length).padStart(2, '0')}${digits}`
}

/** 自然序切分：craft-2 要排在 craft-10 前面；超长数字按数值而非字典序。 */
export function naturalKey(text) {
  return String(text ?? '').match(/\d+|\D+/g)?.map(part => (/^\d/.test(part) ? numericPartKey(part) : part)).join('') ?? ''
}

export function compareNatural(a, b) {
  const ka = naturalKey(a), kb = naturalKey(b)
  return ka < kb ? -1 : ka > kb ? 1 : 0
}

const collator = typeof Intl !== 'undefined' && Intl.Collator
  ? new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' })
  : null
function compareText(a, b) {
  const ta = String(a ?? ''), tb = String(b ?? '')
  return collator ? collator.compare(ta, tb) : (ta < tb ? -1 : ta > tb ? 1 : 0)
}

/**
 * 完成度：分数越低越该先处理。
 * 权重按「不修就没法用」排序：读不出配置 > 没模型 > 没封面 > 没热点 > 没全景。
 */
export function completeness(item = {}) {
  const missing = []
  if (item.error) missing.push('配置读不出')
  if (item.hasModel === false) missing.push('缺模型')
  if (!item.poster) missing.push('缺封面')
  if (!item.hotspots) missing.push('无热点')
  if (!item.hasPano) missing.push('无全景')
  let score = 100
  if (item.error) score -= 60
  if (item.hasModel === false) score -= 25
  if (!item.poster) score -= 10
  if (!item.hotspots) score -= 4
  if (!item.hasPano) score -= 1
  return { score, missing }
}

const baseName = p => String(p ?? '').trim().split(/[\\/]/).pop() || ''

/** 徽标/搜索用的全景展示名上限（分组 identity 不受此限制）。 */
export const PANORAMA_LABEL_NAME_MAX = 120

function truncateDisplayName(name) {
  if (!name) return ''
  return name.length > PANORAMA_LABEL_NAME_MAX
    ? name.slice(0, PANORAMA_LABEL_NAME_MAX) + '…'
    : name
}

function pathnameBaseName(raw, protocolRelative = false) {
  try {
    const u = new URL(protocolRelative ? 'https:' + raw : raw)
    let path = u.pathname
    try {
      path = decodeURIComponent(path)
    } catch {
      /* 保留编码路径 */
    }
    return baseName(path)
  } catch {
    return ''
  }
}

/** 全景展示名：data/blob 用短标签；HTTP URL 只取 pathname basename，不含 query。 */
function panoramaDisplayName(p) {
  const s = String(p ?? '').trim()
  if (/^data:/i.test(s)) return '内嵌图片'
  if (/^blob:/i.test(s)) return '临时图片'
  const norm = normSlashes(s)
  if (/^https?:\/\//i.test(norm)) {
    const name = pathnameBaseName(norm)
    return name ? truncateDisplayName(name) : '远程图片'
  }
  if (norm.startsWith('//')) {
    const name = pathnameBaseName(norm, true)
    return name ? truncateDisplayName(name) : '远程图片'
  }
  const name = baseName(norm)
  return name ? truncateDisplayName(name) : '本地图片'   // 取不出文件名的本地路径
}

function normSlashes(p) {
  return String(p ?? '').trim().replace(/\\/g, '/')
}

function isRemotePanorama(p) {
  const s = normSlashes(p)
  return /^(https?:|data:|blob:)/i.test(s) || s.startsWith('//')
}

/** 远程全景分组身份：仅 scheme/hostname 大小写不敏感，path/query/fragment 保持原样。 */
export function panoramaUrlKey(raw) {
  const s = normSlashes(raw)
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s)
      u.protocol = u.protocol.toLowerCase()
      u.hostname = u.hostname.toLowerCase()
      return u.href
    } catch {
      return s
    }
  }
  if (s.startsWith('//')) {
    try {
      const u = new URL('https:' + s)
      u.hostname = u.hostname.toLowerCase()
      return '//' + u.host + u.pathname + u.search + u.hash
    } catch {
      return s
    }
  }
  // data:/blob: 等内容敏感，不做整条小写化
  return s
}

/** FNV-1a 32 位 hex；用于 data/blob 紧凑分组 identity（非密码用途）。 */
export function fnv1aHex(text) {
  let h = 2166136261
  const s = String(text)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

/** data URI 分组 key：不含 Base64 主体，避免排序时比较 MB 级字符串。 */
export function dataUriEnvKey(raw) {
  const s = normSlashes(raw)
  const comma = s.indexOf(',')
  const header = comma >= 0 ? s.slice(0, comma) : s
  const mime = /^data:([^;,]+)/i.exec(header)?.[1]?.toLowerCase() || 'unknown'
  return `pano-data:${mime}:${s.length}:${fnv1aHex(s)}`
}

function blobEnvKey(raw) {
  const s = normSlashes(raw)
  return `pano-blob:${s.length}:${fnv1aHex(s)}`
}

const _envKeyCache = new Map()

/** 测试或热重载时可清空全景 envKey 缓存。 */
export function clearEnvKeyCache() {
  _envKeyCache.clear()
}

/**
 * 缓存键只服务「没有内容指纹」这条路径 —— 有指纹时 envKey 早已直接返回，根本走不到这里。
 * 曾经这里也按 hash 建过键，那是个陷阱：一旦上面的分支改动，同 hash 不同路径的项会
 * 命中彼此的缓存、拿到对方的 key，测试反而看不出问题（实测能把注入的回归完全掩盖）。
 */
function panoEnvCacheKey(item, raw) {
  if (/^data:/i.test(raw) || /^blob:/i.test(raw) || isRemotePanorama(raw)) return 'remote:' + raw
  return 'local:' + normSlashes(item.dir) + '\0' + raw
}

function computePanoEnvKey(item, raw) {
  if (/^data:/i.test(raw)) return dataUriEnvKey(raw)
  if (/^blob:/i.test(raw)) return blobEnvKey(raw)
  if (isRemotePanorama(raw)) return 'pano-url:' + panoramaUrlKey(raw)
  if (raw.startsWith('/')) return 'pano-root:' + raw
  const dir = normSlashes(item.dir).replace(/\/+$/, '')
  return 'pano:' + (dir ? dir + '/' : '') + raw
}

/** 背景分组 identity：hash > 远程 URL > 根相对路径 > 展品目录+相对路径。 */
export function envKey(item = {}) {
  if (item.hasPano && item.panorama) {
    const hash = String(item.panoramaHash ?? '').trim().toLowerCase()
    if (hash) return 'pano-hash:' + hash
    const raw = normSlashes(item.panorama)
    const ck = panoEnvCacheKey(item, raw)
    const hit = _envKeyCache.get(ck)
    if (hit !== undefined) return hit
    const key = computePanoEnvKey(item, raw)
    _envKeyCache.set(ck, key)
    return key
  }
  if (item.error) return 'zz:error'
  return 'preset:' + (ENV_PRESET_LABELS[item.envPreset] ? item.envPreset : 'room')
}

export function envLabel(item = {}) {
  if (item.hasPano && item.panorama) return '全景 · ' + panoramaDisplayName(item.panorama)
  if (item.error) return ''
  const key = envKey(item)
  return ENV_PRESET_LABELS[key.slice('preset:'.length)] || ENV_PRESET_LABELS.room
}

/** 排序方式；cmp 一律按「升序」语义写，desc 由外部翻转 */
export const SORTS = [
  { id: 'dir', label: '目录序号', cmp: (a, b) => compareNatural(a.dir, b.dir) },
  { id: 'mtime', label: '最后编辑', cmp: (a, b) => (a.mtime || 0) - (b.mtime || 0), defaultDesc: true },
  { id: 'title', label: '展品名称', cmp: (a, b) => compareText(a.title, b.title) },
  { id: 'todo', label: '待完善优先', cmp: (a, b) => completeness(a).score - completeness(b).score },
  { id: 'env', label: '背景环境', cmp: (a, b) => compareText(envKey(a), envKey(b)) },
  { id: 'hotspots', label: '热点数量', cmp: (a, b) => (a.hotspots || 0) - (b.hotspots || 0), defaultDesc: true },
]

export const SORT_IDS = SORTS.map(s => s.id)
export const DEFAULT_SORT = 'dir'

export function sortSpec(id) {
  return SORTS.find(s => s.id === id) || SORTS.find(s => s.id === DEFAULT_SORT)
}

/** 该排序方式默认是降序还是升序（时间 / 数量类默认从新到旧、从多到少） */
export function defaultDesc(id) {
  return !!sortSpec(id).defaultDesc
}

/**
 * 排序。始终以目录序号做末级比较，保证结果稳定
 * ——否则同分项在不同浏览器 / 不同次刷新里顺序会跳。
 */
export function sortItems(items, id = DEFAULT_SORT, desc = false) {
  const spec = sortSpec(id)
  const dir = desc ? -1 : 1
  return [...(items || [])].sort((a, b) => {
    const primary = spec.cmp(a, b)
    if (primary !== 0) return primary * dir
    return compareNatural(a.dir, b.dir)
  })
}

export const FILTERS = [
  { id: 'all', label: '全部', test: () => true },
  { id: 'todo', label: '待完善', test: it => completeness(it).missing.length > 0 },
  { id: 'nomodel', label: '缺模型', test: it => it.hasModel === false || !!it.error },
  { id: 'noposter', label: '缺封面', test: it => !it.poster },
  { id: 'nopano', label: '无全景', test: it => !it.hasPano },
]

export const FILTER_IDS = FILTERS.map(f => f.id)
export const DEFAULT_FILTER = 'all'

export function filterSpec(id) {
  return FILTERS.find(f => f.id === id) || FILTERS[0]
}

/** 搜索匹配的字段：名称 / 副标题 / 目录名 / 背景环境，全部转小写 */
export function searchKey(item = {}) {
  return [item.title, item.subtitle, item.dir, envLabel(item)].filter(Boolean).join(' ').toLowerCase()
}

export function filterItems(items, filterId = DEFAULT_FILTER, query = '') {
  const spec = filterSpec(filterId)
  const q = String(query || '').trim().toLowerCase()
  return (items || []).filter(it => spec.test(it) && (!q || searchKey(it).includes(q)))
}

/** 计算各筛选项当前命中数，用于在按钮上显示徽标 */
export function filterCounts(items) {
  const out = {}
  for (const f of FILTERS) out[f.id] = (items || []).filter(f.test).length
  return out
}

/** 排序 + 筛选一步到位；先筛后排，返回可直接渲染的顺序 */
export function viewItems(items, { sort = DEFAULT_SORT, desc = false, filter = DEFAULT_FILTER, query = '' } = {}) {
  return sortItems(filterItems(items, filter, query), sort, desc)
}

/** 校正来自 localStorage 的旧值 / 脏值，避免界面进入不存在的排序或筛选 */
export function normalizeView(view = {}) {
  const sort = SORT_IDS.includes(view.sort) ? view.sort : DEFAULT_SORT
  return {
    sort,
    desc: typeof view.desc === 'boolean' ? view.desc : defaultDesc(sort),
    filter: FILTER_IDS.includes(view.filter) ? view.filter : DEFAULT_FILTER,
  }
}
