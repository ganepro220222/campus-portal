import { post } from './request'

export interface UploadResult {
  url: string
  objectKey: string
}

/** 管理端媒体上传（OSS 中转） */
export function uploadFile(file: File, scene: string): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('scene', scene)
  return post<UploadResult>('/admin/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000
  })
}
