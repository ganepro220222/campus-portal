/**
 * 内容列表操作与只读审核弹窗。
 * 读/写/发布拆开：有 read 就能看全文，write 才能改稿，publish 才能上架。
 */

/** 与库里内置「内容审核」角色权限一致，不含任何 write */
export const CONTENT_REVIEWER_PERMISSIONS = Object.freeze([
  'news:read',
  'news:publish',
  'hall:read',
  'hall:publish',
  'course:read',
  'course:publish',
  'stats:view'
])

export function hasContentPermission(permissions, required) {
  const list = Array.isArray(permissions) ? permissions : []
  if (!list.length) return false
  if (list.includes('admin:super')) return true
  return list.includes(required)
}

export function resolveContentRowActions({
  permissions,
  module,
  status,
  publishedValue
}) {
  const canRead = hasContentPermission(permissions, `${module}:read`)
  const canWrite = hasContentPermission(permissions, `${module}:write`)
  const canPublish = hasContentPermission(permissions, `${module}:publish`)
  const published = status === publishedValue
  return {
    canRead,
    canWrite,
    canPublish,
    published,
    showView: canRead,
    showEdit: canWrite,
    showPublish: canPublish && !published,
    showUnpublish: canPublish && published,
    showDelete: canWrite && !published
  }
}

export function resolveContentDialogMode({ hasRow, canWrite, requested }) {
  if (!hasRow) return 'create'
  if (requested === 'view' || !canWrite) return 'view'
  return 'edit'
}

export function resolveContentDialogTitle({ moduleLabel, mode }) {
  if (mode === 'create') return `新建${moduleLabel}`
  if (mode === 'view') return `查看${moduleLabel}`
  return `编辑${moduleLabel}`
}

/**
 * 只读审核不得把整个 el-form 设为 disabled。
 * Element Plus 会把内部 el-button 一并禁用，「打开预览」会点不了。
 * 预览入口须用原生 button，避免再次掉进表单禁用上下文。
 */
export function isReviewFilePreviewEnabled({ formDisabled, previewIsNativeButton }) {
  if (formDisabled && !previewIsNativeButton) return false
  return true
}

export function resolveContentDialogFooter({
  mode,
  canPublish,
  published,
  detailReady,
  detailLoading,
  publishLabel,
  unpublishLabel
}) {
  const readonly = mode === 'view'
  const ready = Boolean(detailReady) && !detailLoading
  return {
    readonly,
    closeText: readonly ? '关闭' : '取消',
    showSave: !readonly,
    showPublish: readonly && Boolean(canPublish) && !published,
    showUnpublish: readonly && Boolean(canPublish) && published,
    publishDisabled: !ready,
    publishLabel: publishLabel || '发布',
    unpublishLabel: unpublishLabel || '下架'
  }
}
