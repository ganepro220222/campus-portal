import { get, put } from './request'
import type { FeedbackItem, PageResult } from '@/types/api'

export function fetchFeedbacks(page = 1, size = 20, status?: string) {
  return get<PageResult<FeedbackItem>>('/admin/feedbacks', { page, size, status })
}

export function fetchFeedback(id: number) {
  return get<FeedbackItem>(`/admin/feedbacks/${id}`)
}

export function replyFeedback(id: number, reply: string) {
  return put<FeedbackItem>(`/admin/feedbacks/${id}/reply`, { reply })
}
