import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResult } from '@/types/api'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import { interpretDownloadErrorBody } from '@/utils/downloadOutcome.mjs'

/** 从 Content-Disposition 解析文件名 */
function parseFilename(header?: string): string | null {
  if (!header) return null
  const star = header.match(/filename\*=utf-8''([^;]+)/i)
  if (star) {
    try {
      return decodeURIComponent(star[1])
    } catch {
      return star[1]
    }
  }
  const plain = header.match(/filename="?([^";]+)"?/i)
  return plain ? plain[1] : null
}

function logoutOnUnauthorized() {
  const auth = useAuthStore()
  auth.logout()
  router.push({ name: 'Login' })
  ElMessage.error('登录已过期')
}

async function handleErrorBlob(blob: Blob): Promise<boolean> {
  if (!blob.type.includes('application/json')) {
    return false
  }
  try {
    const body = JSON.parse(await blob.text()) as ApiResult
    const interpreted = interpretDownloadErrorBody(body)
    if (interpreted.kind === 'unauthorized') {
      logoutOnUnauthorized()
      return true
    }
    if (interpreted.kind === 'rateLimited') {
      ElMessage.warning({ message: interpreted.message || '操作过于频繁', duration: 4000 })
      return true
    }
    if (interpreted.kind === 'error') {
      ElMessage.error(interpreted.message || '下载失败')
      return true
    }
    return false
  } catch {
    return false
  }
}

function triggerDownload(blob: Blob, name: string) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = name
  link.click()
  URL.revokeObjectURL(link.href)
}

async function requestDownload(options: {
  method: 'get' | 'post'
  url: string
  fallbackName: string
  params?: Record<string, unknown>
  data?: unknown
}): Promise<boolean> {
  const auth = useAuthStore()
  try {
    const res = await axios({
      method: options.method,
      url: options.url,
      baseURL: '/api/v1',
      responseType: 'blob',
      timeout: 60000,
      params: options.params,
      data: options.data,
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
    })

    const blob = res.data as Blob
    if (await handleErrorBlob(blob)) {
      return false
    }
    const name = parseFilename(res.headers['content-disposition']) || options.fallbackName
    triggerDownload(blob, name)
    return true
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      if (err.response.status === 401) {
        logoutOnUnauthorized()
        return false
      }
      const data = err.response.data
      if (data instanceof Blob && (await handleErrorBlob(data))) {
        return false
      }
    }
    ElMessage.error('导出失败，请检查网络或权限')
    return false
  }
}

/**
 * 下载二进制文件（Excel 等），不走 JSON 响应拦截器
 */
export async function downloadFile(
  url: string,
  fallbackName = 'download.xlsx',
  params?: Record<string, unknown>
): Promise<boolean> {
  return requestDownload({ method: 'get', url, fallbackName, params })
}

export async function downloadFilePost(
  url: string,
  fallbackName = 'download.xlsx',
  data?: unknown
): Promise<boolean> {
  return requestDownload({ method: 'post', url, fallbackName, data })
}
