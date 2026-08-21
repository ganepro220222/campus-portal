// utils/enrollForm.js — 活动报名表单：合并个人资料、校验、提交载荷

const { isValidCnMobile } = require('./profileForm')

const LIMITS = {
  name: 32,
  college: 64,
  grade: 16
}

function resolveEnrollFields(form, profile) {
  const f = form || {}
  const p = profile || {}
  return {
    name: String(f.name || p.realName || '').trim(),
    phone: String(f.phone || p.phone || '').trim(),
    college: String(f.college || p.college || '').trim(),
    grade: String(f.grade || p.grade || '').trim()
  }
}

function buildEnrollPayload(resolved) {
  const payload = {
    name: resolved.name,
    phone: resolved.phone
  }
  if (resolved.college) payload.college = resolved.college
  if (resolved.grade) payload.grade = resolved.grade
  return payload
}

function validateEnrollForm(form, profile) {
  const resolved = resolveEnrollFields(form, profile)

  if (!resolved.name) {
    return { ok: false, message: '请填写姓名', field: 'name' }
  }
  if (resolved.name.length > LIMITS.name) {
    return { ok: false, message: '姓名最多 32 字', field: 'name' }
  }
  if (!resolved.phone) {
    return { ok: false, message: '请填写手机号', field: 'phone' }
  }
  if (!isValidCnMobile(resolved.phone)) {
    return { ok: false, message: '请输入正确的 11 位手机号', field: 'phone' }
  }
  if (resolved.college.length > LIMITS.college) {
    return { ok: false, message: '学院名称过长', field: 'college' }
  }
  if (resolved.grade.length > LIMITS.grade) {
    return { ok: false, message: '年级格式过长', field: 'grade' }
  }

  return {
    ok: true,
    payload: buildEnrollPayload(resolved),
    resolved
  }
}

module.exports = {
  LIMITS,
  resolveEnrollFields,
  buildEnrollPayload,
  validateEnrollForm
}
