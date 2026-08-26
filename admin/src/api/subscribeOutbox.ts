import { get, post } from './request'
import type { PageResult } from '@/types/api'

export interface SubscribeOutboxItem {
  id: number
  memberId: number
  /** 接收人：姓名（学号），查不到时退到学号或「用户 N」 */
  receiver: string
  /** 活动名称，取自 payload；解析不出时为空串 */
  activityTitle: string
  scene: string
  status: string
  attemptCount: number
  lastError: string | null
  /** 归一化后的失败原因码，前端据此给出人话与处置指引 */
  reasonCode: string
  /** 是否允许「重新发送」（仅 failed / skipped） */
  canRetry: boolean
  createTime: string
  updateTime: string
  sentAt: string
  nextRetryAt: string
}

/** status 传 'attention' 表示「失败 + 已跳过」，是页面默认视图 */
export function fetchSubscribeOutbox(params: {
  page?: number
  size?: number
  status?: string
}) {
  return get<PageResult<SubscribeOutboxItem>>('/admin/subscribe-outbox', params as Record<string, unknown>)
}

/** 把一条失败/跳过的记录放回队列，后台每分钟的 worker 会重新投递 */
export function retrySubscribeOutbox(id: number) {
  return post<void>(`/admin/subscribe-outbox/${id}/retry`)
}
