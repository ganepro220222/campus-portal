/**
 * 动态保存按钮文案。
 * 新建和改草稿才是「保存草稿」；已发布记录保存会立刻改线上内容和搜索索引。
 */

export function resolveNewsSaveMode({ editingId, status }) {
  if (editingId == null) {
    return {
      kind: 'createDraft',
      buttonText: '保存草稿',
      successText: '草稿已创建',
      needsLiveConfirm: false,
      warning: '',
      confirmTitle: '',
      confirmMessage: ''
    }
  }
  if (status === 'published') {
    return {
      kind: 'updateLive',
      buttonText: '保存并更新线上内容',
      successText: '已更新线上内容',
      needsLiveConfirm: true,
      warning: '该动态已发布，保存后修改将立即同步到小程序和搜索结果。',
      confirmTitle: '更新线上内容',
      confirmMessage: '该动态已发布，保存后修改将立即同步到小程序和搜索结果。确定保存并更新？'
    }
  }
  return {
    kind: 'updateDraft',
    buttonText: '保存草稿',
    successText: '已更新',
    needsLiveConfirm: false,
    warning: '',
    confirmTitle: '',
    confirmMessage: ''
  }
}
