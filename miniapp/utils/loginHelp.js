// utils/loginHelp.js — 登录页、改密页、「无法登录」问答共用的文案
// 要人填的号一律叫「学号 / 工号」；「账号」只指账号本身（停用、清退、安全）。
// 与知识库《登录与账号》同一套说法，页面只取用，不另写。

const ACCOUNT_LABEL = '学号 / 工号'

/* 问号只答本格。初始密码的具体取法先不写出来：
   没有身份证时用的是学号后 6 位，学号在同学之间是公开的 */
const FIELD_TIPS = {
  account: '学生填学号，教师填工号。由学校统一导入，不需要注册。',
  password: '第一次登录用学院告知的初始密码。进门后要换成新密码：至少 8 位，同时包含字母和数字。'
}

/* 同后端 ShuyuanProperties.Login 默认值；实际值由 /auth/login-help 下发（可被环境变量改） */
const DEFAULT_LOGIN_POLICY = {
  maxFailAttempts: 5,
  lockMinutes: 5,
  failWindowMinutes: 15
}

function boundedInt(value, fallback, min, max) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  const i = Math.round(n)
  if (i < min || i > max) return fallback
  return i
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return ''
  const t = value.trim()
  return t.length > maxLength ? '' : t
}

/** 越界或缺失退回默认；联系方式只收短字符串 */
function normalizeLoginHelp(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}
  return {
    maxFailAttempts: boundedInt(r.maxFailAttempts, DEFAULT_LOGIN_POLICY.maxFailAttempts, 1, 100),
    lockMinutes: boundedInt(r.lockMinutes, DEFAULT_LOGIN_POLICY.lockMinutes, 1, 1440),
    failWindowMinutes: boundedInt(r.failWindowMinutes, DEFAULT_LOGIN_POLICY.failWindowMinutes, 1, 1440),
    phone: cleanText(r.phone, 40),
    email: cleanText(r.email, 80)
  }
}

/** 「无法登录」问答，按常见程度排序；不放任何像证件号的例子 */
function loginFaqItems(policy) {
  const p = normalizeLoginHelp(policy)
  return [
    {
      id: 'first',
      q: '第一次登录，该填什么？',
      a: [
        '学生填学号，教师填工号。账号由学校统一导入，不需要注册。',
        '密码填学院告知的初始密码。登录后会要求马上换成新密码：至少 8 位，同时包含字母和数字。',
        '也可以直接点「微信一键登录」：这个微信还没绑定时，系统会请你填同一组学号 / 工号和密码，顺带完成绑定。'
      ]
    },
    {
      id: 'bind',
      q: '为什么要绑定微信？',
      a: [
        '绑定后点「微信一键登录」就能进，不用再输密码；忘记密码时，也能用这个微信验证后自己设新密码。',
        '不绑也能继续用，只是每次都要输学号 / 工号和密码，忘了密码只能请管理员重置。',
        '一个学号 / 工号只能绑一个微信，一个微信也只能绑一个学号 / 工号。'
      ]
    },
    {
      id: 'forgot',
      q: '忘记密码怎么办？',
      a: [
        '这个微信已经绑定过：在登录页点「忘记密码」，用微信验证后直接设新密码。',
        '还没绑定：小程序里无法自助找回，请联系学院管理员重置。管理员会给你一个临时密码，登录后要马上换成自己的新密码。'
      ]
    },
    {
      id: 'locked',
      q: '密码输错太多次，被锁了？',
      a: [
        `${p.failWindowMinutes} 分钟内连续输错 ${p.maxFailAttempts} 次，这个学号 / 工号会锁定 ${p.lockMinutes} 分钟，到时间自动解锁。`,
        '想不起密码就别反复试，按上一条「忘记密码」找回。'
      ]
    },
    {
      id: 'rebind',
      q: '换了微信、绑错了，或者微信号丢了？',
      a: [
        '小程序里不能自己解绑，请联系学院管理员在后台解绑微信。提示「已绑定其他微信」也是同一条路。',
        '解绑后学号 / 工号和密码照样能登录，再点「微信一键登录」用新微信重新绑定即可。收藏、报名、学习进度和积分都还在。',
        '如果密码也忘了：请管理员先解绑、再重置密码，才会得到一个能当面或电话告知的临时密码。'
      ]
    },
    {
      id: 'disabled',
      q: '提示账号不可用或已被禁用？',
      a: [
        '可能是管理员停用了这个账号，或者账号已经清退（比如毕业、离职）。小程序里无法自行恢复，请联系学院管理员确认。'
      ]
    }
  ]
}

/** 业务错误与网络失败 request.js 已弹原文，页面再弹会顶掉；只在 wx.login 本身失败时兜底 */
function wxLoginFailureToast(err) {
  if (err && err.code != null) return ''
  if (err && typeof err.errMsg === 'string' && /^request:/.test(err.errMsg)) return ''
  return '微信登录没有完成，请重试'
}

/* 绑定询问：学号登录后、首次改密后共用；showModal 按钮最多 4 字 */
const WX_BIND_PROMPT = {
  title: '绑定这个微信？',
  content: '绑定后点「微信一键登录」就能进，忘记密码也能用这个微信自己找回。不绑也能继续用，下次还要输学号 / 工号和密码。',
  confirmText: '现在绑定',
  cancelText: '以后再说'
}

/** 只在被要求改密（首次登录、管理员重置）且未绑微信时问；原来新用户改完直接回首页，永远绑不上 */
function shouldPromptWxBindAfterPasswordChange(mode, loginData) {
  return mode === 'forced' && !!loginData && loginData.wxBound === false
}

/* 上次用学号 / 工号进来的，下次默认展开表单 */
const LAST_LOGIN_METHOD_KEY = 'lastLoginMethod'

function initialLoginPanel(lastMethod) {
  return lastMethod === 'account' ? 'account' : 'wx'
}

module.exports = {
  ACCOUNT_LABEL,
  FIELD_TIPS,
  DEFAULT_LOGIN_POLICY,
  normalizeLoginHelp,
  loginFaqItems,
  wxLoginFailureToast,
  WX_BIND_PROMPT,
  shouldPromptWxBindAfterPasswordChange,
  LAST_LOGIN_METHOD_KEY,
  initialLoginPanel
}
