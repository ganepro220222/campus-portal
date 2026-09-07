#!/usr/bin/env node
/**
 * 第二轮小程序交互护栏：收藏 busy、失败态、搜索序号、消息已读。
 * 用法：node scripts/check-miniapp-interaction-guards.js
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const errors = []

function mustMatch(rel, re, msg) {
  if (!re.test(read(rel))) {
    errors.push(`${rel}：${msg}`)
  }
}

function mustNotMatch(rel, re, msg) {
  if (re.test(read(rel))) {
    errors.push(`${rel}：${msg}`)
  }
}

for (const rel of [
  'miniapp/packageA/hall/detail.js',
  'miniapp/packageA/craft/detail.js',
  'miniapp/packageB/course/detail.js'
]) {
  mustMatch(rel, /favoriteBusy/, '收藏必须有 busy 标志')
  mustMatch(rel, /\.catch\s*\(/, '收藏失败必须 catch')
  mustMatch(rel, /操作失败/, '收藏失败必须 toast')
}

mustMatch('miniapp/packageB/resource/list.js', /collectingId/, '资源列表收藏必须有 busy 标志')
mustMatch('miniapp/packageB/resource/list.js', /onShow\s*\(/, '资源列表必须 onShow 静默刷新')
mustMatch('miniapp/packageB/resource/list.js', /FEED_LOAD\.pullRefresh/, '静默刷新必须走 pullRefresh 而不是 loadMore')
mustMatch('miniapp/packageB/resource/list.js', /\.catch\s*\(/, '资源收藏失败必须 catch')

mustMatch('miniapp/packageD/ai-chat/history.js', /error:\s*!/, '历史页失败必须置 error')
mustNotMatch('miniapp/packageD/ai-chat/history.js', /list:\s*\[\].*loading:\s*false/, '历史页失败不得把 list 清空伪装成空态')
mustMatch('miniapp/packageD/ai-chat/history.wxml', /error && !list\.length/, '历史页失败必须与空态分叉')

mustMatch('miniapp/packageC/profile/edit.js', /error:\s*true/, '资料编辑失败必须置 error')
mustMatch('miniapp/packageC/profile/edit.js', /this\.data\.error/, '资料编辑失败态禁止保存')
mustMatch('miniapp/packageC/profile/edit.wxml', /wx:elif="\{\{error\}\}"/, '资料编辑失败必须独立分支')

mustMatch('miniapp/packageC/search/index.js', /bumpListGeneration/, '搜索必须有 generation 守卫')
mustMatch('miniapp/packageC/search/index.js', /isStaleListRequest/, '搜索过期响应必须丢弃')

mustNotMatch(
  'miniapp/packageC/message/index.js',
  /await put\(`\/messages\/\$\{id\}\/read`\)/,
  '有落地页时不得 await 标已读再跳转'
)
mustMatch('miniapp/packageC/message/index.js', /silent:\s*true/, '标已读失败不得用默认 toast 挡到详情页')
mustMatch('miniapp/packageC/message/index.js', /revertMessageReadLocally/, '无落地页时标已读失败必须能回滚本地状态')
mustMatch('miniapp/packageC/message/index.js', /已读状态同步失败/, '留在消息中心时标已读失败必须提示')
mustMatch(
  'miniapp/packageC/message/index.js',
  /if \(this\._navigating\) return[\s\S]*已读状态同步失败/,
  '已跳转详情时不得因标已读失败弹 toast'
)
mustMatch(
  'miniapp/packageC/message/index.js',
  /read-all[\s\S]*_bumpReadSyncGen/,
  '全部已读成功后必须推进代际，否则迟到的单条 PUT 失败会造出幽灵未读'
)

const ci = read('.github/workflows/ci.yml')
if (!ci.includes('check:miniapp-interaction-guards')) {
  errors.push('ci.yml 必须跑 check:miniapp-interaction-guards，否则这组护栏拦不住合并')
}

if (errors.length) {
  console.error('check-miniapp-interaction-guards 失败：')
  errors.forEach((e) => console.error('  - ' + e))
  process.exit(1)
}

console.log('check-miniapp-interaction-guards OK')
