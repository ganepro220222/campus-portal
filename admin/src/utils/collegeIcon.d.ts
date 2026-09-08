declare module '@/utils/collegeIcon.mjs' {
  export const COLLEGE_ICON_FIT_FIT: 'fit'
  export const COLLEGE_ICON_FIT_FILL: 'fill'
  export const COLLEGE_ICON_SHAPE_SQUARE: 'square'
  export const COLLEGE_ICON_SHAPE_CIRCLE: 'circle'
  export function normalizeCollegeIconFit(mode: unknown): 'fill' | 'fit'
  export function normalizeCollegeIconShape(shape: unknown): 'square' | 'circle'
}
