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

mustMatch('miniapp/packageC/message/index.js', /已读状态同步失败/, '单项标已读失败必须提示')
mustMatch(
  'miniapp/packageC/message/index.js',
  /await put\(`\/messages\/\$\{id\}\/read`\)[\s\S]*readStatus:\s*1[\s\S]*catch/,
  '标已读成功才更新本地状态（失败路径不得先乐观更新）'
)

if (errors.length) {
  console.error('check-miniapp-interaction-guards 失败：')
  errors.forEach((e) => console.error('  - ' + e))
  process.exit(1)
}

console.log('check-miniapp-interaction-guards OK')
