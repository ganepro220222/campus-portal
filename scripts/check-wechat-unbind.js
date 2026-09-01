#!/usr/bin/env node
/**
 * 「管理员解绑微信」这条链路的完整性。
 *
 * 为什么值得一条独立护栏：这个功能不是从需求来的，是从一处**文档与实现脱节**暴露出来的。
 * 内置知识库《登录与账号》早就写着「联系管理员解绑」，而那份知识库是 AI 助手答学生问题的
 * 检索源——学生问了、AI 照着答了、管理员打开后台却找不到任何入口。在补上之前，后台唯一
 * 沾边的手段是「清退」，可清退会清空学号、重新导入产生新的 member_id，而报名、学习进度、
 * 积分、徽章都挂在旧 id 上，等于把这名学生一个学期的记录清零。
 *
 * 所以这里同时钉住三样东西，任何一样单独存在都会重新制造那个坑：
 *   1) 知识库承诺了 → 后端就必须有 unbindWechat；
 *   2) 后端有了 → 后台就必须有按钮，否则管理员照样找不到；
 *   3) 解绑必须递增 tokenVersion，且不能顺手改 status。
 *
 * 用法：node scripts/check-wechat-unbind.js
 */
const fs = require('node:fs')
const path = require('node:path')

const root = process.env.WECHAT_UNBIND_CHECK_ROOT || path.resolve(__dirname, '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

const errs = []

const service = read('backend/src/main/java/com/shuyuan/backend/service/AdminMemberService.java')
const controller = read('backend/src/main/java/com/shuyuan/backend/controller/admin/AdminMemberController.java')
const api = read('admin/src/api/member.ts')
const view = read('admin/src/views/member/MemberListView.vue')
const knowledge = read('sql/knowledge/02-login-account.md')

// ---------- 1) 知识库承诺 ↔ 后端实现 ----------
const promisesUnbind = /联系.*管理员.*解绑|管理员.*解绑/.test(knowledge)
const hasService = /public Map<String, Object> unbindWechat\(/.test(service)
if (promisesUnbind && !hasService) {
  errs.push('知识库承诺了「联系管理员解绑」，但 AdminMemberService 没有 unbindWechat —— '
    + 'AI 助手会照着这句话答学生，管理员却找不到入口')
}
if (hasService && !promisesUnbind) {
  errs.push('后端有解绑能力，知识库却没写怎么用 —— 学生问 AI 时得不到正确指引')
}
/*
 * 承诺里必须指出具体位置，只说「联系管理员」等于把管理员也一起丢在原地。
 *
 * 必须锚定到讲解绑的那一段再查：全文搜「师生账号」会命中开头那句
 * 「所有师生账号由学校或学院的管理员在管理后台统一导入或新增」，
 * 于是把指引删干净了检查照样绿——这条断言第一版就是这么空掉的。
 */
if (promisesUnbind) {
  const unbindParagraph = knowledge
    .split(/\n{2,}/)
    .find((p) => /解绑/.test(p) && /管理员/.test(p)) || ''
  if (!/师生账号/.test(unbindParagraph) || !/解绑微信/.test(unbindParagraph)) {
    errs.push('讲解绑的那段没有写清入口（「师生账号」页面的「解绑微信」按钮）'
      + ' —— 管理员收到工单也不知道点哪里')
  }
}

// ---------- 2) 后端 → 接口 → 前端按钮，一条都不能断 ----------
if (!/@PutMapping\("\/\{id\}\/unbind-wechat"\)/.test(controller)) {
  errs.push('AdminMemberController 缺少 /{id}/unbind-wechat 接口')
}
if (!/unbindMemberWechat/.test(api)) {
  errs.push('admin/src/api/member.ts 缺少 unbindMemberWechat')
}
if (!/onUnbindWechat/.test(view) || !/解绑微信/.test(view)) {
  errs.push('师生账号页缺少「解绑微信」按钮 —— 后端做了但管理员点不到，等于没做')
}
// 未绑定的行摆一个点了必然报错的按钮没有意义
if (!/row\.wxBound[\s\S]{0,200}?onUnbindWechat|onUnbindWechat[\s\S]{0,200}?row\.wxBound/.test(view)) {
  errs.push('「解绑微信」按钮未按 row.wxBound 条件显示')
}

// ---------- 3) 解绑本身的两条硬约束 ----------
const body = (service.match(/public Map<String, Object> unbindWechat\([\s\S]*?\n    \}/) || [''])[0]
if (!body) {
  errs.push('找不到 unbindWechat 方法体')
} else {
  if (!/TokenVersionSupport\.bump|getTokenVersion\(\)[^)]*\+ 1/.test(body)) {
    errs.push('解绑未递增 tokenVersion —— 被解绑那台手机上的旧 JWT 还能继续用，'
      + '而「微信号被盗」正是这个功能的主要场景')
  }
  if (/set\(Member::getStatus/.test(body)) {
    errs.push('解绑顺手改了 status —— 解绑不是禁用，学号密码必须照常能登')
  }
  if (!/StudentPasswordPolicy\.placeholderOpenid/.test(body)) {
    errs.push('解绑没有还原成 acct:<学号> 占位 openid —— '
      + 'AuthService 靠 isPlaceholderOpenid 判断未绑定，还原不对等于没解绑')
  }
  if (!/\.eq\(Member::getOpenid, member\.getOpenid\(\)\)/.test(body)) {
    errs.push('解绑的 update 未带原 openid 做条件 —— '
      + '两个管理员同时点、或本人刚绑了新微信时，会把新绑的微信又解掉')
  }
}

if (errs.length) {
  console.error('check-wechat-unbind 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log('check-wechat-unbind OK')
