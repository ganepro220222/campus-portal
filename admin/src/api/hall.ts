import { get, post, put } from './request'
import type { HallItem, PageResult } from '@/types/api'

export function fetchHalls(page = 1, size = 20) {
  return get<PageResult<HallItem>>('/admin/halls', { page, size })
}

export function fetchHallDetail(id: number) {
  return get<HallItem>(`/admin/halls/${id}`)
}

export function createHall(data: Partial<HallItem>) {
  return post<HallItem>('/admin/halls', data)
}

export function updateHall(id: number, data: Partial<HallItem>) {
  return put<HallItem>(`/admin/halls/${id}`, data)
}
