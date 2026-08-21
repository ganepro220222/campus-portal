/**
 * 报名页模块依赖静态检查
 * 运行：node miniapp/utils/enrollPageDeps.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const enrollPath = path.join(__dirname, '../packageC/activity/enroll.js')
const src = fs.readFileSync(enrollPath, 'utf8')

function mustInclude(snippet, message) {
  assert.ok(src.includes(snippet), message || `missing: ${snippet}`)
}

mustInclude("require('../../utils/enrollForm')", 'enroll.js must import enrollForm')
mustInclude('validateEnrollForm', 'enroll.js must use validateEnrollForm')
mustInclude("require('../../utils/voucherQrCanvas')", 'enroll.js must import voucherQrCanvas')
mustInclude('exportVoucherQr', 'enroll.js must reference exportVoucherQr')
mustInclude('resolveVoucherQrSrc', 'enroll.js must use resolveVoucherQrSrc')

console.log('[enrollPageDeps.test] PASS')
