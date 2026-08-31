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
  assert.strictEqual(a.lead, '示例内容。部分展馆已支持语音导览。')
}

// 正文已是富文本时，摘要首字下沉仍要从 summary 拆，不能被 useRichText 关掉
{
  const a = mergeNewsArticle({
    summary: '示例内容。常用资料已归类整理。',
    content: '<p>扩写后的正文</p>',
  }, {})
  assert.strictEqual(a.useRichText, true)
  assert.strictEqual(a.showLead, true)
  assert.strictEqual(a.drop, '示')
  assert.strictEqual(a.leadRest, '例内容。常用资料已归类整理。')
  assert.strictEqual(a.drop + a.leadRest, a.lead)
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

// ---------- 摘要：仅显式 summary 才单独展示 lead，避免与正文首段重复 ----------
{
  const a = mergeNewsArticle({
    content: '第一段正文\n第二段正文',
    paras: ['第一段正文', '第二段正文'],
    lead: '第一段正文',
  }, {})
  assert.strictEqual(a.showLead, false)
  assert.strictEqual(a.lead, '')
  assert.strictEqual(a.paras.length, 2)
}
{
  const a = mergeNewsArticle({
    summary: '这是摘要',
    content: '第一段正文\n第二段正文',
    paras: ['第一段正文', '第二段正文'],
  }, {})
  assert.strictEqual(a.showLead, true)
  assert.strictEqual(a.lead, '这是摘要')
  assert.strictEqual(a.drop + a.leadRest, '这是摘要')
}

const news = mergeNewsArticle({ id: 1, title: '标题', content: '正文\n第二段' }, {})
assert.strictEqual(news.id, 1)
assert.strictEqual(news.title, '标题')
assert.ok(news.paras.length >= 1)

console.log('[content.test] PASS')
