import { del, get, post, put } from './request'
import type { AnnouncementItem, PageResult } from '@/types/api'

export interface AnnouncementSavePayload {
  content: string
  linkUrl?: string
  sort?: number
  isScroll?: number
  startTime?: string
  endTime?: string
  status?: number
}

export function fetchAnnouncements(page = 1, size = 20) {
  return get<PageResult<AnnouncementItem>>('/admin/announcements', { page, size })
}

export function fetchAnnouncement(id: number) {
  return get<AnnouncementItem>(`/admin/announcements/${id}`)
}

export function createAnnouncement(data: AnnouncementSavePayload) {
  return post<AnnouncementItem>('/admin/announcements', data)
}

export function updateAnnouncement(id: number, data: AnnouncementSavePayload) {
  return put<AnnouncementItem>(`/admin/announcements/${id}`, data)
}

export function removeAnnouncement(id: number) {
  return del<void>(`/admin/announcements/${id}`)
}
