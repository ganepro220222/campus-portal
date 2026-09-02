#!/usr/bin/env node
/**
 * 内容保存契约门禁：
 * 1) course/hall/craft/resource 的普通保存不得重新获得上下架能力；
 * 2) 只写密钥、可清空公告字段、课程字幕主保存不得再次静默丢失。
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const errors = []

const services = [
  'AdminCourseService.java',
  'AdminHallService.java',
  'AdminCraftService.java',
  'AdminResourceService.java'
]
for (const name of services) {
  const source = read(`backend/src/main/java/com/shuyuan/backend/service/${name}`)
  if (/setStatus\s*\(\s*req\.getStatus\s*\(\s*\)\s*\)/.test(source)) {
    errors.push(`${name}：普通保存重新写入请求 status，会绕过 publish 权限`)
  }
}

for (const rel of [
  'admin/src/views/course/CourseEditDialog.vue',
  'admin/src/views/hall/HallEditDialog.vue',
  'admin/src/views/craft/CraftEditDialog.vue',
  'admin/src/views/resource/ResourceListView.vue'
]) {
  if (/v-model="form\.status"/.test(read(rel))) {
    errors.push(`${rel}：编辑表单重新出现上下架控件`)
  }
}

for (const rel of [
  'admin/src/composables/useCourseList.ts',
  'admin/src/composables/useHallList.ts',
  'admin/src/composables/useCraftList.ts',
  'admin/src/views/resource/ResourceListView.vue'
]) {
  if (/status\s*:\s*form\.status/.test(read(rel))) {
    errors.push(`${rel}：普通保存 payload 重新携带 status`)
  }
}

const college = read('admin/src/views/college/CollegeListView.vue')
if (!/editingId\.value\s*&&\s*!form\.apiToken\.trim\(\)/.test(college)
    || !/delete[\s\S]{0,100}\.apiToken/.test(college)) {
  errors.push('CollegeListView.vue：编辑态空 apiToken 未从 payload 中省略')
}

const announcement = read('admin/src/views/announcement/AnnouncementListView.vue')
if (!/linkUrl:\s*form\.linkUrl(?:,|\s*\n)/.test(announcement)) {
  errors.push('AnnouncementListView.vue：linkUrl 未按原值提交，清空语义可能再次失效')
}
if ((announcement.match(/:value-on-clear="''"/g) || []).length < 2) {
  errors.push('AnnouncementListView.vue：生效/失效时间选择器未设置 value-on-clear 空串')
}
for (const field of ['startTime', 'endTime']) {
  if (!new RegExp(`${field}:\\s*explicitClear\\(form\\.${field}\\)`).test(announcement)) {
    errors.push(`AnnouncementListView.vue：${field} 未把 null 收成空串，清空会再次失效`)
  }
}

const courseDialog = read('admin/src/views/course/CourseEditDialog.vue')
if (!/v-model="form\.startTime"[\s\S]*?:value-on-clear="''"/.test(courseDialog)) {
  errors.push('CourseEditDialog.vue：开课时间选择器未设置 value-on-clear 空串')
}

const course = read('admin/src/composables/useCourseList.ts')
if (/subtitleUrl\s*:\s*form\.subtitleUrl/.test(course)
    || !/subtitleDirty/.test(course)
    || !/await updateSubtitle\(/.test(course)) {
  errors.push('useCourseList.ts：主保存未保持“课程成功后保存脏字幕”的契约')
}
if (!/videoSavedUrl/.test(course)
    || !/videoSavedUrl\.value\.trim\(\)\s*&&\s*!form\.videoUrl\.trim\(\)/.test(course)) {
  errors.push('useCourseList.ts：已有视频被清空时必须拦截保存，避免无确认删除素材')
}
if (!/startTime\s*:\s*explicitClear\(form\.startTime\)/.test(course)) {
  errors.push('useCourseList.ts：startTime 未把 null 收成空串，清空会再次失效')
}
for (const field of ['cover', 'targetAudience', 'intro']) {
  if (!new RegExp(`${field}:\\s*explicitClear\\(form\\.${field}\\)`).test(course)
      || new RegExp(`${field}:\\s*form\\.${field}\\s*\\|\\|\\s*undefined`).test(course)) {
    errors.push(`useCourseList.ts：${field} 仍可能把空串吃成 undefined，清空会再次失效`)
  }
}

const craft = read('admin/src/composables/useCraftList.ts')
for (const field of ['cover', 'introEn']) {
  if (!new RegExp(`${field}:\\s*explicitClear\\(form\\.${field}\\)`).test(craft)
      || new RegExp(`${field}:\\s*form\\.${field}\\s*\\|\\|\\s*undefined`).test(craft)) {
    errors.push(`useCraftList.ts：${field} 仍可能把空串吃成 undefined，清空会再次失效`)
  }
}

if (errors.length) {
  console.error('check-content-save-guards 失败：')
  errors.forEach((error) => console.error(`  - ${error}`))
  process.exit(1)
}

console.log('check-content-save-guards OK')
