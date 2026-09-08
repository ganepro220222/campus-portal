/**
 * 关联小程序列表须走已导出的 get，不能引用不存在的 request。
 * 运行：node miniapp/utils/collegeListPage.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const src = fs.readFileSync(path.join(__dirname, '../packageC/college/list.js'), 'utf8')
assert.match(src, /const \{ get \} = require\('\.\.\/\.\.\/utils\/request'\)/)
assert.match(src, /get\('\/colleges'\)/)
assert.doesNotMatch(src, /\{ request \}/)
assert.doesNotMatch(src, /request\('\/colleges'/)

const requestMod = require('./request')
assert.equal(typeof requestMod.get, 'function')
assert.equal(typeof requestMod.request, 'undefined')

console.log('[collegeListPage.test] PASS')
