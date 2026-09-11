import { fetchActivities } from '@/api/activity'
import { fetchCourses } from '@/api/course'
import { fetchCrafts } from '@/api/craft'
import { fetchHalls } from '@/api/hall'
import { fetchNews } from '@/api/news'
import { loadAllPagedRecords } from '@/utils/pagedRecords.mjs'

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
  { value: 'news', label: '动态详情' },
  { value: 'course', label: '课程详情' },
  { value: 'hall', label: '展馆详情' },
  { value: 'activity', label: '活动详情' },
  { value: 'craft', label: '文创详情' },
  { value: 'url', label: '外部网页' }
]

export const BANNER_FIXED_PAGE_OPTIONS: BannerLinkOption[] = [
  { value: 'home', label: '首页' },
  { value: 'news', label: '动态频道' },
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
  // 100 是单页条数，不是总上限；由 loadAllPagedRecords 翻完全部已发布 / 已上架内容。
  const size = 100
  switch (type) {
    case 'news': {
      const records = await loadAllPagedRecords(
        (page, pageSize) => fetchNews({ page, size: pageSize, status: 'published' }),
        size
      )
      return records.map((item) => ({
        value: String(item.id),
        label: item.title
      }))
    }
    case 'course': {
      const records = await loadAllPagedRecords(
        (page, pageSize) => fetchCourses({ page, size: pageSize, status: 1 }),
        size
      )
      return records.map((item) => ({
        value: String(item.id),
        label: item.name
      }))
    }
    case 'hall': {
      const records = await loadAllPagedRecords(
        (page, pageSize) => fetchHalls(page, pageSize),
        size
      )
      return records
        .filter((item) => item.status === 1)
        .map((item) => ({
          value: String(item.id),
          label: item.name
        }))
    }
    case 'activity': {
      const records = await loadAllPagedRecords(
        (page, pageSize) => fetchActivities({ page, size: pageSize, status: 'published' }),
        size
      )
      return records.map((item) => ({
        value: String(item.id),
        label: item.title
      }))
    }
    case 'craft': {
      const records = await loadAllPagedRecords(
        (page, pageSize) => fetchCrafts({ page, size: pageSize, status: 1 }),
        size
      )
      return records.map((item) => ({
        value: String(item.id),
        label: item.name
      }))
    }
    default:
      return []
  }
}
