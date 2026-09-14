/**
 * 后台图片预览：换图后再开编辑第一次裂图。
 * 用法：node scripts/test-admin-image-preview.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  IMAGE_PREVIEW_MAX_RETRIES,
  IMAGE_PREVIEW_RETRY_MS,
  nextImagePreviewRetry
} from '../admin/src/utils/imagePreviewBind.mjs'
import {
  createFetchedEditDialogSession,
  openFetchedEditDialog
} from '../admin/src/utils/openFetchedEditDialog.mjs'

const url = 'https://cdn.example.com/images/202609/new.jpg'

assert.equal(IMAGE_PREVIEW_MAX_RETRIES, 1)
assert.equal(IMAGE_PREVIEW_RETRY_MS, 400)
assert.deepEqual(nextImagePreviewRetry(0, url, url), { retryCount: 1, delayMs: 400 })
assert.equal(nextImagePreviewRetry(1, url, url), null)
assert.equal(nextImagePreviewRetry(0, url, ''), null)
assert.equal(nextImagePreviewRetry(0, '', url), null)
assert.equal(nextImagePreviewRetry(0, url, 'https://cdn.example.com/images/202609/old.jpg'), null)

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function createHarness() {
  const state = {
    cover: 'https://cdn.example.com/images/202609/kept.jpg',
    resetCount: 0,
    editingId: null,
    dialogVisible: false,
    applied: []
  }
  const session = createFetchedEditDialogSession()
  const pending = []

  async function open(row) {
    return openFetchedEditDialog({
      row,
      session,
      resetForm() {
        state.resetCount += 1
        state.cover = ''
      },
      fetchDetail() {
        const box = deferred()
        pending.push(box)
        return box.promise
      },
      applyDetail(detail) {
        state.cover = detail.cover
        state.applied.push(detail.id)
      },
      setEditingId(id) {
        state.editingId = id
      },
      setDialogVisible(visible) {
        state.dialogVisible = visible
      }
    })
  }

  function resolveNext(detail) {
    const box = pending.shift()
    assert.ok(box, '应有待返回的详情请求')
    box.resolve(detail)
    return box.promise
  }

  return { state, open, resolveNext }
}

{
  const { state, open } = createHarness()
  const created = await open()
  assert.equal(created.outcome, 'create')
  assert.equal(state.resetCount, 1)
  assert.equal(state.cover, '')
  assert.equal(state.dialogVisible, true)
}

{
  const { state, open, resolveNext } = createHarness()
  const kept = state.cover
  const loading = open({ id: 7 })
  assert.equal(state.resetCount, 0)
  assert.equal(state.cover, kept)
  assert.equal(state.dialogVisible, false)
  assert.equal(state.editingId, 7)

  await resolveNext({ id: 7, cover: url })
  assert.equal((await loading).outcome, 'loaded')
  assert.equal(state.cover, url)
  assert.equal(state.resetCount, 0)
  assert.equal(state.dialogVisible, true)
}

{
  const { state, open, resolveNext } = createHarness()
  const first = open({ id: 11 })
  const second = open({ id: 12 })
  await resolveNext({ id: 11, cover: 'https://cdn.example.com/images/202609/a.jpg' })
  assert.equal((await first).outcome, 'stale')
  assert.equal(state.cover, 'https://cdn.example.com/images/202609/kept.jpg')
  assert.equal(state.dialogVisible, false)

  await resolveNext({ id: 12, cover: 'https://cdn.example.com/images/202609/b.jpg' })
  assert.equal((await second).outcome, 'loaded')
  assert.equal(state.cover, 'https://cdn.example.com/images/202609/b.jpg')
  assert.equal(state.dialogVisible, true)
  assert.equal(state.resetCount, 0)
}

const vue = readFileSync(new URL('../admin/src/components/OssUploadInput.vue', import.meta.url), 'utf8')
assert.match(vue, /imagePreviewSrc/)
assert.match(vue, /nextImagePreviewRetry/)
assert.match(vue, /@error="onImagePreviewError"/)
assert.doesNotMatch(vue, /<el-image[\s\S]*?:src="inner"/)

for (const rel of [
  '../admin/src/composables/useHallList.ts',
  '../admin/src/composables/useCraftList.ts',
  '../admin/src/composables/useCourseList.ts',
  '../admin/src/views/resource/ResourceListView.vue'
]) {
  const src = readFileSync(new URL(rel, import.meta.url), 'utf8')
  assert.match(src, /openFetchedEditDialog/, `${rel} 应走先填详情再开窗`)
  assert.doesNotMatch(src, /resetForm\(\)\s*\n\s*editingId/, `${rel} 不得在 await 详情前先清空表单`)
}

console.log('test-admin-image-preview OK')
