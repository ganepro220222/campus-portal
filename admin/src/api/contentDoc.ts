import { get, put } from './request'

export interface ContentDocs {
  privacy: string
  agreement: string
}

export function fetchContentDocs() {
  return get<ContentDocs>('/admin/content-docs')
}

export function saveContentDocs(data: ContentDocs) {
  return put<ContentDocs>('/admin/content-docs', data)
}
