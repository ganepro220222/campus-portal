import { get, post } from './request'

export interface UploadResult {
  url: string
  objectKey: string
}

/** 小文件（封面等）保持 2 分钟；视频/大文件与 Nginx 上传段对齐 15 分钟。 */
export const UPLOAD_TIMEOUT_MS = 120_000
export const LARGE_UPLOAD_TIMEOUT_MS = 900_000
export const LARGE_UPLOAD_BYTES = 20 * 1024 * 1024

export function uploadTimeoutMs(file: File, scene: string): number {
  const videoScene = scene === 'video' || scene === 'course' || scene === 'resource' || scene === 'resource_file'
  if (videoScene || file.size > LARGE_UPLOAD_BYTES) {
    return LARGE_UPLOAD_TIMEOUT_MS
  }
  return UPLOAD_TIMEOUT_MS
}

/** CDN 开启 URL 鉴权后，落库的裸地址直接播放会 403；预览前换取短时签名地址 */
export function fetchPreviewUrl(url: string): Promise<string> {
  return get<{ url: string }>('/admin/upload/preview-url', { url }, { silent: true })
    .then((r) => r.url || url)
}

/** 管理端媒体上传（OSS 中转） */
export function uploadFile(file: File, scene: string): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('scene', scene)
  return post<UploadResult>('/admin/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: uploadTimeoutMs(file, scene)
  })
}
