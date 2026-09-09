/**
 * 更换课程教学视频：有学员进度时必须确认，保存后会清零续播与完成态。
 */

import { sameStoredMedia } from './storedMedia.mjs'

export function shouldConfirmCourseVideoReplace({ previousVideo, nextVideo, learnerCount }) {
  const next = nextVideo == null ? '' : String(nextVideo).trim()
  if (!next) return false
  if (sameStoredMedia(previousVideo, nextVideo)) return false
  return Number(learnerCount) > 0
}

export function buildCourseVideoReplaceConfirm({ learnerCount }) {
  const n = Math.max(0, Math.floor(Number(learnerCount) || 0))
  return {
    title: '更换教学视频',
    message: `更换教学视频将重置本课程全部学习进度（${n} 名学员），续播位置和完成状态会清零。已发放的课程完成积分不会收回，也不会因重新学完再发。确定继续？`,
    confirmButtonText: '确定更换并重置进度',
    cancelButtonText: '取消'
  }
}

export async function confirmCourseVideoReplaceIfNeeded({
  previousVideo,
  nextVideo,
  learnerCount,
  prompt
}) {
  if (!shouldConfirmCourseVideoReplace({ previousVideo, nextVideo, learnerCount })) {
    return true
  }
  if (typeof prompt !== 'function') {
    throw new Error('confirmCourseVideoReplaceIfNeeded requires a prompt function')
  }
  await prompt(buildCourseVideoReplaceConfirm({ learnerCount }))
  return true
}
