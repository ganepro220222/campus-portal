/**
 * 小程序码响应校验单测
 * 运行：node miniapp/utils/wxacode.test.js
 */
const assert = require('assert')
const { parseWxacodeResponse } = require('./wxacode')

assert.deepStrictEqual(parseWxacodeResponse(null), { ok: false, reason: 'unavailable' })
assert.deepStrictEqual(parseWxacodeResponse({ available: false }), { ok: false, reason: 'unavailable' })
assert.deepStrictEqual(parseWxacodeResponse({ available: true }), { ok: false, reason: 'empty' })
assert.deepStrictEqual(parseWxacodeResponse({ available: true, imageBase64: '   ' }), { ok: false, reason: 'empty' })

const ok = parseWxacodeResponse({ available: true, imageBase64: 'iVBORw0KGgo=' })
assert.strictEqual(ok.ok, true)
assert.strictEqual(ok.base64, 'iVBORw0KGgo=')

console.log('[wxacode.test] PASS')
