import { get, put, del } from './request'

export interface RecycleSummary {
  type: string
  label: string
  count: number
}

export interface RecycleItem {
  id: number
  name: string
  deletedTime: string
  type: string
  typeLabel: string
}

export function fetchRecycleSummary() {
  return get<RecycleSummary[]>('/admin/recycle-bin/summary')
}

export function fetchRecycleItems(type: string) {
  return get<RecycleItem[]>('/admin/recycle-bin', { type })
}

export function restoreRecycleItem(type: string, id: number) {
  return put<void>(`/admin/recycle-bin/${type}/${id}/restore`)
}

/** 彻底删除的风险档位：低危二次确认即可，高危要超管密码，受阻要先迁走依赖 */
export type DeleteRisk = 'LOW' | 'HIGH' | 'BLOCKED'

export interface DeleteReference {
  /** 影响项名称，如「报名记录」「新闻」 */
  label: string
  count: number
  /** true = 结构性依赖，挡住删除；false = 行为数据，会随删除一并清理 */
  blocking: boolean
  /** 给老师看的处置说明 */
  hint: string
}

export interface DeleteImpact {
  type: string
  typeLabel: string
  id: number
  name: string
  risk: DeleteRisk
  requiresPassword: boolean
  canPurge: boolean
  references: DeleteReference[]
}

export function fetchRecycleImpact(type: string, id: number) {
  return get<DeleteImpact>(`/admin/recycle-bin/${type}/${id}/impact`)
}

/**
 * 彻底删除。密码走请求体而非查询参数——查询串会落进 Nginx access log 与浏览器历史。
 * axios 的 delete 要用 config.data 才能带 body。
 */
export function purgeRecycleItem(type: string, id: number, password?: string) {
  return del<void>(`/admin/recycle-bin/${type}/${id}`, {
    data: password ? { password } : {}
  })
}
