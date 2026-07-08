import { get } from './request'
import type { PageResult } from '@/types/api'

export interface SysLogItem {
  id: number
  userId: number
  operatorName: string
  action: string
  target: string
  ip: string
  createdAt: string
}

export interface SysLogQuery {
  page?: number
  size?: number
  userId?: number
  keyword?: string
  startDate?: string
  endDate?: string
}

/** 操作审计日志分页查询（仅超管） */
export function fetchSysLogs(params: SysLogQuery) {
  return get<PageResult<SysLogItem>>('/admin/sys-logs', params as Record<string, unknown>)
}
