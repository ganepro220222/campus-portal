/** 软删除进回收站后的成功提示（与 RecycleBinService 13 类一致） */
export const MOVED_TO_RECYCLE_BIN = '已移入回收站'

/** 内容 / 配置 / 角色等移入回收站的删除确认 */
export function softDeleteConfirm(label: string): string {
  return `删除${label}？将移入回收站，可在「回收站」中恢复或彻底删除。`
}

/** 管理员账号：软删除且立即停止登录，恢复后为禁用态 */
export function adminUserDeleteConfirm(username: string): string {
  return (
    `删除账号「${username}」？账号将移入回收站并立即停止登录，` +
    '可在回收站恢复或彻底删除。'
  )
}

/** 分类：先拦引用，无引用时与其他类型一样进回收站 */
export function categoryDeleteConfirm(name: string): string {
  return (
    `删除「${name}」？若该分类下仍有内容将无法删除；` +
    '无引用时将移入回收站，可在「回收站」中恢复或彻底删除。'
  )
}
