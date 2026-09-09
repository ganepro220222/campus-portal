/**
 * 更换课程视频：同一 OSS 对象不确认；有学员时必须提示重置进度。
 * 用法：node scripts/test-admin-course-video-replace.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  buildCourseVideoReplaceConfirm,
  confirmCourseVideoReplaceIfNeeded,
  shouldConfirmCourseVideoReplace
} from '../admin/src/utils/courseVideoReplace.mjs'
import { sameStoredMedia } from '../admin/src/utils/storedMedia.mjs'

assert.equal(
  sameStoredMedia('videos/same.mp4', 'https://cdn.example.com/videos/same.mp4?Expires=1'),
  true
)
assert.equal(sameStoredMedia('videos/old.mp4', 'videos/new.mp4'), false)
assert.equal(sameStoredMedia('', 'videos/new.mp4'), false)
assert.equal(sameStoredMedia('videos/a.mp4', 'videos/a.mp4'), true)

assert.equal(shouldConfirmCourseVideoReplace({
  previousVideo: 'videos/old.mp4',
  nextVideo: 'videos/new.mp4',
  learnerCount: 3
}), true)
assert.equal(shouldConfirmCourseVideoReplace({
  previousVideo: 'videos/same.mp4',
  nextVideo: 'https://cdn.example.com/videos/same.mp4?sig=1',
  learnerCount: 8
}), false)
assert.equal(shouldConfirmCourseVideoReplace({
  previousVideo: 'videos/old.mp4',
  nextVideo: 'videos/new.mp4',
  learnerCount: 0
}), false)
assert.equal(shouldConfirmCourseVideoReplace({
  previousVideo: 'videos/old.mp4',
  nextVideo: '',
  learnerCount: 3
}), false)
assert.equal(shouldConfirmCourseVideoReplace({
  previousVideo: 'videos/old.mp4',
  nextVideo: '   ',
  learnerCount: 3
}), false)

const copy = buildCourseVideoReplaceConfirm({ learnerCount: 4 })
assert.equal(copy.title, '更换教学视频')
assert.match(copy.message, /4 名学员/)
assert.match(copy.message, /不会因重新学完再发/)

let prompted = 0
await confirmCourseVideoReplaceIfNeeded({
  previousVideo: 'videos/same.mp4',
  nextVideo: 'https://cdn.example.com/videos/same.mp4',
  learnerCount: 2,
  prompt: async () => { prompted += 1 }
})
assert.equal(prompted, 0)

await confirmCourseVideoReplaceIfNeeded({
  previousVideo: 'videos/old.mp4',
  nextVideo: 'videos/new.mp4',
  learnerCount: 2,
  prompt: async () => { prompted += 1 }
})
assert.equal(prompted, 1)

const list = readFileSync(new URL('../admin/src/composables/useCourseList.ts', import.meta.url), 'utf8')
assert.match(list, /confirmCourseVideoReplaceIfNeeded/)
assert.match(list, /progressLearnerCount/)
assert.match(list, /videoSavedUrl/)
assert.match(
  list,
  /视频已清空[\s\S]*confirmCourseVideoReplaceIfNeeded/,
  '须先拦住空视频，再弹重置进度确认，避免误点确认'
)

const dialog = readFileSync(new URL('../admin/src/views/course/CourseEditDialog.vue', import.meta.url), 'utf8')
assert.match(dialog, /更换视频将重置学员续播与完成状态/)

const admin = readFileSync(
  new URL('../backend/src/main/java/com/shuyuan/backend/service/AdminCourseService.java', import.meta.url),
  'utf8'
)
assert.match(admin, /clearForReplacedVideo/)
assert.match(admin, /videoChanged/)
assert.match(admin, /progressLearnerCount/)

const handbook = readFileSync(new URL('../docs/运维/管理员操作手册_V1.0.md', import.meta.url), 'utf8')
const replaceLine = handbook.split(/\r?\n/).find((line) => line.includes('更换教学视频') && line.includes('重置学习进度'))
assert.ok(replaceLine, '手册须说明更换教学视频会重置学习进度')
assert.doesNotMatch(replaceLine.replace(/\r$/, ''), /[ \t]+$/, '手册该行不得留尾随空白')

const progress = readFileSync(
  new URL('../backend/src/main/java/com/shuyuan/backend/service/CourseProgressService.java', import.meta.url),
  'utf8'
)
assert.match(progress, /clearForReplacedVideo/)
assert.match(progress, /countLearners/)

console.log('test-admin-course-video-replace OK')
