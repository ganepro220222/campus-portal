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

// ---------- 首字下沉：drop + leadRest 拼起来必须等于 lead ----------
{
  const a = mergeNewsArticle({ id: 1, title: 'T', summary: '示例内容。部分展馆已支持语音导览。' }, {})
  assert.strictEqual(a.drop, '示')
  assert.strictEqual(a.leadRest, '例内容。部分展馆已支持语音导览。')
  assert.strictEqual(a.drop + a.leadRest, a.lead, 'drop + leadRest 必须还原成完整 lead')
  // lead 要保持完整：富文本分支单独渲染整段 lead，截短了会吃首字
  assert.strictEqual(a.lead, '示例内容。部分展馆已支持语音导览。')
}

// 外部传来的 drop 一律忽略——mock 与接口曾用相反口径，信任它就会重复或吃字
{
  const a = mergeNewsArticle({ drop: '六', summary: '六月五日起开放。' }, {})
  assert.strictEqual(a.drop, '六')
  assert.strictEqual(a.leadRest, '月五日起开放。')
  assert.strictEqual(a.drop + a.leadRest, '六月五日起开放。')
}

// 空 lead 不能崩，也不能渲染出 undefined
{
  const a = mergeNewsArticle({ id: 2, title: 'T' }, {})
  assert.strictEqual(a.drop, '')
  assert.strictEqual(a.leadRest, '')
}

// 单字摘要：drop 拿走唯一的字，leadRest 为空
{
  const a = mergeNewsArticle({ summary: '好' }, {})
  assert.strictEqual(a.drop, '好')
  assert.strictEqual(a.leadRest, '')
}

// ---------- 封面展示方式随详情一起下发 ----------
assert.strictEqual(mergeNewsArticle({ coverFitMode: 'fit' }, {}).coverImageMode, 'aspectFit')
assert.strictEqual(mergeNewsArticle({ coverFitMode: 'fill' }, {}).coverImageMode, 'aspectFill')
assert.strictEqual(mergeNewsArticle({}, {}).coverImageMode, 'aspectFill')

const news = mergeNewsArticle({ id: 1, title: '标题', content: '正文\n第二段' }, {})
assert.strictEqual(news.id, 1)
assert.strictEqual(news.title, '标题')
assert.ok(news.paras.length >= 1)

console.log('[content.test] PASS')
