/**
 * 动态编辑弹窗：详情代际隔离，新建不得继承旧 loading。
 * 用法：node scripts/test-admin-news-detail-dialog.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  createNewsDetailDialogSession,
  isNewsDraftSaveLocked,
  openNewsDetailDialog
} from '../admin/src/utils/newsDetailDialog.mjs'

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
    form: { id: null, title: '', content: '' },
    editingId: null,
    dialogVisible: false,
    detailLoading: false,
    loadErrors: 0,
    applied: []
  }
  const session = createNewsDetailDialogSession()
  const pending = new Map()

  function bind(id) {
    if (!pending.has(id)) pending.set(id, [])
    return pending.get(id)
  }

  async function open(row) {
    return openNewsDetailDialog({
      row,
      session,
      resetForm() {
        state.form = { id: null, title: '', content: '' }
      },
      applyForm(next) {
        state.form = { id: next.id, title: next.title, content: next.content || '' }
        state.applied.push({ id: next.id, title: next.title, content: next.content || '' })
      },
      fetchDetail(id) {
        const box = deferred()
        bind(id).push(box)
        return box.promise
      },
      setEditingId(id) {
        state.editingId = id
      },
      setDialogVisible(visible) {
        state.dialogVisible = visible
      },
      setDetailLoading(loading) {
        state.detailLoading = loading
      },
      onLoadError() {
        state.loadErrors += 1
      }
    })
  }

  function resolveNext(id, detail) {
    const box = bind(id).shift()
    assert.ok(box, `动态 ${id} 应有待返回的详情请求`)
    box.resolve(detail)
    return box.promise
  }

  function rejectNext(id, error) {
    const box = bind(id).shift()
    assert.ok(box, `动态 ${id} 应有待失败的详情请求`)
    box.reject(error || new Error('load failed'))
    return box.promise.catch(() => {})
  }

  return { state, open, resolveNext, rejectNext }
}

function listRow(id, title) {
  return { id, title, content: '' }
}

function detailRow(id, title, content) {
  return { id, title, content }
}

{
  const { state, open } = createHarness()
  const created = await open()
  assert.equal(created.outcome, 'create')
  assert.equal(state.detailLoading, false)
  assert.equal(state.editingId, null)
  assert.equal(state.dialogVisible, true)
  assert.equal(isNewsDraftSaveLocked({ saving: false, detailLoading: state.detailLoading }), false)
}

{
  const { state, open, resolveNext } = createHarness()
  const loading = open(listRow(8, '列表标题'))
  assert.equal(state.detailLoading, true)
  assert.equal(state.form.title, '列表标题')
  assert.equal(isNewsDraftSaveLocked({ saving: false, detailLoading: state.detailLoading }), true)

  await resolveNext(8, detailRow(8, '完整标题', '<p>正文</p>'))
  assert.equal((await loading).outcome, 'loaded')
  assert.equal(state.form.content, '<p>正文</p>')
  assert.equal(state.detailLoading, false)
  assert.equal(state.dialogVisible, true)
}

{
  const { state, open, rejectNext } = createHarness()
  const loading = open(listRow(3, '将失败'))
  await rejectNext(3)
  assert.equal((await loading).outcome, 'error')
  assert.equal(state.loadErrors, 1)
  assert.equal(state.dialogVisible, false)
  assert.equal(state.detailLoading, false)
}

{
  const { state, open, resolveNext } = createHarness()
  const first = open(listRow(11, '旧动态'))
  assert.equal(state.detailLoading, true)

  const created = await open()
  assert.equal(created.outcome, 'create')
  assert.equal(state.editingId, null)
  assert.equal(state.dialogVisible, true)
  assert.equal(state.detailLoading, false)
  assert.equal(state.form.title, '')
  assert.equal(state.form.content, '')
  assert.equal(isNewsDraftSaveLocked({ saving: false, detailLoading: state.detailLoading }), false)

  await resolveNext(11, detailRow(11, '旧正文不该写入', '<p>污染</p>'))
  assert.equal((await first).outcome, 'stale')
  assert.equal(state.form.title, '')
  assert.equal(state.form.content, '')
  assert.equal(state.dialogVisible, true)
  assert.equal(state.detailLoading, false)
  assert.equal(state.editingId, null)
}

{
  const { state, open, rejectNext } = createHarness()
  const first = open(listRow(12, '旧失败'))
  await open()
  await rejectNext(12)
  assert.equal((await first).outcome, 'stale')
  assert.equal(state.loadErrors, 0)
  assert.equal(state.dialogVisible, true)
  assert.equal(state.detailLoading, false)
  assert.equal(state.form.title, '')
}

{
  const { state, open, resolveNext } = createHarness()
  const first = open(listRow(21, '甲'))
  const second = open(listRow(22, '乙列表'))
  assert.equal(state.editingId, 22)
  assert.equal(state.detailLoading, true)
  assert.equal(state.form.title, '乙列表')

  await resolveNext(21, detailRow(21, '甲详情', '<p>甲</p>'))
  assert.equal((await first).outcome, 'stale')
  assert.equal(state.form.title, '乙列表')
  assert.equal(state.form.content, '')
  assert.equal(state.detailLoading, true)
  assert.equal(state.dialogVisible, true)

  await resolveNext(22, detailRow(22, '乙详情', '<p>乙</p>'))
  assert.equal((await second).outcome, 'loaded')
  assert.equal(state.form.title, '乙详情')
  assert.equal(state.form.content, '<p>乙</p>')
  assert.equal(state.detailLoading, false)
}

{
  const { state, open, rejectNext, resolveNext } = createHarness()
  const first = open(listRow(31, '同号'))
  const second = open(listRow(31, '同号再开'))
  assert.equal(state.editingId, 31)
  assert.equal(state.detailLoading, true)

  await rejectNext(31)
  assert.equal((await first).outcome, 'stale')
  assert.equal(state.loadErrors, 0)
  assert.equal(state.dialogVisible, true)
  assert.equal(state.detailLoading, true)

  await resolveNext(31, detailRow(31, '第二次详情', '<p>新</p>'))
  assert.equal((await second).outcome, 'loaded')
  assert.equal(state.form.content, '<p>新</p>')
  assert.equal(state.detailLoading, false)
}

{
  assert.equal(isNewsDraftSaveLocked({ saving: true, detailLoading: false }), true)
  assert.equal(isNewsDraftSaveLocked({ saving: false, detailLoading: false }), false)
}

const view = readFileSync(new URL('../admin/src/views/news/NewsListView.vue', import.meta.url), 'utf8')
assert.match(view, /createNewsDetailDialogSession/)
assert.match(view, /openNewsDetailDialog/)
assert.match(view, /isNewsDraftSaveLocked/)
assert.match(view, /:disabled="detailLoading"/)
assert.doesNotMatch(view, /const requestId = row\.id/)
assert.doesNotMatch(view, /if \(!row\) \{\s*return\s*\}/)

console.log('test-admin-news-detail-dialog OK')
