/**
 * 登录说法与「无法登录」问答单测
 * 运行：node miniapp/utils/loginHelp.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  ACCOUNT_LABEL,
  INITIAL_PASSWORD_RULE,
  FIELD_TIPS,
  DEFAULT_LOGIN_POLICY,
  normalizeLoginHelp,
  accountTip,
  accountLengthHint,
  loginFaqItems,
  wxLoginFailureToast,
  WX_BIND_PROMPT,
  shouldPromptWxBindAfterPasswordChange,
  initialLoginPanel
} = require('./loginHelp')

/* —— 叫法 —— */
assert.strictEqual(ACCOUNT_LABEL, '学号 / 工号')
assert.ok(FIELD_TIPS.account.includes('学生填学号') && FIELD_TIPS.account.includes('教师填工号'))
/* 密码问号直接写出初始密码是什么，并且提前说清 6 位不是长期密码 */
assert.ok(FIELD_TIPS.password.includes('身份证号后 6 位'), FIELD_TIPS.password)
assert.ok(FIELD_TIPS.password.includes('学号 / 工号后 6 位'), FIELD_TIPS.password)
assert.ok(FIELD_TIPS.password.includes('X 要大写'), '库里存的是大写 X，输小写登不上')
assert.ok(FIELD_TIPS.password.includes('至少 8 位'))
assert.ok(!FIELD_TIPS.password.includes('学院告知'), '不再让人去问学院初始密码是什么')
/* 知识库《登录与账号》是同一套说法，书院助手答的要和问号一致 */
const kb = fs.readFileSync(path.join(__dirname, '../../sql/knowledge/02-login-account.md'), 'utf8')
for (const phrase of ['身份证号后 6 位', '学号 / 工号后 6 位', 'X 要大写']) {
  assert.ok(kb.includes(phrase), `知识库《登录与账号》没写「${phrase}」，和登录页问号对不上`)
}

/* —— 接口值的清洗 —— */
assert.deepStrictEqual(normalizeLoginHelp(null), {
  ...DEFAULT_LOGIN_POLICY, studentDigits: 0, staffDigits: 0, phone: '', email: ''
})
assert.deepStrictEqual(normalizeLoginHelp({
  maxFailAttempts: 3, lockMinutes: 10, failWindowMinutes: 30, phone: ' 0851-1234567 ', email: 'a@b.cn'
}), { maxFailAttempts: 3, lockMinutes: 10, failWindowMinutes: 30, studentDigits: 0, staffDigits: 0,
  phone: '0851-1234567', email: 'a@b.cn' })
/* 越界、非数字、缺失都退回默认，不把 0 次、负数写进问答 */
const bad = normalizeLoginHelp({ maxFailAttempts: 0, lockMinutes: -5, failWindowMinutes: 'x', phone: 123 })
assert.strictEqual(bad.maxFailAttempts, 5)
assert.strictEqual(bad.lockMinutes, 5)
assert.strictEqual(bad.failWindowMinutes, 15)
assert.strictEqual(bad.phone, '')
/* 超长的联系方式当作脏数据丢掉，不撑破版面 */
assert.strictEqual(normalizeLoginHelp({ phone: '1'.repeat(41) }).phone, '')

/* —— 学号 / 工号位数（号码都是编的） —— */
const FMT = { studentDigits: 12, staffDigits: 7 }
assert.strictEqual(accountTip(FMT), '学生填 12 位学号，教师填 7 位工号。由学校统一导入，不需要注册。')
assert.strictEqual(accountTip(null), FIELD_TIPS.account, '位数取不到：照旧，不写数')
/* 只给一项、给 0、越界：都当不知道，不写半截格式 */
for (const bad of [{ studentDigits: 12 }, { studentDigits: 12, staffDigits: 0 }, { studentDigits: 99, staffDigits: 7 }]) {
  const n = normalizeLoginHelp(bad)
  assert.strictEqual(n.studentDigits + n.staffDigits, 0, JSON.stringify(bad))
}
assert.strictEqual(accountLengthHint('123456789012', FMT), '')
assert.strictEqual(accountLengthHint(' 1234567 ', FMT), '', '首尾空格登录时会去掉，不算错')
assert.strictEqual(accountLengthHint('', FMT), '', '没填不提醒')
assert.strictEqual(accountLengthHint('12345678901', FMT), '学号 12 位、工号 7 位，这里填了 11 位，请核对')
assert.ok(accountLengthHint('T2024', FMT).includes('只有数字'))
assert.strictEqual(accountLengthHint('12345678901', null), '', '位数不知道就不提醒')

/* —— 问答 —— */
const faq = loginFaqItems(null)
assert.deepStrictEqual(faq.map((x) => x.id), ['first', 'bind', 'forgot', 'locked', 'rebind', 'disabled'],
  '问答只收这 6 条，顺序按人真正会问的来')
for (const item of faq) {
  assert.ok(item.q && item.q.length <= 20, `问题要短：${item.q}`)
  assert.ok(Array.isArray(item.a) && item.a.length >= 1)
  for (const para of item.a) {
    /* 不放任何像真证件号的例子（15/18 位数字串） */
    assert.ok(!/\d{15,18}/.test(para), `问答里出现了像证件号的数字串：${para}`)
    /* 要人填的那个号统一叫「学号 / 工号」，不再单写「账号」让人去猜 */
    assert.ok(!/(输入|填写?|填)账号/.test(para), `问答里又让人「填账号」：${para}`)
  }
}
/* 锁定说明跟着接口值走，不写死 5 / 5 */
const locked = loginFaqItems({ maxFailAttempts: 3, lockMinutes: 30, failWindowMinutes: 60 })
  .find((x) => x.id === 'locked').a[0]
assert.ok(locked.includes('60 分钟内连续输错 3 次') && locked.includes('锁定 30 分钟'), locked)
/* 「第一次登录」问答写出初始密码，并说清管理员重置过的用临时密码 */
const firstAnswer = faq.find((x) => x.id === 'first').a.join('')
assert.ok(firstAnswer.includes(INITIAL_PASSWORD_RULE), firstAnswer)
assert.ok(firstAnswer.includes('两种都试'), firstAnswer)
assert.ok(firstAnswer.includes('临时密码'), firstAnswer)
const firstWithDigits = loginFaqItems(FMT).find((x) => x.id === 'first').a[0]
assert.ok(firstWithDigits.startsWith('学生填 12 位学号，教师填 7 位工号。'), firstWithDigits)
assert.ok(faq.find((x) => x.id === 'first').a[0].startsWith('学生填学号，教师填工号。'))
const lockedDefault = faq.find((x) => x.id === 'locked').a[0]
assert.ok(lockedDefault.includes('15 分钟内连续输错 5 次') && lockedDefault.includes('锁定 5 分钟'))
/* 换微信那条必须写清「联系管理员解绑」以及数据还在 */
const rebind = faq.find((x) => x.id === 'rebind').a.join('')
assert.ok(rebind.includes('管理员') && rebind.includes('解绑') && rebind.includes('都还在'))

/* —— 微信登录失败：服务器原文不能被盖掉 —— */
assert.strictEqual(wxLoginFailureToast({ code: 400, message: '微信授权码无效或已过期，请重新登录' }), '',
  'request.js 已经弹出服务器原文，页面不能再盖一层')
assert.strictEqual(wxLoginFailureToast({ code: 429, message: '账号已锁定，请5分钟后再试' }), '')
assert.strictEqual(wxLoginFailureToast({ code: 401, authExpired: true }), '')
assert.strictEqual(wxLoginFailureToast({ errMsg: 'request:fail timeout' }), '', '网络失败 request.js 已提示')
/* 只有 wx.login 本身失败（请求没发出去）才需要页面兜底 */
assert.ok(wxLoginFailureToast(new Error('wx.login 失败')))
assert.ok(wxLoginFailureToast({ errMsg: 'login:fail' }))
assert.ok(wxLoginFailureToast(undefined))

/* —— 绑定询问 —— */
assert.ok(WX_BIND_PROMPT.confirmText.length <= 4 && WX_BIND_PROMPT.cancelText.length <= 4,
  'wx.showModal 的按钮文字最多 4 个字')
assert.ok(WX_BIND_PROMPT.content.includes('不绑也能继续用'), '要说清不绑的后果，而不是只催人绑')
assert.strictEqual(shouldPromptWxBindAfterPasswordChange('forced', { wxBound: false }), true,
  '首次改密成功、还没绑微信：必须问——原来这条路直接回首页，新用户绑不上')
assert.strictEqual(shouldPromptWxBindAfterPasswordChange('forced', { wxBound: true }), false)
assert.strictEqual(shouldPromptWxBindAfterPasswordChange('voluntary', { wxBound: false }), false)
assert.strictEqual(shouldPromptWxBindAfterPasswordChange('wx', { wxBound: false }), false)
assert.strictEqual(shouldPromptWxBindAfterPasswordChange('forced', null), false)
/* 字段缺失（老后端）不当成「没绑」去打扰 */
assert.strictEqual(shouldPromptWxBindAfterPasswordChange('forced', {}), false)

/* —— 默认面板 —— */
assert.strictEqual(initialLoginPanel('account'), 'account')
assert.strictEqual(initialLoginPanel('wx'), 'wx')
assert.strictEqual(initialLoginPanel(''), 'wx')
assert.strictEqual(initialLoginPanel(undefined), 'wx')

console.log('[loginHelp.test] PASS')
