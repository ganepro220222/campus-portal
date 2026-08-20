/**
 * 首页入口矩阵单测
 * 运行：node miniapp/utils/homeNav.test.js
 */
const assert = require('assert')
const { mergeHomeNavItems, normalizePath, DEFAULT_ENTRIES } = require('./homeNav')

assert.strictEqual(normalizePath('pages/news/index'), '/pages/news/index')
assert.strictEqual(normalizePath('/pages/hall/index'), '/pages/hall/index')

const defaults = mergeHomeNavItems(null)
assert.strictEqual(defaults.length, DEFAULT_ENTRIES.length)
assert.strictEqual(defaults[0].label, '书院动态')
assert.strictEqual(defaults[0].toneClass, 'e1')

const mapped = mergeHomeNavItems([
  { id: 9, label: '智能问答', icon: 'robot', path: '/packageD/ai-chat/index' }
])
assert.strictEqual(mapped.length, 1)
assert.strictEqual(mapped[0].icon, 'robot')
assert.strictEqual(mapped[0].path, '/packageD/ai-chat/index')

console.log('[homeNav.test] PASS')
