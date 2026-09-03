/**
 * 首页入口矩阵单测
 * 运行：node miniapp/utils/homeNav.test.js
 */
const assert = require('assert')
const { mergeHomeNavItems, normalizePath, DEFAULT_ENTRIES } = require('./homeNav')
const { ENABLE_AI_CHAT } = require('../config/features')

assert.strictEqual(normalizePath('pages/news/index'), '/pages/news/index')
assert.strictEqual(normalizePath('/pages/hall/index'), '/pages/hall/index')

const defaults = mergeHomeNavItems(null)
assert.strictEqual(defaults.length, DEFAULT_ENTRIES.length)
assert.strictEqual(defaults[0].label, '书院动态')
assert.strictEqual(defaults[0].toneClass, 'e1')

const mapped = mergeHomeNavItems([
  { id: 9, label: '智能问答', icon: 'robot', path: '/packageD/ai-chat/index' },
  { id: 2, label: '展馆展示', icon: 'museum', path: '/pages/hall/index' }
])
if (ENABLE_AI_CHAT) {
  assert.strictEqual(mapped.length, 2)
  assert.strictEqual(mapped[0].icon, 'robot')
  assert.strictEqual(mapped[0].path, '/packageD/ai-chat/index')
} else {
  assert.strictEqual(mapped.length, 1)
  assert.strictEqual(mapped[0].path, '/pages/hall/index')
}

console.log('[homeNav.test] PASS')
