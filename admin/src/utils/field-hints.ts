/**
 * 字段推荐字数提示（宽存窄显：数据库上限宽松，小程序列表展示位严格）
 * 参考微信服务号/公众号、小商店等内容产品的常见运营规范。
 */
export const FIELD_HINTS = {
  listTitle: '小程序列表约显示 2 行，建议 12–20 字；详情页可展示完整标题。',
  newsSummary: '列表不展示摘要；建议 30–80 字作导读，详情页完整显示。',
  bannerTitle: '首页轮播固定高度，建议 8–15 字，关键词前置。',
  bannerDesc: '轮播副文案建议 15–30 字，一行能读完为佳。',
  hallName: '展馆卡片底部约 2 行，建议 20 字以内。',
  hallShortName: '封面白字区域，建议 4–8 字，如「交通博物馆」。',
  hallIntro: '列表仅 1 行预览，建议 30–60 字；详情页完整展示。',
  hallSectionTitle: '沉浸式章节导航，建议 8–16 字。',
  hallCaption: '图说在详情页展示，建议 20–40 字。',
  courseName: '课程列表约 2 行，建议 12–20 字。',
  courseIntro: '详情页滚动阅读，建议 200–500 字概括课程亮点。',
  craftName: '文创方卡标题，建议 8–16 字。',
  craftIntro: '列表仅 1 行预览；详情页完整展示中英文介绍。',
  activityTitle: '活动列表约 2 行，建议 12–20 字。',
  activityIntro: '活动详情页完整展示，建议 80–200 字。',
  activityLocation: '列表单行显示，建议 10–20 字。',
  categoryName: '分类标签较短即可，建议 4–10 字。',
  announcement: '首页公告条单行滚动，建议 20–40 字。',
  collegeName: '关联小程序卡片名，建议 8–16 字。',
  collegeDesc: '卡片简介，建议 30–60 字。',
  resourceName: '资源列表展示，建议 12–30 字。',
  editorBody: '正文在详情页完整展示；列表仅显示标题。'
} as const
