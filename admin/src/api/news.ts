import { get, post, put, del } from './request'
import type { NewsItem, PageResult } from '@/types/api'

export interface NewsQuery {
  page?: number
  size?: number
  status?: string
  categoryId?: number
}

export function fetchNews(params: NewsQuery) {
  return get<PageResult<NewsItem>>('/admin/news', params as Record<string, unknown>)
}

export function createNews(data: Partial<NewsItem>) {
  return post<NewsItem>('/admin/news', data)
}

export function updateNews(id: number, data: Partial<NewsItem>) {
  return put<NewsItem>(`/admin/news/${id}`, data)
}

export function publishNews(id: number) {
  return put<NewsItem>(`/admin/news/${id}/publish`)
}

export function unpublishNews(id: number) {
  return put<NewsItem>(`/admin/news/${id}/unpublish`)
}

export function removeNews(id: number) {
  return del<void>(`/admin/news/${id}`)
}
