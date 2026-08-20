/**
 * 个人资料表单：从 GET /profile 映射、校验、提交载荷
 */

const DEFAULT_COLLEGE = '贵州交通职业大学 · 中华文化书院'

function buildFormFromProfile(profile) {
  const p = profile || {}
  return {
    nickname: p.nickname || '',
    realName: p.realName || '',
    phone: p.phone || '',
    college: p.college && p.college !== DEFAULT_COLLEGE ? p.college : '',
    grade: p.grade || ''
  }
}

function isValidCnMobile(phone) {
  return /^1[3-9]\d{9}$/.test(String(phone || '').trim())
}

function validateProfileForm(form) {
  const nickname = String(form.nickname || '').trim()
  const realName = String(form.realName || '').trim()
  const phone = String(form.phone || '').trim()
  const college = String(form.college || '').trim()
  const grade = String(form.grade || '').trim()

  if (!realName) return { ok: false, message: '请填写姓名' }
  if (!phone) return { ok: false, message: '请填写手机号' }
  if (!isValidCnMobile(phone)) return { ok: false, message: '手机号格式不正确' }
  if (nickname.length > 32) return { ok: false, message: '昵称最多 32 字' }
  if (realName.length > 32) return { ok: false, message: '姓名最多 32 字' }
  if (college.length > 64) return { ok: false, message: '学院名称过长' }
  if (grade.length > 16) return { ok: false, message: '年级格式过长' }

  return {
    ok: true,
    payload: {
      nickname: nickname || undefined,
      realName,
      phone,
      college: college || undefined,
      grade: grade || undefined
    }
  }
}

function mergeSavedProfile(current, saved) {
  if (!saved) return current
  return { ...(current || {}), ...saved }
}

module.exports = {
  DEFAULT_COLLEGE,
  buildFormFromProfile,
  isValidCnMobile,
  validateProfileForm,
  mergeSavedProfile
}
