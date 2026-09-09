/**
 * 已发布动态保存：按钮须写明立刻更新线上内容，并要求确认。
 * 用法：node scripts/test-admin-news-save-mode.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolveNewsSaveMode } from '../admin/src/utils/newsSaveMode.mjs'

const created = resolveNewsSaveMode({ editingId: null, status: '' })
assert.equal(created.kind, 'createDraft')
assert.equal(created.buttonText, '保存草稿')
assert.equal(created.needsLiveConfirm, false)

const draft = resolveNewsSaveMode({ editingId: 8, status: 'draft' })
assert.equal(draft.kind, 'updateDraft')
assert.equal(draft.buttonText, '保存草稿')
assert.equal(draft.needsLiveConfirm, false)

const live = resolveNewsSaveMode({ editingId: 8, status: 'published' })
assert.equal(live.kind, 'updateLive')
assert.equal(live.buttonText, '保存并更新线上内容')
assert.equal(live.needsLiveConfirm, true)
assert.match(live.warning, /立即同步到小程序/)
assert.match(live.confirmMessage, /立即同步到小程序/)

const view = readFileSync(new URL('../admin/src/views/news/NewsListView.vue', import.meta.url), 'utf8')
assert.match(view, /resolveNewsSaveMode/)
assert.match(view, /saveMode\.buttonText/)
assert.match(view, /needsLiveConfirm/)
assert.match(view, /saveMode\.warning/)
assert.match(view, /saveMode\.value\.successText/)
assert.doesNotMatch(
  view,
  /<el-button type="primary" :loading="saving \|\| detailLoading" :disabled="detailLoading" @click="onSave">保存草稿<\/el-button>/
)

console.log('test-admin-news-save-mode OK')
