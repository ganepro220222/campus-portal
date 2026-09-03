/**
 * 封面从有到无：保存前必须确认。清空会走 afterReplace 物理删 OSS。
 */
export function isCoverBeingCleared(previous, next) {
  return String(previous || '').trim() !== '' && String(next == null ? '' : next).trim() === ''
}

export async function confirmCoverClearIfNeeded(previous, next, prompt) {
  if (!isCoverBeingCleared(previous, next)) return true
  if (typeof prompt !== 'function') {
    throw new Error('confirmCoverClearIfNeeded requires a prompt function')
  }
  await prompt({
    message: '清空封面将删除原封面文件且不可恢复，确定继续？',
    title: '清空封面'
  })
  return true
}
