import type { HomeRecommendModule } from '@/types/api'

export interface HomeRecommendSection {
  moduleType: HomeRecommendModule
  title: string
  addLabel: string
  empty: string
  softLimit: number
}

/** 与小程序首页三块顺序一致；条数为建议上限，超出只提醒 */
export const HOME_RECOMMEND_SECTIONS: HomeRecommendSection[] = [
  { moduleType: 'hall', title: '线上展馆', addLabel: '添加展馆', empty: '暂无展馆推荐，首页该板块为空', softLimit: 6 },
  { moduleType: 'news', title: '最新动态', addLabel: '添加动态', empty: '暂无动态推荐，首页该板块为空', softLimit: 3 },
  { moduleType: 'course', title: '热门课程', addLabel: '添加课程', empty: '暂无课程推荐，首页该板块为空', softLimit: 2 }
]

export function nextRecommendSort(sorts: number[]): number {
  if (!sorts.length) {
    return 0
  }
  return Math.min(999, Math.max(...sorts) + 1)
}
