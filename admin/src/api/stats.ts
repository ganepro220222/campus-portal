import { get } from './request'
import type { StatsOverview, StatsTrendItem, StatsModuleItem, StatsContentTopItem } from '@/types/api'
import { downloadFile } from '@/utils/download'

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
export function exportStatsMonth(month?: string) {
  return downloadFile('/admin/stats/export', `统计月报_${month || 'current'}.xlsx`, { month })
}
