/**
 * 报名页凭证二维码控制流单测
 * 运行：node miniapp/utils/enrollVoucherPage.test.js
 */
const assert = require('assert')
const { resolveVoucherQrSrc } = require('./enrollVoucherPage')

async function run() {
  const pending = await resolveVoucherQrSrc(
    { status: 'pending', voucherCode: 'SY1' },
    { exportLocalQr: async () => 'wxfile://local.png' }
  )
  assert.strictEqual(pending.showVoucherQr, false)
  assert.strictEqual(pending.usedLocal, false)

  let localCalls = 0
  const remote = await resolveVoucherQrSrc(
    {
      status: 'approved',
      voucherCode: 'SY9',
      qrCodeUrl: 'https://cdn.example.com/qr.png'
    },
    {
      exportLocalQr: async () => {
        localCalls++
        return 'wxfile://local.png'
      }
    }
  )
  assert.strictEqual(remote.showVoucherQr, true)
  assert.strictEqual(remote.voucherQrSrc, 'https://cdn.example.com/qr.png')
  assert.strictEqual(remote.usedLocal, false)
  assert.strictEqual(localCalls, 0)

  localCalls = 0
  const fromVoucherApi = await resolveVoucherQrSrc(
    { id: 3, status: 'approved', voucherCode: 'SY3', qrCodeUrl: '' },
    {
      fetchVoucherQrUrl: async () => 'https://cdn.example.com/from-api.png',
      exportLocalQr: async () => {
        localCalls++
        return 'wxfile://local.png'
      }
    }
  )
  assert.strictEqual(fromVoucherApi.voucherQrSrc, 'https://cdn.example.com/from-api.png')
  assert.strictEqual(localCalls, 0)

  localCalls = 0
  const local = await resolveVoucherQrSrc(
    { enrollId: 5, status: 'approved', voucherCode: 'SY5' },
    {
      fetchVoucherQrUrl: async () => '',
      exportLocalQr: async (text) => {
        localCalls++
        assert.ok(text.includes('SY5'))
        return 'wxfile://generated.png'
      }
    }
  )
  assert.strictEqual(local.showVoucherQr, true)
  assert.strictEqual(local.voucherQrSrc, 'wxfile://generated.png')
  assert.strictEqual(local.usedLocal, true)
  assert.strictEqual(localCalls, 1)

  let failed = false
  try {
    await resolveVoucherQrSrc(
      { status: 'approved', voucherCode: 'SY6' },
      {}
    )
  } catch (e) {
    failed = e.message.includes('exportLocalQr')
  }
  assert.strictEqual(failed, true)

  console.log('[enrollVoucherPage.test] PASS')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
