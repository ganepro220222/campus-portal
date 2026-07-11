/** 封面展示模式：与后端 cover_fit_mode 一致 */
export type CoverFitMode = 'fill' | 'fit'

/** 各业务场景的封面槽位，用于比例提示 */
export type CoverSlot =
  | 'courseList'
  | 'newsList'
  | 'hallList'
  | 'craftList'
  | 'activityHero'
  | 'banner'

export const COVER_FIT_OPTIONS: { value: CoverFitMode; label: string; desc: string }[] = [
  { value: 'fill', label: '裁切填满', desc: '铺满卡片，可能裁掉边缘，适合主体居中的横图' },
  { value: 'fit', label: '完整显示', desc: '不裁切，可能留空白边，适合竖图或含文字边距的封面' }
]

export const COVER_ASPECT_HINTS: Record<CoverSlot, string> = {
  courseList: '课程列表为方卡（约 1:1）。建议 1:1 或 4:3，主体居中；竖图请选「完整显示」。',
  newsList: '新闻列表约 1.4:1 横条。建议 4:3 或 16:9 横图，标题信息勿贴边。',
  hallList: '展馆卡片为横条封面。建议 4:3 或 16:9，主体居中。',
  craftList: '文创列表为方卡。建议 1:1 或 4:3。',
  activityHero: '活动详情顶图为宽幅区域。建议 16:9 或 2:1 横图。',
  banner: '首页轮播约 2:1 宽幅。建议横图，文字安全区居中。'
}
