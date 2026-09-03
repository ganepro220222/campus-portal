/**
 * 可清空字段：null/空串必须进 JSON，不能被 || undefined 吃掉。
 * 用法：node scripts/test-admin-clearable-field.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { explicitClear } from '../admin/src/utils/clearableField.mjs'
import { confirmCoverClearIfNeeded, isCoverBeingCleared } from '../admin/src/utils/coverClearConfirm.mjs'

assert.equal(explicitClear(null), '')
assert.equal(explicitClear(undefined), '')
assert.equal(explicitClear(''), '')
assert.equal(explicitClear('2026-09-01 09:00'), '2026-09-01 09:00')
assert.equal(explicitClear('covers/a.jpg'), 'covers/a.jpg')

assert.equal(JSON.stringify({ startTime: explicitClear(null) }), '{"startTime":""}')
assert.equal(JSON.stringify({ cover: explicitClear('') }), '{"cover":""}')
assert.equal(JSON.stringify({ cover: '' || undefined }), '{}')

const announcement = readFileSync(new URL('../admin/src/views/announcement/AnnouncementListView.vue', import.meta.url), 'utf8')
assert.equal([...announcement.matchAll(/:value-on-clear="''"/g)].length, 2)
assert.match(announcement, /startTime:\s*explicitClear\(form\.startTime\)/)
assert.match(announcement, /endTime:\s*explicitClear\(form\.endTime\)/)

const courseDialog = readFileSync(new URL('../admin/src/views/course/CourseEditDialog.vue', import.meta.url), 'utf8')
assert.match(courseDialog, /v-model="form\.startTime"[\s\S]*?:value-on-clear="''"/)

const courseList = readFileSync(new URL('../admin/src/composables/useCourseList.ts', import.meta.url), 'utf8')
assert.match(courseList, /startTime:\s*explicitClear\(form\.startTime\)/)
assert.match(courseList, /cover:\s*explicitClear\(form\.cover\)/)
assert.match(courseList, /targetAudience:\s*explicitClear\(form\.targetAudience\)/)
assert.match(courseList, /intro:\s*explicitClear\(form\.intro\)/)
assert.doesNotMatch(courseList, /cover:\s*form\.cover\s*\|\|\s*undefined/)
assert.match(courseList, /videoUrl:\s*form\.videoUrl\s*\|\|\s*undefined/)

const craftList = readFileSync(new URL('../admin/src/composables/useCraftList.ts', import.meta.url), 'utf8')
assert.match(craftList, /cover:\s*explicitClear\(form\.cover\)/)
assert.match(craftList, /introEn:\s*explicitClear\(form\.introEn\)/)
assert.doesNotMatch(craftList, /cover:\s*form\.cover\s*\|\|\s*undefined/)

assert.equal(isCoverBeingCleared('covers/a.jpg', ''), true)
assert.equal(isCoverBeingCleared('covers/a.jpg', '   '), true)
assert.equal(isCoverBeingCleared('covers/a.jpg', null), true)
assert.equal(isCoverBeingCleared('', ''), false)
assert.equal(isCoverBeingCleared('', 'covers/b.jpg'), false)
assert.equal(isCoverBeingCleared('covers/a.jpg', 'covers/b.jpg'), false)
assert.equal(isCoverBeingCleared(null, ''), false)

let prompted = 0
await confirmCoverClearIfNeeded('covers/a.jpg', '', async () => { prompted += 1 })
assert.equal(prompted, 1)
await confirmCoverClearIfNeeded('covers/a.jpg', 'covers/b.jpg', async () => { prompted += 1 })
assert.equal(prompted, 1)
await confirmCoverClearIfNeeded('', '', async () => { prompted += 1 })
assert.equal(prompted, 1)

assert.match(courseList, /confirmCoverClearIfNeeded\(coverSavedUrl\.value/)
assert.match(readFileSync(new URL('../admin/src/composables/useHallList.ts', import.meta.url), 'utf8'), /confirmCoverClearIfNeeded\(coverSavedUrl\.value/)
assert.match(craftList, /confirmCoverClearIfNeeded\(coverSavedUrl\.value/)
assert.match(readFileSync(new URL('../admin/src/views/news/NewsListView.vue', import.meta.url), 'utf8'), /confirmCoverClearIfNeeded\(coverSavedUrl\.value/)
assert.match(readFileSync(new URL('../admin/src/views/activity/ActivityListView.vue', import.meta.url), 'utf8'), /confirmCoverClearIfNeeded\(coverSavedUrl\.value/)

console.log('test-admin-clearable-field OK')
