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

export function purgeRecycleItem(type: string, id: number) {
  return del<void>(`/admin/recycle-bin/${type}/${id}`)
}
