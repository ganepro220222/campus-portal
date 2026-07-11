import { post } from '@/api/request'

export type AiPolishAction = 'polish' | 'expand' | 'summarize' | 'title'

export interface AiPolishResult {
  action: AiPolishAction
  content: string
  fallback?: boolean
}

export function polishContent(action: AiPolishAction, content: string, tone = 'cultural') {
  return post<AiPolishResult>('/admin/ai/polish', { action, content, tone })
}
