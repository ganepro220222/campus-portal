/**
 * 内容审核角色：列表能看、能发，但不能改稿；查看须拉完整详情。
 * 用法：node scripts/test-admin-content-review.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CONTENT_REVIEWER_PERMISSIONS,
  isReviewFilePreviewEnabled,
  resolveContentDialogFooter,
  resolveContentDialogMode,
  resolveContentDialogTitle,
  resolveContentRowActions
} from '../admin/src/utils/contentReviewActions.mjs'

const reviewer = [...CONTENT_REVIEWER_PERMISSIONS]
assert.ok(!reviewer.some((p) => p.endsWith(':write')), '内置审核角色不得带 write')

const newsDraft = resolveContentRowActions({
  permissions: reviewer,
  module: 'news',
  status: 'draft',
  publishedValue: 'published'
})
assert.equal(newsDraft.showView, true)
assert.equal(newsDraft.showEdit, false)
assert.equal(newsDraft.showPublish, true)
assert.equal(newsDraft.showUnpublish, false)
assert.equal(newsDraft.showDelete, false)

const newsLive = resolveContentRowActions({
  permissions: reviewer,
  module: 'news',
  status: 'published',
  publishedValue: 'published'
})
assert.equal(newsLive.showView, true)
assert.equal(newsLive.showPublish, false)
assert.equal(newsLive.showUnpublish, true)

const hallDraft = resolveContentRowActions({
  permissions: reviewer,
  module: 'hall',
  status: 0,
  publishedValue: 1
})
assert.equal(hallDraft.showView, true)
assert.equal(hallDraft.showEdit, false)
assert.equal(hallDraft.showPublish, true)
assert.equal(hallDraft.showDelete, false)

const courseLive = resolveContentRowActions({
  permissions: reviewer,
  module: 'course',
  status: 1,
  publishedValue: 1
})
assert.equal(courseLive.showView, true)
assert.equal(courseLive.showEdit, false)
assert.equal(courseLive.showUnpublish, true)
assert.equal(courseLive.showDelete, false)

const editor = ['news:read', 'news:write', 'hall:read', 'hall:write', 'course:read', 'course:write']
const editorDraft = resolveContentRowActions({
  permissions: editor,
  module: 'news',
  status: 'draft',
  publishedValue: 'published'
})
assert.equal(editorDraft.showView, true)
assert.equal(editorDraft.showEdit, true)
assert.equal(editorDraft.showPublish, false)
assert.equal(editorDraft.showDelete, true)

assert.equal(resolveContentDialogMode({ hasRow: false, canWrite: true }), 'create')
assert.equal(resolveContentDialogMode({ hasRow: true, canWrite: false, requested: 'view' }), 'view')
assert.equal(resolveContentDialogMode({ hasRow: true, canWrite: true, requested: 'view' }), 'view')
assert.equal(resolveContentDialogMode({ hasRow: true, canWrite: true, requested: 'edit' }), 'edit')
assert.equal(resolveContentDialogMode({ hasRow: true, canWrite: false }), 'view')

assert.equal(resolveContentDialogTitle({ moduleLabel: '动态', mode: 'view' }), '查看动态')
assert.equal(resolveContentDialogTitle({ moduleLabel: '动态', mode: 'edit' }), '编辑动态')
assert.equal(resolveContentDialogTitle({ moduleLabel: '动态', mode: 'create' }), '新建动态')

const footerLoading = resolveContentDialogFooter({
  mode: 'view',
  canPublish: true,
  published: false,
  detailReady: false,
  detailLoading: true,
  publishLabel: '发布'
})
assert.equal(footerLoading.showSave, false)
assert.equal(footerLoading.showPublish, true)
assert.equal(footerLoading.publishDisabled, true)
assert.equal(footerLoading.closeText, '关闭')

const footerReady = resolveContentDialogFooter({
  mode: 'view',
  canPublish: true,
  published: false,
  detailReady: true,
  detailLoading: false
})
assert.equal(footerReady.publishDisabled, false)

const footerEdit = resolveContentDialogFooter({
  mode: 'edit',
  canPublish: true,
  published: false,
  detailReady: true
})
assert.equal(footerEdit.showSave, true)
assert.equal(footerEdit.showPublish, false)
assert.equal(footerEdit.closeText, '取消')

const seed = readFileSync(new URL('../sql/init.sql', import.meta.url), 'utf8')
assert.match(seed, /'内容审核',\s*'\["news:read","news:publish","hall:read","hall:publish","course:read","course:publish","stats:view"\]'/)

const views = [
  ['admin/src/views/news/NewsListView.vue', 'openView', 'fetchNewsDetail'],
  ['admin/src/views/hall/HallListView.vue', 'openView', 'HallEditDialog'],
  ['admin/src/views/craft/CraftListView.vue', 'openView', 'CraftEditDialog'],
  ['admin/src/views/course/CourseListView.vue', 'openView', 'CourseEditDialog'],
  ['admin/src/views/resource/ResourceListView.vue', 'openView', 'readonly']
]
for (const [rel, openFn, extra] of views) {
  const src = readFileSync(new URL('../' + rel, import.meta.url), 'utf8')
  assert.match(src, />查看<\/el-button>/, `${rel} 须有查看入口`)
  assert.match(src, new RegExp(openFn), `${rel} 须接入 ${openFn}`)
  assert.match(src, new RegExp(extra), `${rel} 须接入 ${extra}`)
  assert.match(src, /v-if="canWrite"/, `${rel} 编辑仍只给写权限`)
}

const news = readFileSync(new URL('../admin/src/views/news/NewsListView.vue', import.meta.url), 'utf8')
assert.match(news, /dialogMode/)
assert.match(news, /readonly/)
assert.match(news, /detailReady/)
assert.match(news, /WangEditor[\s\S]*:disabled="readonly"/)
assert.doesNotMatch(news, /v-if="canWrite"[\s\S]*openDialog\(row\)[\s\S]*查看/)

assert.equal(isReviewFilePreviewEnabled({ formDisabled: true, previewIsNativeButton: false }), false)
assert.equal(isReviewFilePreviewEnabled({ formDisabled: true, previewIsNativeButton: true }), true)
assert.equal(isReviewFilePreviewEnabled({ formDisabled: false, previewIsNativeButton: false }), true)

function formOpenTag(src) {
  const match = src.match(/<el-form\b[\s\S]*?>/)
  return match ? match[0] : ''
}

const reviewForms = [
  'admin/src/views/news/NewsListView.vue',
  'admin/src/views/hall/HallEditDialog.vue',
  'admin/src/views/craft/CraftEditDialog.vue',
  'admin/src/views/course/CourseEditDialog.vue',
  'admin/src/views/resource/ResourceListView.vue'
]
for (const rel of reviewForms) {
  const src = readFileSync(new URL('../' + rel, import.meta.url), 'utf8')
  assert.doesNotMatch(
    formOpenTag(src),
    /:disabled="readonly"/,
    `${rel} 只读不得禁整个表单，否则打开预览会被连带禁用`
  )
  assert.match(src, /:disabled="readonly"/, `${rel} 可编辑字段须逐项禁用`)
}

const oss = readFileSync(new URL('../admin/src/components/OssUploadInput.vue', import.meta.url), 'utf8')
assert.match(oss, /<button[\s\S]*?打开预览/)
assert.doesNotMatch(oss, /<el-button[\s\S]{0,280}打开预览/)
assert.match(oss, /v-if="!readonly"/)
assert.match(oss, /class="controls"/)

const resource = readFileSync(new URL('../admin/src/views/resource/ResourceListView.vue', import.meta.url), 'utf8')
assert.match(resource, /preview="file"/)
assert.match(resource, /:readonly="readonly"/)

const course = readFileSync(new URL('../admin/src/views/course/CourseEditDialog.vue', import.meta.url), 'utf8')
assert.match(course, /preview="file"/)
assert.match(course, /scene="subtitle"[\s\S]*:readonly="readonly"/)

const handbook = readFileSync(new URL('../docs/运维/管理员操作手册_V1.0.md', import.meta.url), 'utf8')
assert.doesNotMatch(handbook, /保存并更新线上内容[^\n]*  \n/)

const upload = readFileSync(new URL('../backend/src/main/java/com/shuyuan/backend/controller/admin/AdminUploadController.java', import.meta.url), 'utf8')
assert.match(upload, /requireMediaPreviewPermission/)
assert.match(upload, /news:read/)
assert.match(upload, /hall:read/)
assert.match(upload, /course:read/)
assert.match(upload, /previewUrl[\s\S]*requireMediaPreviewPermission/)
assert.match(upload, /fileMeta[\s\S]*requireMediaPreviewPermission/)
assert.match(upload, /subtitlePreview[\s\S]*requireMediaPreviewPermission/)
assert.match(upload, /upload\([\s\S]*requireUploadPermission/)

console.log('test-admin-content-review OK')
