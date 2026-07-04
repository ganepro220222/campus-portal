import { get, post, put } from './request'
import type { PageResult, ResourceItem } from '@/types/api'

export interface ResourceQuery {
  page?: number
  size?: number
  categoryId?: number
  fileType?: string
  status?: number
}

export interface ResourceSavePayload {
  name: string
  fileUrl: string
  previewUrl?: string
  fileType: string
  fileSizeKb?: number
  categoryId?: number
  status?: number
}

/** 支持的文件格式（与 docs 资源下载模块一致） */
export const FILE_TYPE_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'word', label: 'Word' },
  { value: 'ppt', label: 'PPT' },
  { value: 'mp4', label: '视频 MP4' },
  { value: 'mp3', label: '音频 MP3' }
]

export function fetchResources(params: ResourceQuery) {
  return get<PageResult<ResourceItem>>('/admin/resources', params as Record<string, unknown>)
}

export function fetchResource(id: number) {
  return get<ResourceItem>(`/admin/resources/${id}`)
}

export function createResource(data: ResourceSavePayload) {
  return post<ResourceItem>('/admin/resources', data)
}

export function updateResource(id: number, data: ResourceSavePayload) {
  return put<ResourceItem>(`/admin/resources/${id}`, data)
}

/** 上架资源选项（供课程配套资源多选） */
export async function fetchResourceOptions() {
  const res = await fetchResources({ page: 1, size: 200, status: 1 })
  return res.records.map((r) => ({
    id: r.id,
    name: r.name,
    fileType: r.fileType,
    categoryName: r.categoryName
  }))
}
