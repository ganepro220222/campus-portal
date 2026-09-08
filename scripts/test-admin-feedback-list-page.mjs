/**
 * 反馈后台列表：待处理筛选下回复后必须重载当前筛选页。
 * 用法：node scripts/test-admin-feedback-list-page.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import {
  FEEDBACK_REPLY_SUCCESS_MESSAGE,
  loadFeedbackListPage,
  runFeedbackReplyAndReload
} from '../admin/src/utils/feedbackListPage.mjs'

const require = createRequire(import.meta.url)
const { normalizeListPage } = require('./lib/listPageNormalize')
const { shouldApplyListResult } = require('./lib/listRequestSeq')

function item(id, status) {
  return { id, status, content: `反馈${id}`, reply: status === 'replied' ? '已处理' : '' }
}

function createStore(items) {
  const store = {
    items: items.map((row) => ({ ...row })),
    fetches: [],
    async fetchFeedbacks(page, size, status) {
      store.fetches.push({ page, size, status })
      const filtered = status
        ? store.items.filter((row) => row.status === status)
        : store.items
      const start = (page - 1) * size
      return {
        records: filtered.slice(start, start + size),
        total: filtered.length
      }
    },
    async replyFeedback(id, reply) {
      const row = store.items.find((it) => it.id === id)
      assert.ok(row, '回复目标必须存在')
      row.status = 'replied'
      row.reply = reply
      return { ...row }
    }
  }
  return store
}

async function loadFromStore(store, page, pageSize, statusFilter) {
  return loadFeedbackListPage({
    page,
    pageSize,
    statusFilter,
    fetchFeedbacks: store.fetchFeedbacks,
    normalizeListPage
  })
}

{
  const store = createStore([item(1, 'pending')])
  const loaded = await loadFromStore(store, 1, 20, 'pending')
  assert.equal(loaded.total, 1)
  assert.equal(loaded.records[0].status, 'pending')

  const messages = []
  const outcome = await runFeedbackReplyAndReload({
    currentId: 1,
    reply: '已收到',
    replyFeedback: store.replyFeedback,
    reloadList: async () => {
      const next = await loadFromStore(store, 1, 20, 'pending')
      loaded.records = next.records
      loaded.total = next.total
      loaded.page = next.page
    },
    onSaved({ successMessage }) {
      messages.push(successMessage)
    }
  })

  assert.equal(outcome.successMessage, FEEDBACK_REPLY_SUCCESS_MESSAGE)
  assert.equal(outcome.reloadFailed, false)
  assert.equal(outcome.updated.status, 'replied')
  assert.deepEqual(messages, [FEEDBACK_REPLY_SUCCESS_MESSAGE])
  assert.ok(store.fetches.some((call) => call.status === 'pending'))
  assert.equal(store.fetches.at(-1).status, 'pending')
  assert.equal(loaded.records.length, 0)
  assert.equal(loaded.total, 0)
  assert.equal(loaded.records.some((row) => row.id === 1), false)
}

{
  const store = createStore([item(1, 'pending'), item(2, 'replied')])
  const loaded = await loadFromStore(store, 1, 20, undefined)
  const outcome = await runFeedbackReplyAndReload({
    currentId: 1,
    reply: '已处理',
    replyFeedback: store.replyFeedback,
    reloadList: async () => {
      const next = await loadFromStore(store, 1, 20, undefined)
      loaded.records = next.records
      loaded.total = next.total
    }
  })
  assert.equal(outcome.reloadFailed, false)
  assert.equal(loaded.total, 2)
  const replied = loaded.records.find((row) => row.id === 1)
  assert.ok(replied)
  assert.equal(replied.status, 'replied')
}

{
  const items = Array.from({ length: 21 }, (_, i) => item(i + 1, 'pending'))
  const store = createStore(items)
  const first = await loadFromStore(store, 2, 20, 'pending')
  assert.equal(first.page, 2)
  assert.equal(first.records.length, 1)
  assert.equal(first.total, 21)

  const loaded = { ...first }
  await runFeedbackReplyAndReload({
    currentId: first.records[0].id,
    reply: '已处理',
    replyFeedback: store.replyFeedback,
    reloadList: async () => {
      const next = await loadFromStore(store, loaded.page, 20, 'pending')
      loaded.page = next.page
      loaded.records = next.records
      loaded.total = next.total
    }
  })
  assert.equal(loaded.page, 1)
  assert.equal(loaded.total, 20)
  assert.equal(loaded.records.length, 20)
  assert.equal(loaded.records.some((row) => row.status === 'replied'), false)
}

{
  const store = createStore([item(1, 'pending')])
  const messages = []
  const outcome = await runFeedbackReplyAndReload({
    currentId: 1,
    reply: '已收到',
    replyFeedback: store.replyFeedback,
    reloadList: async () => {
      throw new Error('列表刷新失败')
    },
    onSaved({ successMessage }) {
      messages.push(successMessage)
    }
  })
  assert.equal(outcome.reloadFailed, true)
  assert.equal(outcome.updated.status, 'replied')
  assert.deepEqual(messages, [FEEDBACK_REPLY_SUCCESS_MESSAGE])
  assert.equal(messages.some((text) => String(text).includes('回复失败')), false)
}

{
  const store = createStore([item(1, 'pending'), item(2, 'pending')])
  let latestSeq = 0
  let applied = null
  async function load(statusFilter, seq) {
    const result = await loadFromStore(store, 1, 20, statusFilter)
    if (!shouldApplyListResult(seq, latestSeq)) {
      return
    }
    applied = { statusFilter, total: result.total, ids: result.records.map((row) => row.id) }
  }
  const firstSeq = ++latestSeq
  const pendingPromise = load('pending', firstSeq)
  const secondSeq = ++latestSeq
  await load('replied', secondSeq)
  await pendingPromise
  assert.equal(applied.statusFilter, 'replied')
  assert.equal(applied.total, 0)
}

const view = readFileSync(new URL('../admin/src/views/feedback/FeedbackListView.vue', import.meta.url), 'utf8')
assert.match(view, /loadFeedbackListPage/)
assert.match(view, /runFeedbackReplyAndReload/)
assert.match(view, /shouldApplyListResult/)
assert.match(view, /listRequestSeq/)
assert.doesNotMatch(view, /list\.value\[idx\]\s*=\s*updated/)
assert.doesNotMatch(view, /回复失败/)

console.log('test-admin-feedback-list-page OK')
