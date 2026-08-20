/**
 * 报名凭证二维码单测
 * 运行：node miniapp/utils/enrollVoucher.test.js
 */
const assert = require('assert')
const {
  buildVoucherQrText,
  pickRemoteQrSrc,
  shouldShowVoucherQr,
  mapEnrollVoucherFields,
  VOUCHER_QR_PREFIX
} = require('./enrollVoucher')
const { buildMatrix } = require('./voucherQrCanvas')

assert.strictEqual(buildVoucherQrText('SYABC123'), `${VOUCHER_QR_PREFIX}SYABC123`)
assert.strictEqual(buildVoucherQrText(''), '')
assert.strictEqual(buildVoucherQrText(null), '')

assert.strictEqual(pickRemoteQrSrc('https://cdn.example.com/qr.png'), 'https://cdn.example.com/qr.png')
assert.strictEqual(pickRemoteQrSrc('data:image/png;base64,abc'), '')
assert.strictEqual(pickRemoteQrSrc(''), '')

assert.strictEqual(shouldShowVoucherQr('approved', 'SY1'), true)
assert.strictEqual(shouldShowVoucherQr('pending', 'SY1'), false)
assert.strictEqual(shouldShowVoucherQr('approved', ''), false)

const mapped = mapEnrollVoucherFields({ id: 9, status: 'approved', voucherCode: 'SY9', qrCodeUrl: 'https://a/b.png' })
assert.strictEqual(mapped.enrollId, 9)
assert.strictEqual(mapped.voucherCode, 'SY9')
assert.strictEqual(mapped.qrCodeUrl, 'https://a/b.png')

const qr = buildMatrix(buildVoucherQrText('SYTEST001'))
assert.ok(qr.getModuleCount() >= 21)

console.log('[enrollVoucher.test] PASS')
