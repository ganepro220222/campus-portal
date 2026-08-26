import axios from 'axios'
import { get, post, put, del } from './request'
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
  /** 已清退：姓名 / 学号 / 手机号已抹掉，账号无法再登录 */
  anonymized: boolean
  createTime: string
}

export interface MemberCreatePayload {
  studentNo: string
  realName: string
  college?: string
  grade?: string
  phone?: string
  /** 仅用于取后 6 位作初始密码，不入库 */
  idCard?: string
}

export interface MemberDeleteReference {
  label: string
  count: number
}

export interface MemberDeleteImpact {
  id: number
  name: string
  anonymized: boolean
  references: MemberDeleteReference[]
  /** 没留下任何业务记录时才能物理删除 */
  canDelete: boolean
  requiresPassword: boolean
  canAnonymize: boolean
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

/** 单个新增：只有一两个人要建号时不必走导入 */
export function createMember(payload: MemberCreatePayload) {
  return post<MemberItem>('/admin/members', payload)
}

/** 删除前的影响预览：留下过什么、能不能真删、还是只能清退 */
export function fetchMemberDeleteImpact(id: number) {
  return get<MemberDeleteImpact>(`/admin/members/${id}/delete-impact`)
}

/**
 * 物理删除：仅限没留下业务记录的账号。
 * 密码走请求体而非查询串——查询串会落进 Nginx access log 与浏览器历史。
 */
export function deleteMember(id: number, password: string) {
  return del<void>(`/admin/members/${id}`, { data: { password } })
}

/** 清退：脱敏并禁用账号，保留历史统计外键，不物理删除 */
export function anonymizeMember(id: number) {
  return put<MemberItem>(`/admin/members/${id}/anonymize`)
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
