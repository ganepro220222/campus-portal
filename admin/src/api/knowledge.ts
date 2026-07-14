import { del, get, post, put } from './request'
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

export interface KnowledgeDocDetail extends KnowledgeDocItem {
  content: string
  /** 正文是否由历史分段近似还原（旧库无 content 时为 true） */
  contentRecovered?: boolean
}

export interface KnowledgeChunkItem {
  chunkIndex: number
  chunkText: string
  keywords: string
  charCount: number
}

export interface KnowledgeHit {
  docId: number
  docTitle: string
  chunkIndex: number
  chunkText: string
  score: number
}

export function fetchKnowledgeDocs(page = 1, size = 20) {
  return get<PageResult<KnowledgeDocItem>>('/admin/knowledge/docs', { page, size })
}

export function fetchKnowledgeDocDetail(id: number) {
  return get<KnowledgeDocDetail>(`/admin/knowledge/docs/${id}`)
}

export function createKnowledgeDoc(data: { title: string; content: string }) {
  return post<KnowledgeDocItem>('/admin/knowledge/docs', data)
}

export function updateKnowledgeDoc(id: number, data: { title: string; content: string }) {
  return put<KnowledgeDocItem>(`/admin/knowledge/docs/${id}`, data)
}

/** 启用 / 停用：停用后不参与 AI 检索，保留文档可随时启用 */
export function setKnowledgeDocEnabled(id: number, enabled: boolean) {
  return put<KnowledgeDocItem>(`/admin/knowledge/docs/${id}/enabled?enabled=${enabled}`)
}

export function fetchKnowledgeChunks(id: number) {
  return get<KnowledgeChunkItem[]>(`/admin/knowledge/docs/${id}/chunks`)
}

export function testKnowledgeRetrieve(q: string, topK = 5) {
  return get<KnowledgeHit[]>('/admin/knowledge/docs/retrieve-test', { q, topK })
}

export function deleteKnowledgeDoc(id: number) {
  return del<void>(`/admin/knowledge/docs/${id}`)
}
