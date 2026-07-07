import axios from 'axios'
import { get } from './request'
import type { StatsOverview, StatsTrendItem, StatsModuleItem, StatsContentTopItem } from '@/types/api'
import { useAuthStore } from '@/stores/auth'

export function fetchStatsOverview() {
  return get<StatsOverview>('/admin/stats/overview')
}

export function fetchStatsTrend(days = 30) {
  return get<StatsTrendItem[]>('/admin/stats/trend', { days })
}

export function fetchStatsModules(days = 7) {
  return get<StatsModuleItem[]>('/admin/stats/modules', { days })
}

export function fetchStatsContentTop(targetType?: string, limit = 10) {
  return get<StatsContentTopItem[]>('/admin/stats/content/top', { targetType, limit })
}

/** 下载月度统计 Excel */
export async function exportStatsMonth(month?: string) {
  const auth = useAuthStore()
  const res = await axios.get('/api/v1/admin/stats/export', {
    params: { month },
    responseType: 'blob',
    headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
  })
  const blob = res.data as Blob
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `统计月报_${month || 'current'}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
