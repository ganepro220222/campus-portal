/**
 * 关联小程序图标展示：与后台保存、小程序卡片同一套取值。
 * 默认完整显示 + 方形，避免已上架的方图被改成裁切或圆形。
 */

export const COLLEGE_ICON_FIT_FIT = 'fit'
export const COLLEGE_ICON_FIT_FILL = 'fill'
export const COLLEGE_ICON_SHAPE_SQUARE = 'square'
export const COLLEGE_ICON_SHAPE_CIRCLE = 'circle'

export function normalizeCollegeIconFit(mode) {
  return String(mode == null ? '' : mode).trim().toLowerCase() === COLLEGE_ICON_FIT_FILL
    ? COLLEGE_ICON_FIT_FILL
    : COLLEGE_ICON_FIT_FIT
}

export function normalizeCollegeIconShape(shape) {
  return String(shape == null ? '' : shape).trim().toLowerCase() === COLLEGE_ICON_SHAPE_CIRCLE
    ? COLLEGE_ICON_SHAPE_CIRCLE
    : COLLEGE_ICON_SHAPE_SQUARE
}
