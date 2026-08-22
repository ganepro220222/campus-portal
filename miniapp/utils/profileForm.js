/**
 * 个人资料表单：从 GET /profile 映射、校验、提交载荷
 */

const DEFAULT_COLLEGE = '中华文化书院'

/*
 * 这些不是「用户填的机构」，而是界面在没有值时显示的占位串。
 * profile 里一旦存成它们（早期数据导入或旧版本写回），编辑表单要按「未填写」处理，
 * 否则用户一进编辑页就看到一个自己没填过的机构名。
 * 旧串必须一并保留——改文案不会回头去洗历史数据。
 */
const PLACEHOLDER_COLLEGES = [DEFAULT_COLLEGE, '贵州交通职业大学 · 中华文化书院']

function buildFormFromProfile(profile) {
  const p = profile || {}
  return {
    nickname: p.nickname || '',
    realName: p.realName || '',
    phone: p.phone || '',
    college: p.college && !PLACEHOLDER_COLLEGES.includes(p.college) ? p.college : '',
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
  PLACEHOLDER_COLLEGES,
  buildFormFromProfile,
  isValidCnMobile,
  validateProfileForm,
  mergeSavedProfile
}
