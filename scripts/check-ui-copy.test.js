#!/usr/bin/env node
const assert = require('assert')
const { stripJsComments, dialogChunksFromJs } = require('./check-ui-copy')

const commented = [
  '// wx.showModal({ title: "预留", content: "待甲方提供" })',
  '/* wx.showToast({ title: "一期占位符" }) */',
  'wx.showModal({ title: "该功能即将开放，敬请期待", content: "当前请使用小程序跳转" })'
].join('\n')

assert.ok(!stripJsComments(commented).includes('预留'))
assert.ok(!stripJsComments(commented).includes('甲方'))
const okChunks = dialogChunksFromJs(commented)
assert.strictEqual(okChunks.length, 2)
assert.ok(okChunks.every((c) => !/预留|甲方/.test(c.text)))

const live = `
  wx.showModal({
    title: '接口同步（预留）',
    content: '待甲方提供 API',
    confirmText: '知道了'
  })
`
const banned = dialogChunksFromJs(live)
assert.strictEqual(banned.length, 3)
assert.ok(banned.some((c) => c.text.includes('预留')))
assert.ok(banned.some((c) => c.text.includes('甲方')))

console.log('check-ui-copy.test OK')
