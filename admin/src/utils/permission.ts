/** 权限工具：与后端 RBAC 标识一致 */

/** 是否拥有某权限（超管 admin:super 拥有全部） */
export function hasPermission(permissions: string[], required: string): boolean {
  if (!permissions.length) return false
  if (permissions.includes('admin:super')) return true
  return permissions.includes(required)
}

/** 是否拥有任一权限 */
export function hasAnyPermission(permissions: string[], required: string[]): boolean {
  return required.some((p) => hasPermission(permissions, p))
}
