import { del, get, post, put } from './request'
import type { PageResult } from '@/types/api'

export interface AdminUserItem {
  id: number
  username: string
  realName: string | null
  roleId: number
  roleName: string
  status: number
  mustChangePassword: boolean
  createTime: string
  updateTime: string
  temporaryPassword?: string
}

export interface AdminUserSavePayload {
  username: string
  password?: string
  roleId: number
  realName?: string
  status?: number
}

export interface RoleOption {
  id: number
  roleName: string
}

export function fetchAdminUsers(keyword?: string, page = 1, size = 20) {
  return get<PageResult<AdminUserItem>>('/admin/users', { keyword, page, size })
}

export function fetchRoleOptions() {
  return get<RoleOption[]>('/admin/users/role-options')
}

export function createAdminUser(data: AdminUserSavePayload) {
  return post<AdminUserItem>('/admin/users', data)
}

export function updateAdminUser(id: number, data: Partial<AdminUserSavePayload>) {
  return put<AdminUserItem>(`/admin/users/${id}`, data)
}

export function resetAdminUserPassword(id: number, newPassword?: string) {
  return put<AdminUserItem>(`/admin/users/${id}/reset-password`, newPassword ? { newPassword } : {})
}

export function removeAdminUser(id: number) {
  return del<void>(`/admin/users/${id}`)
}
