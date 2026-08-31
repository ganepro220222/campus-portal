import { get, post } from './request'
import type { RequestConfig } from './request'

export interface UploadResult {
  url: string
  objectKey: string
}

export interface UploadCapabilities {
  directUploadEnabled: boolean
  videoMaxBytes: number
  proxyMaxBytes: number
  imageMaxBytes: number
  subtitleMaxBytes: number
}

export interface DirectPolicy {
  host: string
  bucket: string
  key: string
  policy: string
  accessKeyId: string
  signature: string
  successActionStatus: string
  expireAt: string
}

/** 小文件（封面等）保持 2 分钟；视频/大文件与 Nginx 上传段对齐 15 分钟。 */
export const UPLOAD_TIMEOUT_MS = 120_000
export const LARGE_UPLOAD_TIMEOUT_MS = 900_000
export const LARGE_UPLOAD_BYTES = 20 * 1024 * 1024
export const DIRECT_UPLOAD_TIMEOUT_MS = 60 * 60 * 1000
export const DIRECT_UPLOAD_DISABLED = 'OSS_DIRECT_UPLOAD_DISABLED'

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

export function fetchUploadCapabilities(): Promise<UploadCapabilities> {
  return get<UploadCapabilities>('/admin/upload/capabilities', undefined, { silent: true })
}

export function fetchDirectPolicy(scene: string, fileName: string, size: number): Promise<DirectPolicy> {
  return post<DirectPolicy>('/admin/upload/direct-policy', { scene, fileName, size }, { silent: true } as RequestConfig)
}

export function completeDirectUpload(scene: string, objectKey: string, size: number): Promise<UploadResult> {
  return post<UploadResult>('/admin/upload/complete', { scene, objectKey, size }, { timeout: 120_000 })
}

export function isDirectUploadDisabledError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }
  const body = error as { errorKey?: string; code?: number }
  return body.errorKey === DIRECT_UPLOAD_DISABLED || body.code === 503
}

/** 浏览器把文件 POST 到 OSS，不经过 ECS。 */
export function postFileToOss(
  policy: DirectPolicy,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('key', policy.key)
    form.append('policy', policy.policy)
    form.append('OSSAccessKeyId', policy.accessKeyId)
    form.append('signature', policy.signature)
    form.append('success_action_status', policy.successActionStatus || '204')
    form.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', policy.host)
    xhr.timeout = DIRECT_UPLOAD_TIMEOUT_MS
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable || event.total <= 0) {
        return
      }
      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)))
    }
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 204) {
        onProgress?.(100)
        resolve()
        return
      }
      reject(new Error('oss-direct-http-' + xhr.status))
    }
    xhr.onerror = () => reject(new Error('oss-direct-network'))
    xhr.ontimeout = () => reject(new Error('oss-direct-timeout'))
    xhr.send(form)
  })
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
