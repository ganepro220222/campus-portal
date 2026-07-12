import axios from 'axios'
import { get, post, put } from './request'
import { useAuthStore } from '@/stores/auth'
import type { PageResult } from '@/types/api'

export interface MemberItem {
  id: number
  studentNo: string
  realName: string
  college: string
  grade: string
  phone: string
  points: number
  status: number
  wxBound: boolean
  createTime: string
}

export interface MemberImportErrorRow {
  rowNum: number
  studentNo: string
  realName: string
  reason: string
}

export interface MemberImportResult {
  totalRows: number
  successCount: number
  skippedCount: number
  failedCount: number
  errors: string[]
  errorRows?: MemberImportErrorRow[]
}

export function fetchMembers(keyword?: string, status?: number, page = 1, size = 20) {
  return get<PageResult<MemberItem>>('/admin/members', { keyword, status, page, size })
}

export function importMembers(file: File) {
  const form = new FormData()
  form.append('file', file)
  return post<MemberImportResult>('/admin/members/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export function updateMemberStatus(id: number, status: number) {
  return put<MemberItem>(`/admin/members/${id}/status?status=${status}`)
}

export async function downloadMemberImportTemplate() {
  const auth = useAuthStore()
  const res = await axios.get('/api/v1/admin/members/import-template', {
    responseType: 'blob',
    headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
  })
  const url = window.URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = '师生导入模板.xlsx'
  a.click()
  window.URL.revokeObjectURL(url)
}

export async function downloadMemberImportErrors(rows: MemberImportErrorRow[]) {
  const auth = useAuthStore()
  const res = await axios.post('/api/v1/admin/members/import-errors/export', rows, {
    responseType: 'blob',
    headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {}
  })
  const url = window.URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = '师生导入失败明细.xlsx'
  a.click()
  window.URL.revokeObjectURL(url)
}
