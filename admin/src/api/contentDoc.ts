import { get, put } from './request'

export interface AboutConfig {
  intro: string
  address: string
  phone: string
  email: string
  icp: string
}

export interface SiteContent {
  privacy: string
  agreement: string
  about: AboutConfig
}

export interface SiteContentSave {
  privacy: string
  agreement: string
  intro: string
  address: string
  phone: string
  email: string
  icp: string
}

export function fetchContentDocs() {
  return get<SiteContent>('/admin/content-docs')
}

export function saveContentDocs(data: SiteContentSave) {
  return put<SiteContent>('/admin/content-docs', data)
}
