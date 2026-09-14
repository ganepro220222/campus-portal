// utils/collegeIcon.js — 关联小程序图标：外形与裁切落到微信 image mode

/** 通途星入口用校方正式校徽；透明裁切图叠在色阶圆底上只会剩一弯月牙 */
const SCHOOL_EMBLEM_SRC = '/assets/images/school-emblem.png'

function normalizeCollegeIconFit(mode) {
  return String(mode == null ? '' : mode).trim().toLowerCase() === 'fill' ? 'fill' : 'fit'
}

function normalizeCollegeIconShape(shape) {
  return String(shape == null ? '' : shape).trim().toLowerCase() === 'circle' ? 'circle' : 'square'
}

function isTongTuXing(item) {
  return String((item && item.name) || '').trim() === '通途星'
}

function resolveCollegeIconUrl(item) {
  if (isTongTuXing(item)) {
    return SCHOOL_EMBLEM_SRC
  }
  return String((item && item.iconUrl) || '').trim()
}

function decorateCollegeApp(item) {
  if (!item || typeof item !== 'object') return item
  const iconUrl = resolveCollegeIconUrl(item)
  const useEmblem = iconUrl === SCHOOL_EMBLEM_SRC
  const iconFitMode = useEmblem ? 'fit' : normalizeCollegeIconFit(item.iconFitMode)
  const iconShape = useEmblem ? 'circle' : normalizeCollegeIconShape(item.iconShape)
  return {
    ...item,
    iconUrl,
    iconFitMode,
    iconShape,
    iconImageMode: iconFitMode === 'fill' ? 'aspectFill' : 'aspectFit',
    iconCircle: iconShape === 'circle',
    iconHasImage: Boolean(iconUrl)
  }
}

function decorateCollegeApps(list) {
  return Array.isArray(list) ? list.map(decorateCollegeApp) : []
}

function decorateHomeCollegeLists(lists) {
  const src = lists || {}
  return {
    ...src,
    collegeList: decorateCollegeApps(src.collegeList),
    collegeHome: decorateCollegeApps(src.collegeHome)
  }
}

module.exports = {
  SCHOOL_EMBLEM_SRC,
  normalizeCollegeIconFit,
  normalizeCollegeIconShape,
  resolveCollegeIconUrl,
  decorateCollegeApp,
  decorateCollegeApps,
  decorateHomeCollegeLists
}
