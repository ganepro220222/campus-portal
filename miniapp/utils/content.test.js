/**
 * 内容映射单测
 * 运行：node miniapp/utils/content.test.js
 */
const assert = require('assert')
const {
  resolveEmptyContentObject,
  mergeNewsArticle,
  displayWidth,
  shouldDropCap,
  DROP_CAP_MIN_DISPLAY_WIDTH
} = require('./content')

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

// ---------- 首字下沉的开关：摘要不足两行就不下沉 ----------
{
  assert.strictEqual(DROP_CAP_MIN_DISPLAY_WIDTH, 22)
  assert.strictEqual(displayWidth('书院'), 2)
  assert.strictEqual(displayWidth('abcd'), 2)
  assert.strictEqual(displayWidth('书院ab'), 3)
  assert.strictEqual(displayWidth(''), 0)
  assert.strictEqual(displayWidth(null), 0)
  assert.strictEqual(displayWidth('😀'), 1)

  assert.strictEqual(shouldDropCap('一'.repeat(21)), false)
  assert.strictEqual(shouldDropCap('一'.repeat(22)), true)
  assert.strictEqual(shouldDropCap('a'.repeat(22)), false)
  assert.strictEqual(shouldDropCap('a'.repeat(44)), true)
  assert.strictEqual(shouldDropCap(''), false)

  const short = mergeNewsArticle({ summary: '书院春季开放。' }, {})
  assert.strictEqual(short.dropCap, false, '短摘要不下沉，避免大字悬空')
  assert.strictEqual(short.drop, '书', 'dropCap 为假时 drop/leadRest 仍照常产出')
  assert.strictEqual(short.drop + short.leadRest, short.lead)

  const long = mergeNewsArticle({
    summary: '国家级非物质文化遗产牙舟陶数字展陈，汇集百余件 3D 数字化展品。'
  }, {})
  assert.strictEqual(long.dropCap, true)
  assert.strictEqual(long.drop + long.leadRest, long.lead)
}

// emoji 按码点切开，不得留下孤立 UTF-16 代理项
{
  const emoji = '😀'
  const a = mergeNewsArticle({
    summary: emoji + '国家级非物质文化遗产牙舟陶数字展陈汇集百余件展品。'
  }, {})
  assert.strictEqual(a.drop, emoji)
  assert.notStrictEqual(a.drop, a.lead.charAt(0), '不得按 UTF-16 码元切开 emoji')
  assert.strictEqual(a.drop + a.leadRest, a.lead)
  assert.ok(a.leadRest.charCodeAt(0) !== 0xDE00)
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
