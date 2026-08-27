import { post } from '@/api/request'

export type AiPolishAction = 'polish' | 'expand' | 'summarize' | 'title'

export interface AiPolishResult {
  action: AiPolishAction
  content: string
  fallback?: boolean
  /** 每位管理员每天可用次数；润色/扩写/摘要/标题共用这一个额度 */
  dailyLimit?: number
  /** 含本次在内扣完后的剩余次数 */
  remainingToday?: number
}

export function polishContent(action: AiPolishAction, content: string, tone = 'cultural') {
  return post<AiPolishResult>('/admin/ai/polish', { action, content, tone })
}
