/**
 * 内容映射单测
 * 运行：node miniapp/utils/content.test.js
 */
const assert = require('assert')
const {
  resolveEmptyContentObject,
  mergeNewsArticle,
  stripUnsafeHtml,
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
  assert.strictEqual(short.dropCap, false, '短摘要不下沉，改走 raised cap')
  assert.strictEqual(short.drop, '书', 'dropCap 为假时 drop/leadRest 仍照常产出，页面才能抬高首字')
  assert.strictEqual(short.drop + short.leadRest, short.lead)
  assert.strictEqual(short.showLead, true)

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

{
  const html = '<p style="text-align:center"><span style="color:#c0392b">红字</span></p>'
    + '<ul style="list-style-type:disc"><li>条目</li></ul>'
    + '<table><tr><td>单元格</td></tr></table>'
    + '<img src="https://cdn.example.com/a.png" width="320">'
  const out = stripUnsafeHtml(html)
  assert.ok(out.includes('text-align:center'))
  assert.ok(out.includes('color:#c0392b'))
  assert.ok(out.includes('list-style-type:disc'))
  assert.ok(out.includes('<table>'))
  assert.ok(out.includes('https://cdn.example.com/a.png'))
  assert.ok(!/script/i.test(stripUnsafeHtml(html + '<script>alert(1)</script>')))
}

{
  const a = mergeNewsArticle({
    summary: '这是摘要',
    content: '<h2 style="font-size:24px">标题</h2><p style="text-align:justify">正文</p>'
  }, {})
  assert.strictEqual(a.useRichText, true)
  assert.ok(a.contentHtml.includes('font-size:24px'))
  assert.ok(a.contentHtml.includes('text-align:justify'))
}

/* 引文与插图：rich-text 不认外部 class，样式只能内联进去。 */
{
  const a = mergeNewsArticle({
    content: '<p>正文</p><blockquote>引一句</blockquote>'
      + '<img src="https://cdn.example.com/a.png">'
  }, {})
  assert.ok(/<blockquote[^>]*style="[^"]*border-left:6rpx solid/.test(a.contentHtml),
    'blockquote 应当被注入左沿木线')
  assert.ok(/<img[^>]*style="[^"]*border:1rpx solid/.test(a.contentHtml),
    'img 应当被裱在纸托上')
  assert.ok(a.contentHtml.includes('https://cdn.example.com/a.png'), '原 src 不能丢')
}

/* 作者自己写的样式排在后面，同属性时**作者赢**——不覆盖排版意图。 */
{
  const a = mergeNewsArticle({
    content: '<blockquote style="text-align:center;color:#111">居中的引文</blockquote>'
  }, {})
  const m = /<blockquote[^>]*style="([^"]*)"/.exec(a.contentHtml)
  assert.ok(m, '应当还有 style')
  assert.ok(m[1].indexOf('color:#4C505C') < m[1].indexOf('color:#111'),
    '注入的字色必须排在作者的前面，才会被作者覆盖')
  assert.ok(m[1].includes('text-align:center'), '作者的排版要保留')
}

/* 没有这两种节点时一个字都不该动 */
{
  const plain = '<p style="text-align:justify">只有段落</p>'
  const a = mergeNewsArticle({ content: plain }, {})
  assert.strictEqual(a.contentHtml, plain)
}

/* 粘来的白底要摘掉——否则纸底 #F7F3E8 上每段正文后面拖一块纯白。
   用户报的就是这个：「后台编辑并上传的动态，在小程序端看到文字会有一个白底」。 */
{
  const a = mergeNewsArticle({
    content: '<p style="background:#fff;text-align:justify">第一段</p>'
      + '<section style="background-color: rgb(255, 255, 255)"><span>第二段</span></section>'
  }, {})
  assert.ok(!/background/i.test(a.contentHtml), '正文里不该再有任何背景声明：' + a.contentHtml)
  assert.ok(a.contentHtml.includes('text-align:justify'), '作者的对齐方式要留着')
  assert.ok(a.contentHtml.includes('第二段'), '文字一个都不能丢')
}

/* 有意打的荧光笔是排版意图，不替人做主删 */
{
  const a = mergeNewsArticle({
    content: '<p>看<span style="background-color:#FFFF00">这里</span></p>'
  }, {})
  assert.ok(a.contentHtml.includes('background-color:#FFFF00'), '饱和色高亮要保留')
}

/* 插图的纸托 #F6F2E6 得活下来。
   它躲过这一刀靠的是阈值（最小通道 230 < 240），不是先后顺序——
   顺序调换过来这条一样过。真正的理由在 content.js 里：只过作者的 HTML，
   我们自己注入的样式压根不进这道过滤。 */
{
  const a = mergeNewsArticle({ content: '<p>正文</p><img src="a.png">' }, {})
  assert.ok(/<img[^>]*background:#F6F2E6/.test(a.contentHtml),
    '插图的纸托底色不能被白底过滤吃掉：' + a.contentHtml)
}

const news = mergeNewsArticle({ id: 1, title: '标题', content: '正文\n第二段' }, {})
assert.strictEqual(news.id, 1)
assert.strictEqual(news.title, '标题')
assert.ok(news.paras.length >= 1)

console.log('[content.test] PASS')
