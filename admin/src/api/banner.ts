import { del, get, post, put } from './request'
import type { BannerItem, PageResult } from '@/types/api'

export function fetchBanners(page = 1, size = 20) {
  return get<PageResult<BannerItem>>('/admin/banners', { page, size })
}

export function createBanner(data: Partial<BannerItem>) {
  return post<BannerItem>('/admin/banners', data)
}

export function updateBanner(id: number, data: Partial<BannerItem>) {
  return put<BannerItem>(`/admin/banners/${id}`, data)
}

export function removeBanner(id: number) {
  return del<void>(`/admin/banners/${id}`)
}
