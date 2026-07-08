import { del, get, post, put } from './request'
import type { PageResult } from '@/types/api'

export interface CollegeAppItem {
  id: number
  name: string
  appid?: string
  path?: string
  iconUrl?: string
  description?: string
  sort: number
  status: number
  contentType: string
  contentTypeLabel: string
  contentUrl?: string
  hasApiToken?: boolean
}

export function fetchColleges(page = 1, size = 20) {
  return get<PageResult<CollegeAppItem>>('/admin/colleges', { page, size })
}

export function createCollege(data: Partial<CollegeAppItem>) {
  return post<CollegeAppItem>('/admin/colleges', data)
}

export function updateCollege(id: number, data: Partial<CollegeAppItem>) {
  return put<CollegeAppItem>(`/admin/colleges/${id}`, data)
}

export function deleteCollege(id: number) {
  return del<void>(`/admin/colleges/${id}`)
}
