// utils/collegeIcon.js — 关联小程序图标：外形与裁切落到微信 image mode

function normalizeCollegeIconFit(mode) {
  return String(mode == null ? '' : mode).trim().toLowerCase() === 'fill' ? 'fill' : 'fit'
}

function normalizeCollegeIconShape(shape) {
  return String(shape == null ? '' : shape).trim().toLowerCase() === 'circle' ? 'circle' : 'square'
}

function decorateCollegeApp(item) {
  if (!item || typeof item !== 'object') return item
  const iconFitMode = normalizeCollegeIconFit(item.iconFitMode)
  const iconShape = normalizeCollegeIconShape(item.iconShape)
  return {
    ...item,
    iconFitMode,
    iconShape,
    iconImageMode: iconFitMode === 'fill' ? 'aspectFill' : 'aspectFit',
    iconCircle: iconShape === 'circle'
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
  normalizeCollegeIconFit,
  normalizeCollegeIconShape,
  decorateCollegeApp,
  decorateCollegeApps,
  decorateHomeCollegeLists
}
