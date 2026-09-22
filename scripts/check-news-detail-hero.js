#!/usr/bin/env node
/**
 * 动态详情页的两条约定，都出过实际可见的毛病。
 *
 * 1) 首字下沉的契约：drop 是首字，leadRest 是**去掉首字之后**的剩余，lead 保持完整原文。
 *    原来 WXML 渲染的是 `{{drop}}{{lead}}`，于是「示例内容…」显示成「示」+「示例内容…」，
 *    首字凭空多一个。而 mock 当年是手写 drop:'六' 配 lead:'月五日起…'（lead 已被截过），
 *    与接口口径正好相反——两套契约并存，改错一边就变成吃字。
 *    展示一律 drop + leadRest；正文是不是富文本都要首字下沉，
 *    否则后台一保存（content 变成 HTML）摘要首字会突然变回正常大小。
 *
 * 2) 卷首的三条约定。这一条**换过一次前提**，原因写在下面。
 *
 *    旧约定是「头图必须始终有深色底，因为标题是白字」。那是上一版的版面：
 *    标题压在图上。真实数据里 colorClass 是空的（详情接口不下发它），
 *    所以没封面时整块纯白、白标题只剩一点 text-shadow 的影子——
 *    那一条防的就是这个。
 *
 *    定稿把版面换了：**标题落在纸上，不压在画上**（封面是用户传的，
 *    花成什么样都不该影响读标题）。于是「深色底 + 压暗层」两条一起失去意义：
 *    再留着就是两条守着不存在的东西的空护栏。换成这一版的三条：
 *
 *      a. 封面要渲染，且按 coverImageMode 渲染（这一条没变，
 *         详情页一度压根没接封面，上传了也只在列表里露脸）。
 *      b. 卷首的画**始终在**：封面图是裱成册页压在画上的，不是替掉画。
 *         画没了，没封面的文章顶上就是一块白。
 *      c. 标题在纸上，不在画上：.ah-title 要在，.art-hero-title 不许回来。
 *
 * 用法：node scripts/check-news-detail-hero.js
 */
const fs = require('node:fs')
const path = require('node:path')

const root = process.env.NEWS_HERO_CHECK_ROOT || path.resolve(__dirname, '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

const wxml = read('miniapp/packageA/news/detail.wxml')
const wxss = read('miniapp/packageA/news/detail.wxss')
const content = read('miniapp/utils/content.js')
const mock = read('miniapp/mock/defaults.js')

const errs = []

// ---------- 1) 首字下沉 ----------
if (/\{\{article\.drop\}\}\s*<\/text>\s*\{\{article\.lead\}\}/.test(wxml)) {
  errs.push('detail.wxml 又把 drop 和完整 lead 拼在一起了 —— 首字会重复显示，应渲染 leadRest')
}
if (!/\{\{article\.drop\}\}<\/text>\{\{article\.leadRest\}\}/.test(wxml.replace(/\s+</g, '<'))) {
  errs.push('detail.wxml 的首字下沉分支未渲染 article.leadRest')
}
if (!/leadChars\s*=\s*lead\s*\?\s*Array\.from\(lead\)/.test(content)) {
  errs.push('content.js 未按码点拆 lead —— emoji 会被切成半个代理项')
}
if (!/leadRest:\s*leadChars\.slice\(1\)\.join\(/.test(content)) {
  errs.push('content.js 的 leadRest 不是 leadChars.slice(1).join，drop + leadRest 将无法还原 lead')
}
if (/drop:\s*raw\.drop/.test(content)) {
  errs.push('content.js 又开始信任外部下发的 drop —— mock 与接口口径相反，会重复或吃字')
}
if (/class="art-lead">\{\{article\.lead\}\}/.test(wxml)) {
  errs.push('摘要区又改回整段 lead —— 正文一变成富文本，首字下沉就会消失')
}
/*
 * 短摘要不再整段渲染 lead：一律 drop + leadRest。
 * dropCap 只决定形态（下沉 vs 行内抬高），不能再把短摘要打回普通字号，
 * 否则老师对比两条动态会以为短的那条坏了。
 */
if (/art-lead--plain/.test(wxml) && /\{\{article\.lead\}\}/.test(wxml)) {
  errs.push('短摘要分支又整段渲染 lead —— 短摘要会丢掉首字放大')
}
if (!/article\.dropCap/.test(wxml)) {
  errs.push('detail.wxml 未使用 dropCap —— 无法区分下沉与 raised cap')
}
if (!/drop--raised/.test(wxml) || !/\.drop--raised/.test(wxss)) {
  errs.push('短摘要未做 drop--raised —— 不够两行的摘要会看起来像没放大')
}
if (!/dropCap:\s*shouldDropCap\(lead\)/.test(content)) {
  errs.push('content.js 未按 shouldDropCap 产出 dropCap')
}
const leadRule = (wxss.replace(/\/\*[\s\S]*?\*\//g, '').match(/\.art-lead\s*\{[^}]*\}/) || [''])[0]
if (!leadRule) {
  errs.push('detail.wxss 里找不到 .art-lead 规则')
} else if (!/overflow:\s*hidden|display:\s*flow-root/.test(leadRule)) {
  errs.push('.art-lead 未建立 BFC —— float 的首字会横穿摘要区底部的虚线')
}
if (/useRichText/.test(wxml) && /showLead/.test(wxml) && /!article\.useRichText/.test(wxml)) {
  errs.push('首字下沉又只挂在纯文本分支 —— 后台保存后摘要首字会变回正常大小')
}
// 摘要区仅在管理员填写 summary 时显示，避免自动 lead 与正文首段重复
if (!/article\.showLead/.test(wxml)) {
  errs.push('detail.wxml 未使用 showLead —— 无摘要时正文首段会与 lead 重复显示')
}
if (!/showLead/.test(content)) {
  errs.push('content.js 未产出 showLead，无法区分「真实摘要」与「正文首段推导 lead」')
}
// 先剥注释：解释「早先这里是 drop:'六'」的那段注释本身就含这个写法，
// 连注释一起扫会把说明文字判成违规
const mockCode = mock.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1')
if (/drop:\s*'/.test(mockCode)) {
  errs.push('mock/defaults.js 又手写了 drop —— lead 应存完整原文，由 content.js 自行拆分')
}

// ---------- 2) 头图 ----------
if (!/class="[^"]*\bart-hero-img\b[^"]*"/.test(wxml)) {
  errs.push('detail.wxml 未渲染封面（art-hero-img）—— 上传的封面只会出现在列表里')
}
if (!/mode="\{\{article\.coverImageMode\}\}"/.test(wxml)) {
  errs.push('封面未按 coverImageMode 渲染，后台的「裁切填满 / 完整显示」设置会失效')
}
if (!/coverImageMode:/.test(content)) {
  errs.push('content.js 未产出 coverImageMode，详情页拿不到封面展示方式')
}
// b. 卷首那幅画始终在，封面只是裱在它上面的一方册页
if (!/class="art-hero-shan"[\s\S]*?hero-shan-art\.png/.test(wxml)) {
  errs.push('卷首少了那幅画（art-hero-shan / hero-shan-art.png）—— ' +
            '没有封面的文章顶上会是一块白，而画是这套方案的身份')
}
{
  // 取那张 <image> 的整个开标签。
  // 不能写成 /<image class="art-hero-shan"[^>]*>/ —— 那要求 class 紧跟 <image，
  // 一旦有人在前面插了 wx:if（正是这里要防的那种改动）就匹配不到，
  // 于是 `|| ['']` 兜出空串，测试通过。变异测试里就是这么漏掉的。
  // 改成「先找到 art-hero-shan，再往两边扩到标签边界」，属性顺序随便写。
  const i = wxml.indexOf('art-hero-shan')
  const tag = i < 0 ? '' : wxml.slice(wxml.lastIndexOf('<', i), wxml.indexOf('>', i) + 1)
  if (tag && /wx:if|wx:elif|wx:else/.test(tag)) {
    errs.push('卷首那幅画挂了条件 —— 它必须无条件渲染，封面是压在它上面的，不是替掉它')
  }
}
if (!/class="hero-mount mount"/.test(wxml) || !/\.hero-mount/.test(wxss)) {
  errs.push('封面没有裱成册页（hero-mount + mount）—— 封面会直接铺满卷首把画挤掉')
}
// c. 标题在纸上
if (/art-hero-title/.test(wxml) || /\.art-hero-title/.test(wxss)) {
  errs.push('标题又压回画上了（art-hero-title）—— ' +
            '封面是用户传的，花成什么样都不该影响读标题；标题走 .ah-title，落在纸上')
}
if (!/class="ah-title serif"/.test(wxml)) {
  errs.push('detail.wxml 少了纸上的标题 .ah-title')
}
{
  // .ah-title 必须在 .sheet 里面 —— 在 .art-hero 里就又压回画上了
  const heroBlock = wxml.slice(wxml.indexOf('class="art-hero"'), wxml.indexOf('class="sheet"'))
  if (heroBlock && /ah-title/.test(heroBlock)) {
    errs.push('.ah-title 落在 .art-hero 里 —— 标题应该在 .sheet（纸）上')
  }
}

if (errs.length) {
  console.error('check-news-detail-hero 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log('check-news-detail-hero OK')
