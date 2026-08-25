import { get } from './request'
import type { PageResult } from '@/types/api'

export interface SubscribeOutboxItem {
  id: number
  memberId: number
  scene: string
  status: string
  attemptCount: number
  lastError: string | null
  createTime: string
  updateTime: string
  sentAt: string
  nextRetryAt: string
}

export function fetchSubscribeOutbox(params: {
  page?: number
  size?: number
  status?: string
}) {
  return get<PageResult<SubscribeOutboxItem>>('/admin/subscribe-outbox', params as Record<string, unknown>)
}
