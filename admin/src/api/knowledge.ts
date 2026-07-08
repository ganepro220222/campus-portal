import { del, get, post } from './request'
import type { PageResult } from '@/types/api'

export interface KnowledgeDocItem {
  id: number
  title: string
  status: string
  statusLabel: string
  charCount: number
  chunkCount: number
  createdAt: string
}

export function fetchKnowledgeDocs(page = 1, size = 20) {
  return get<PageResult<KnowledgeDocItem>>('/admin/knowledge/docs', { page, size })
}

export function createKnowledgeDoc(data: { title: string; content: string }) {
  return post<KnowledgeDocItem>('/admin/knowledge/docs', data)
}

export function deleteKnowledgeDoc(id: number) {
  return del<void>(`/admin/knowledge/docs/${id}`)
}
