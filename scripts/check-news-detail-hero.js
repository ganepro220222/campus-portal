#!/usr/bin/env node
/**
 * 动态详情页的两条约定，都出过实际可见的毛病。
 *
 * 1) 首字下沉的契约：drop 是首字，leadRest 是**去掉首字之后**的剩余，lead 保持完整原文。
 *    原来 WXML 渲染的是 `{{drop}}{{lead}}`，于是「示例内容…」显示成「示」+「示例内容…」，
 *    首字凭空多一个。而 mock 当年是手写 drop:'六' 配 lead:'月五日起…'（lead 已被截过），
 *    与接口口径正好相反——两套契约并存，改错一边就变成吃字。
 *    lead 必须保持完整：富文本正文那条分支单独渲染整段 lead，截短了那里会少首字。
 *
 * 2) 头图必须始终有深色底：标题是白字。底色不能指望 colorClass——那是列表页的装饰，
 *    详情接口不下发它，真实数据里 class 是空的，于是没有封面时整块纯白、
 *    标题只剩一点 text-shadow 的影子。而且详情页一度压根没接封面，
 *    上传了封面也只在列表里露脸。
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
if (!/leadRest:\s*lead\s*\?\s*lead\.slice\(1\)/.test(content)) {
  errs.push('content.js 的 leadRest 不是 lead.slice(1)，drop + leadRest 将无法还原 lead')
}
if (/drop:\s*raw\.drop/.test(content)) {
  errs.push('content.js 又开始信任外部下发的 drop —— mock 与接口口径相反，会重复或吃字')
}
// 富文本分支必须仍然渲染完整 lead，不能顺手改成 leadRest
if (!/class="art-lead">\{\{article\.lead\}\}/.test(wxml)) {
  errs.push('富文本分支必须渲染完整 article.lead，改成 leadRest 会吃掉首字')
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
if (!/class="art-hero-img"/.test(wxml)) {
  errs.push('detail.wxml 未渲染封面（art-hero-img）—— 上传的封面只会出现在列表里')
}
if (!/mode="\{\{article\.coverImageMode\}\}"/.test(wxml)) {
  errs.push('封面未按 coverImageMode 渲染，后台的「裁切填满 / 完整显示」设置会失效')
}
if (!/coverImageMode:/.test(content)) {
  errs.push('content.js 未产出 coverImageMode，详情页拿不到封面展示方式')
}
// 取 .art-hero 规则本身（先剥注释，否则注释里提到的 .art-hero 会把匹配带偏）
const heroRule = (wxss.replace(/\/\*[\s\S]*?\*\//g, '').match(/\.art-hero\s*\{[^}]*\}/) || [''])[0]
if (!heroRule) {
  errs.push('detail.wxss 里找不到 .art-hero 规则')
} else if (!/background:/.test(heroRule)) {
  errs.push('.art-hero 没有兜底背景色 —— 无封面时白色标题会压在白底上，等于看不见')
}
if (!/class="art-hero-scrim"/.test(wxml) || !/\.art-hero-scrim/.test(wxss)) {
  errs.push('缺少封面压暗层 art-hero-scrim —— 浅色封面上白色标题会糊掉')
}

if (errs.length) {
  console.error('check-news-detail-hero 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log('check-news-detail-hero OK')
