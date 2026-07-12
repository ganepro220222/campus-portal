import { fetchActivities } from '@/api/activity'
import { fetchCourses } from '@/api/course'
import { fetchCrafts } from '@/api/craft'
import { fetchHalls } from '@/api/hall'
import { fetchNews } from '@/api/news'

export type BannerLinkType =
  | 'none'
  | 'fixed'
  | 'news'
  | 'course'
  | 'hall'
  | 'activity'
  | 'craft'
  | 'url'
  | 'page'

export interface BannerLinkOption {
  value: string
  label: string
}

export const BANNER_LINK_TYPE_OPTIONS: BannerLinkOption[] = [
  { value: 'none', label: '无跳转' },
  { value: 'fixed', label: '频道页面' },
  { value: 'news', label: '新闻详情' },
  { value: 'course', label: '课程详情' },
  { value: 'hall', label: '展馆详情' },
  { value: 'activity', label: '活动详情' },
  { value: 'craft', label: '文创详情' },
  { value: 'url', label: '外部网页' }
]

export const BANNER_FIXED_PAGE_OPTIONS: BannerLinkOption[] = [
  { value: 'home', label: '首页' },
  { value: 'news', label: '新闻频道' },
  { value: 'hall', label: '展馆频道' },
  { value: 'course', label: '课程频道' },
  { value: 'activity', label: '活动报名' }
]

const CONTENT_TYPES = new Set(['news', 'course', 'hall', 'activity', 'craft'])

export function isBannerContentType(type: string): boolean {
  return CONTENT_TYPES.has(type)
}

export function bannerLinkTypeLabel(type: string): string {
  return BANNER_LINK_TYPE_OPTIONS.find((o) => o.value === type)?.label
    || (type === 'page' ? '自定义页面（旧）' : type)
}

export async function loadBannerContentOptions(type: BannerLinkType): Promise<BannerLinkOption[]> {
  const size = 100
  switch (type) {
    case 'news': {
      const res = await fetchNews({ page: 1, size, status: 'published' })
      return res.records.map((item) => ({
        value: String(item.id),
        label: item.title
      }))
    }
    case 'course': {
      const res = await fetchCourses({ page: 1, size, status: 1 })
      return res.records.map((item) => ({
        value: String(item.id),
        label: item.name
      }))
    }
    case 'hall': {
      const res = await fetchHalls(1, size)
      return res.records
        .filter((item) => item.status === 1)
        .map((item) => ({
          value: String(item.id),
          label: item.name
        }))
    }
    case 'activity': {
      const res = await fetchActivities({ page: 1, size, status: 'published' })
      return res.records.map((item) => ({
        value: String(item.id),
        label: item.title
      }))
    }
    case 'craft': {
      const res = await fetchCrafts({ page: 1, size, status: 1 })
      return res.records.map((item) => ({
        value: String(item.id),
        label: item.name
      }))
    }
    default:
      return []
  }
}
