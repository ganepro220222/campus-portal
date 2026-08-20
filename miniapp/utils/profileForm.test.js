/**
 * 个人资料表单单测
 * 运行：node miniapp/utils/profileForm.test.js
 */
const assert = require('assert')
const {
  buildFormFromProfile,
  validateProfileForm,
  mergeSavedProfile,
  DEFAULT_COLLEGE
} = require('./profileForm')

const form = buildFormFromProfile({
  nickname: '小明',
  realName: '张三',
  phone: '13800138000',
  college: DEFAULT_COLLEGE,
  grade: '2024 级'
})
assert.strictEqual(form.nickname, '小明')
assert.strictEqual(form.realName, '张三')
assert.strictEqual(form.college, '')

const bad = validateProfileForm({ realName: '', phone: '' })
assert.strictEqual(bad.ok, false)

const badPhone = validateProfileForm({ realName: '张三', phone: '123' })
assert.strictEqual(badPhone.ok, false)

const good = validateProfileForm({
  nickname: '小明',
  realName: '张三',
  phone: '13800138000',
  college: '交通学院',
  grade: '2024 级'
})
assert.strictEqual(good.ok, true)
assert.strictEqual(good.payload.realName, '张三')
assert.strictEqual(good.payload.phone, '13800138000')

const merged = mergeSavedProfile({ nickname: '旧' }, { nickname: '新', realName: '李四' })
assert.strictEqual(merged.nickname, '新')
assert.strictEqual(merged.realName, '李四')

console.log('[profileForm.test] PASS')
