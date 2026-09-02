import { get, post, put, del } from './request'
import { downloadFile, downloadFilePost } from '@/utils/download'
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

export interface MemberUnbindWechatResult {
  memberId: number
  studentNo: string
  /** 解绑后恒为 false，供列表就地更新 */
  wxBound: boolean
}

/**
 * 解绑微信：把 openid 还原成 acct:<学号> 占位值，本人即可换个微信重新绑。
 * 学号密码登录不受影响，账号不会被禁用；被解绑那台设备上的登录态立即失效。
 */
export function unbindMemberWechat(id: number) {
  return put<MemberUnbindWechatResult>(`/admin/members/${id}/unbind-wechat`)
}

export interface MemberResetPasswordResult {
  memberId: number
  studentNo: string
  /** 一次性明文，仅本次响应返回，服务端不再保存 */
  temporaryPassword: string
  /** true = 系统生成的临时密码 */
  generated: boolean
}

/**
 * 重置师生密码。留空 newPassword 由系统生成临时密码（推荐）。
 * 重置后该账号须在下次登录时自行改密，其他设备上的登录态立即失效。
 */
export function resetMemberPassword(id: number, newPassword?: string) {
  return put<MemberResetPasswordResult>(`/admin/members/${id}/reset-password`, { newPassword })
}

export function downloadMemberImportTemplate() {
  return downloadFile('/admin/members/import-template', '师生导入模板.xlsx')
}

export function downloadMemberImportErrors(rows: MemberImportErrorRow[]) {
  return downloadFilePost('/admin/members/import-errors/export', '师生导入失败明细.xlsx', rows)
}
