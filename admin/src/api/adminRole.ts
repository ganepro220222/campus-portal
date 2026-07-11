import { del, get, post, put } from './request'
import type { PermissionGroup } from '@/utils/permissions'

export interface AdminRoleItem {
  id: number
  roleName: string
  permissions: string[]
  userCount: number
  builtin: boolean
  updateTime: string
}

export interface AdminRoleSavePayload {
  roleName: string
  permissions: string[]
}

export function fetchAdminRoles() {
  return get<AdminRoleItem[]>('/admin/roles')
}

export function fetchPermissionCatalog() {
  return get<PermissionGroup[]>('/admin/roles/permission-catalog')
}

export function createAdminRole(data: AdminRoleSavePayload) {
  return post<AdminRoleItem>('/admin/roles', data)
}

export function updateAdminRole(id: number, data: AdminRoleSavePayload) {
  return put<AdminRoleItem>(`/admin/roles/${id}`, data)
}

export function removeAdminRole(id: number) {
  return del<void>(`/admin/roles/${id}`)
}
