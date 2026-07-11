import { del, get, post, put } from './request'
import type { CategoryItem, CategoryOption } from '@/types/api'

export type CategoryType = 'news' | 'hall' | 'craft' | 'course' | 'resource'

/** 分类列表（公开读接口，供表单下拉使用） */
export function fetchCategories(type: CategoryType) {
  return get<CategoryOption[]>('/categories', { type })
}

/** 管理端分类列表（含停用项） */
export function fetchAdminCategories(type: CategoryType) {
  return get<CategoryItem[]>('/admin/categories', { type })
}

export function createCategory(data: Partial<CategoryItem>) {
  return post<CategoryItem>('/admin/categories', data)
}

export function updateCategory(id: number, data: Partial<CategoryItem>) {
  return put<CategoryItem>(`/admin/categories/${id}`, data)
}

export function removeCategory(id: number) {
  return del(`/admin/categories/${id}`)
}

export const CATEGORY_TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: 'news', label: '新闻' },
  { value: 'hall', label: '展馆' },
  { value: 'craft', label: '文创' },
  { value: 'course', label: '课程' },
  { value: 'resource', label: '资源' }
]
