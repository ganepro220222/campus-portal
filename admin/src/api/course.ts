import { get, post, put } from './request'
import type { CourseItem, PageResult } from '@/types/api'

export interface CourseQuery {
  page?: number
  size?: number
  categoryId?: number
  status?: number
}

export interface CourseSavePayload {
  name: string
  cover?: string
  categoryId?: number
  targetAudience?: string
  durationMinutes?: number
  startTime?: string
  intro?: string
  videoUrl?: string
  subtitleUrl?: string
  status?: number
  resourceIds?: number[]
}

export interface SubtitleStatus {
  courseId: number
  subtitleStatus: string
  subtitleStatusLabel: string
  subtitleUrl: string | null
  subtitleTaskId: string | null
  videoUrl: string | null
}

export function fetchCourses(params: CourseQuery) {
  return get<PageResult<CourseItem>>('/admin/courses', params as Record<string, unknown>)
}

export function fetchCourse(id: number) {
  return get<CourseItem>(`/admin/courses/${id}`)
}

export function createCourse(data: CourseSavePayload) {
  return post<CourseItem>('/admin/courses', data)
}

export function updateCourse(id: number, data: CourseSavePayload) {
  return put<CourseItem>(`/admin/courses/${id}`, data)
}

export function publishCourse(id: number) {
  return put<CourseItem>(`/admin/courses/${id}/publish`)
}

export function unpublishCourse(id: number) {
  return put<CourseItem>(`/admin/courses/${id}/unpublish`)
}

export function triggerSubtitle(id: number) {
  return post<SubtitleStatus>(`/admin/courses/${id}/subtitle/trigger`)
}

export function fetchSubtitleStatus(id: number) {
  return get<SubtitleStatus>(`/admin/courses/${id}/subtitle/status`)
}

export function updateSubtitle(id: number, subtitleUrl: string) {
  return put<SubtitleStatus>(`/admin/courses/${id}/subtitle`, { subtitleUrl })
}
