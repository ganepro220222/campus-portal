import { get, post, put } from './request'
import type { ActivityItem, EnrollItem, PageResult } from '@/types/api'

export interface ActivityQuery {
  page?: number
  size?: number
  status?: string
}

export interface ActivitySavePayload {
  title: string
  cover?: string
  intro?: string
  location?: string
  startTime?: string
  endTime?: string
  enrollStartTime?: string
  enrollEndTime?: string
  quota?: number
  needReview?: number
}

export interface EnrollQuery {
  page?: number
  size?: number
  status?: string
}

export function fetchActivities(params: ActivityQuery) {
  return get<PageResult<ActivityItem>>('/admin/activities', params as Record<string, unknown>)
}

export function fetchActivity(id: number) {
  return get<ActivityItem>(`/admin/activities/${id}`)
}

export function createActivity(data: ActivitySavePayload) {
  return post<ActivityItem>('/admin/activities', data)
}

export function updateActivity(id: number, data: ActivitySavePayload) {
  return put<ActivityItem>(`/admin/activities/${id}`, data)
}

export function publishActivity(id: number) {
  return put<ActivityItem>(`/admin/activities/${id}/publish`)
}

export function cancelActivity(id: number) {
  return put<ActivityItem>(`/admin/activities/${id}/cancel`)
}

export function fetchEnrolls(activityId: number, params: EnrollQuery) {
  return get<PageResult<EnrollItem>>(
    `/admin/activities/${activityId}/enrolls`,
    params as Record<string, unknown>
  )
}

export function approveEnroll(enrollId: number) {
  return put<EnrollItem>(`/admin/enrolls/${enrollId}/approve`)
}

export function rejectEnroll(enrollId: number, reason?: string) {
  return put<EnrollItem>(`/admin/enrolls/${enrollId}/reject`, reason ? { reason } : {})
}
