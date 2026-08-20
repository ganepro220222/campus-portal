import { del, get, post, put } from './request'
import type { NavItemRecord, PageResult } from '@/types/api'

export function fetchNavItems(page = 1, size = 20) {
  return get<PageResult<NavItemRecord>>('/admin/nav-items', { page, size })
}

export function createNavItem(data: Partial<NavItemRecord>) {
  return post<NavItemRecord>('/admin/nav-items', data)
}

export function updateNavItem(id: number, data: Partial<NavItemRecord>) {
  return put<NavItemRecord>(`/admin/nav-items/${id}`, data)
}

export function removeNavItem(id: number) {
  return del<void>(`/admin/nav-items/${id}`)
}
