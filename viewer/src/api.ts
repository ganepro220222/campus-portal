import type { ViewerConfig } from './types'

interface ApiResult<T> {
  code: number
  message?: string
  data: T
}

/** 与后端同域部署时用相对路径；也可通过 VITE_API_BASE 覆盖 */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') || '/api/v1'

export async function fetchViewerConfig(craftId: number): Promise<ViewerConfig> {
  const res = await fetch(`${API_BASE}/crafts/${craftId}/viewer`, {
    headers: { Accept: 'application/json' }
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  const body = (await res.json()) as ApiResult<ViewerConfig>
  if (body.code !== 200 || !body.data) {
    throw new Error(body.message || '接口返回异常')
  }
  return body.data
}

export function parseCraftId(): number | null {
  const q = new URLSearchParams(location.search).get('id')
  if (q && /^\d+$/.test(q)) return Number(q)
  const m = location.pathname.match(/\/craft\/(\d+)\/?$/)
  if (m) return Number(m[1])
  return null
}
