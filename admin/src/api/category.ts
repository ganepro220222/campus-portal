import { get } from './request'
import type { CategoryOption } from '@/types/api'

/** 分类列表（公开读接口，供表单下拉使用） */
export function fetchCategories(type: 'news' | 'hall' | 'course' | 'craft' | 'resource') {
  return get<CategoryOption[]>('/categories', { type })
}
