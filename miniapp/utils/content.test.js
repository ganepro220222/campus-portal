/**
 * 内容映射单测
 * 运行：node miniapp/utils/content.test.js
 */
const assert = require('assert')
const { resolveEmptyContentObject, mergeNewsArticle } = require('./content')

assert.strictEqual(resolveEmptyContentObject({}, false), null)
assert.ok(resolveEmptyContentObject({ title: 'mock' }, true).title)

const { useMock } = require('../config/env')
if (!useMock) {
  assert.strictEqual(mergeNewsArticle(null, {}), null)
}

const news = mergeNewsArticle({ id: 1, title: '标题', content: '正文\n第二段' }, {})
assert.strictEqual(news.id, 1)
assert.strictEqual(news.title, '标题')
assert.ok(news.paras.length >= 1)

console.log('[content.test] PASS')
