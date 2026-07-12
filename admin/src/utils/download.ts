import axios from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResult } from '@/types/api'
import { useAuthStore } from '@/stores/auth'

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

/**
 * 下载二进制文件（Excel 等），不走 JSON 响应拦截器
 */
export async function downloadFile(
  url: string,
  fallbackName = 'download.xlsx',
  params?: Record<string, unknown>
) {
  const auth = useAuthStore()
  try {
    const res = await axios.get(url, {
      baseURL: '/api/v1',
      responseType: 'blob',
      timeout: 60000,
      params,
      headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
    })

    const blob = res.data as Blob
    if (blob.type.includes('application/json')) {
      const text = await blob.text()
      const body = JSON.parse(text) as ApiResult
      ElMessage.error(body.message || '下载失败')
      return
    }

    const name = parseFilename(res.headers['content-disposition']) || fallbackName
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = name
    link.click()
    URL.revokeObjectURL(link.href)
  } catch {
    ElMessage.error('导出失败，请检查网络或权限')
  }
}
