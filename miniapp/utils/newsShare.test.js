/**
 * 动态分享参数单测
 * 运行：node miniapp/utils/newsShare.test.js
 */
const assert = require('assert')
const { buildNewsShareAppMessage, buildNewsShareTimeline, buildNewsDetailPath } = require('./newsShare')

const msg = buildNewsShareAppMessage({ title: '测试标题', cover: 'https://cdn/a.jpg' }, 42)
assert.strictEqual(msg.title, '测试标题')
assert.strictEqual(msg.path, '/packageA/news/detail?id=42')
assert.strictEqual(msg.imageUrl, 'https://cdn/a.jpg')

const fallback = buildNewsShareAppMessage(null, null)
assert.strictEqual(fallback.title, '书院动态')
assert.strictEqual(fallback.path, '/pages/news/index')
assert.strictEqual(fallback.imageUrl, undefined)

const tl = buildNewsShareTimeline({ title: '朋友圈标题' }, 7)
assert.strictEqual(tl.title, '朋友圈标题')
assert.strictEqual(tl.query, 'id=7')

assert.strictEqual(buildNewsDetailPath(9), '/packageA/news/detail?id=9')
assert.strictEqual(buildNewsDetailPath(null), '')

console.log('[newsShare.test] PASS')
