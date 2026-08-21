/**
 * 活动报名表单单测
 * 运行：node miniapp/utils/enrollForm.test.js
 */
const assert = require('assert')
const {
  resolveEnrollFields,
  validateEnrollForm
} = require('./enrollForm')

const profile = {
  realName: '李四',
  phone: '13900139000',
  college: '交通学院',
  grade: '2023 级'
}

assert.deepStrictEqual(
  resolveEnrollFields({ name: '', phone: '', college: '', grade: '' }, profile),
  { name: '李四', phone: '13900139000', college: '交通学院', grade: '2023 级' }
)

assert.deepStrictEqual(
  resolveEnrollFields({ name: '王五', phone: '13800138001', college: '', grade: '' }, profile),
  { name: '王五', phone: '13800138001', college: '交通学院', grade: '2023 级' }
)

const emptyName = validateEnrollForm({ name: '', phone: '13800138000' }, null)
assert.strictEqual(emptyName.ok, false)
assert.strictEqual(emptyName.field, 'name')

const emptyPhone = validateEnrollForm({ name: '张三', phone: '' }, null)
assert.strictEqual(emptyPhone.ok, false)
assert.strictEqual(emptyPhone.field, 'phone')

const shortPhone = validateEnrollForm({ name: '张三', phone: '1' }, null)
assert.strictEqual(shortPhone.ok, false)
assert.strictEqual(shortPhone.field, 'phone')

const badSegment = validateEnrollForm({ name: '张三', phone: '11111111111' }, null)
assert.strictEqual(badSegment.ok, false)
assert.strictEqual(badSegment.field, 'phone')

const fromProfile = validateEnrollForm({ name: '', phone: '', college: '', grade: '' }, profile)
assert.strictEqual(fromProfile.ok, true)
assert.strictEqual(fromProfile.payload.phone, '13900139000')

const overridePhone = validateEnrollForm({ name: '张三', phone: '13800138000' }, { phone: '1' })
assert.strictEqual(overridePhone.ok, true)
assert.strictEqual(overridePhone.payload.phone, '13800138000')

const badProfilePhone = validateEnrollForm({ name: '', phone: '', college: '', grade: '' }, {
  realName: '张三',
  phone: '123456'
})
assert.strictEqual(badProfilePhone.ok, false)
assert.strictEqual(badProfilePhone.field, 'phone')

function simulateSubmitOrder(form, profile, hooks) {
  const validation = validateEnrollForm(form, profile)
  if (!validation.ok) {
    return { subscribed: false, submitted: false, validation }
  }
  hooks.requestSubscribe && hooks.requestSubscribe()
  hooks.submit && hooks.submit(validation.payload)
  return { subscribed: true, submitted: true, validation }
}

let subscribeCalls = 0
let submitCalls = 0
simulateSubmitOrder({ name: '张三', phone: '1' }, null, {
  requestSubscribe: () => { subscribeCalls++ },
  submit: () => { submitCalls++ }
})
assert.strictEqual(subscribeCalls, 0)
assert.strictEqual(submitCalls, 0)

subscribeCalls = 0
submitCalls = 0
simulateSubmitOrder({ name: '张三', phone: '13800138000' }, null, {
  requestSubscribe: () => { subscribeCalls++ },
  submit: () => { submitCalls++ }
})
assert.strictEqual(subscribeCalls, 1)
assert.strictEqual(submitCalls, 1)

console.log('[enrollForm.test] PASS')
