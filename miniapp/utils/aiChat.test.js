/**
 * AI 会话映射单测
 * 运行：node miniapp/utils/aiChat.test.js
 */
const assert = require('assert')
const { mapSessionItem, mapMessagesToUi } = require('./aiChat')

const session = mapSessionItem({
  id: 12,
  createdAt: '2026-07-20 14:30',
  preview: '阳明心学的核心思想是什么？'
})
assert.strictEqual(session.id, 12)
assert.strictEqual(session.title, '阳明心学的核心思想是什么？')
assert.strictEqual(session.createdAt, '2026-07-20 14:30')

const fallback = mapSessionItem({ id: 3, createdAt: '2026-07-19 09:00' })
assert.strictEqual(fallback.title, '暂无提问')

const ui = mapMessagesToUi([
  { role: 'user', content: '你好' },
  { role: 'assistant', content: '您好，我是书院助手。' }
])
assert.strictEqual(ui.length, 2)
assert.strictEqual(ui[0].role, 'me')
assert.strictEqual(ui[0].text, '你好')
assert.strictEqual(ui[1].role, 'ai')
assert.strictEqual(ui[1].text, '您好，我是书院助手。')

console.log('[aiChat.test] PASS')
