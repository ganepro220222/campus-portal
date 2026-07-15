import { get, post, put, del } from './request'
import type { CraftItem, PageResult } from '@/types/api'

export interface CraftQuery {
  page?: number
  size?: number
  categoryId?: number
  status?: number
}

export interface CraftImagePayload {
  imageUrl: string
  angleLabel?: string
  sort?: number
}

export interface CraftContactPayload {
  phone?: string
  wechat?: string
  workWechat?: string
  email?: string
}

export interface CraftSavePayload {
  name: string
  cover?: string
  categoryId?: number
  introZh?: string
  introEn?: string
  previewType?: string
  sort?: number
  status?: number
  images?: CraftImagePayload[]
  contact?: CraftContactPayload
}

export function fetchCrafts(params: CraftQuery) {
  return get<PageResult<CraftItem>>('/admin/crafts', params as Record<string, unknown>)
}

export function fetchCraft(id: number) {
  return get<CraftItem>(`/admin/crafts/${id}`)
}

export function createCraft(data: CraftSavePayload) {
  return post<CraftItem>('/admin/crafts', data)
}

export function updateCraft(id: number, data: CraftSavePayload) {
  return put<CraftItem>(`/admin/crafts/${id}`, data)
}

export function publishCraft(id: number) {
  return put<CraftItem>(`/admin/crafts/${id}/publish`)
}

export function unpublishCraft(id: number) {
  return put<CraftItem>(`/admin/crafts/${id}/unpublish`)
}

export function removeCraft(id: number) {
  return del<void>(`/admin/crafts/${id}`)
}
