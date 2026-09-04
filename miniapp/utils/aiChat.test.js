/**
 * AI 会话映射单测
 * 运行：node miniapp/utils/aiChat.test.js
 */
const assert = require('assert')
const { mapSessionItem, mapMessagesToUi } = require('./aiChat')

const session = mapSessionItem({
  id: 12,
  createdAt: '2026-07-20 14:30',
  preview: '阳明心学的核心思想是什么？'
})
assert.strictEqual(session.id, 12)
assert.strictEqual(session.title, '阳明心学的核心思想是什么？')
assert.strictEqual(session.createdAt, '2026-07-20 14:30')

const fallback = mapSessionItem({ id: 3, createdAt: '2026-07-19 09:00' })
assert.strictEqual(fallback.title, '暂无提问')

const ui = mapMessagesToUi([
  { role: 'user', content: '你好' },
  { role: 'assistant', content: '您好，我是知识问答。' }
])
assert.strictEqual(ui.length, 2)
assert.strictEqual(ui[0].role, 'me')
assert.strictEqual(ui[0].text, '你好')
assert.strictEqual(ui[1].role, 'ai')
assert.strictEqual(ui[1].text, '您好，我是知识问答。')

// ---------- 超时：服务端多半已经答完并存好了 ----------
const { resolveErrorAnswer, isTimeoutError, isNetworkError, exhaustedQuota, ASK_TIMEOUT } = require('./aiChat')
const { _resolveTimeout, DEFAULT_TIMEOUT } = require('./request')

assert.ok(isTimeoutError({ errMsg: 'request:fail timeout' }))
assert.ok(isTimeoutError({ errMsg: 'request:fail TIMEOUT' }))
assert.ok(!isTimeoutError({ errMsg: 'request:fail net::ERR_CONNECTION_REFUSED' }))
assert.ok(!isTimeoutError({ code: 429 }))
assert.ok(!isTimeoutError(null))

assert.ok(isNetworkError({ errMsg: 'request:fail net::ERR_CONNECTION_REFUSED' }))
assert.ok(isNetworkError({ errMsg: 'request:fail network is down' }))
assert.ok(!isNetworkError({ errMsg: 'request:fail timeout' }))
assert.ok(!isNetworkError({ code: 502, message: 'AI 服务暂时不可用' }))
assert.ok(!isNetworkError(null))

// 超时不能再让用户去「确认登录、录入知识库」——那和真实原因南辕北辙
const timeoutAnswer = resolveErrorAnswer({ errMsg: 'request:fail timeout' })
assert.ok(timeoutAnswer.includes('重新进入本次会话'), timeoutAnswer)
assert.ok(!timeoutAnswer.includes('知识库'), timeoutAnswer)

assert.ok(resolveErrorAnswer({ errMsg: 'request:fail net::ERR_CONNECTION_REFUSED' }).includes('网络'))
assert.ok(resolveErrorAnswer({ errMsg: 'request:fail network is down' }).includes('网络'))
assert.ok(!resolveErrorAnswer({ errMsg: 'request:fail net::ERR_CONNECTION_REFUSED' }).includes('知识库'))

// 有 body.code 的业务错误优先按业务处理，不能被超时/网络分支抢走
assert.strictEqual(resolveErrorAnswer({ code: 429, message: '今日问答次数已用完，请明天再来' }),
  '今日问答次数已用完，请明天再来')
assert.strictEqual(resolveErrorAnswer({ code: 401 }), '请先登录后再使用知识问答。')
assert.strictEqual(resolveErrorAnswer({ code: 502, message: 'AI 服务暂时不可用，请稍后重试' }),
  'AI 服务暂时不可用，请稍后重试')
assert.ok(resolveErrorAnswer({}).includes('服务暂时不可用'))
assert.ok(!resolveErrorAnswer({}).includes('知识库'))

// AI 提问必须比默认超时宽：10 秒不够走完「检索 + 大模型生成」
assert.ok(ASK_TIMEOUT > DEFAULT_TIMEOUT, `ASK_TIMEOUT=${ASK_TIMEOUT} 必须大于默认 ${DEFAULT_TIMEOUT}`)
assert.strictEqual(_resolveTimeout({ timeout: ASK_TIMEOUT }), ASK_TIMEOUT)
assert.strictEqual(_resolveTimeout({}), DEFAULT_TIMEOUT)
assert.strictEqual(_resolveTimeout(undefined), DEFAULT_TIMEOUT)
assert.strictEqual(_resolveTimeout({ timeout: 0 }), DEFAULT_TIMEOUT)
assert.strictEqual(_resolveTimeout({ timeout: '30000' }), DEFAULT_TIMEOUT)

// ---------- 429 置零时沿用服务端下发的上限，不各写一遍 20 ----------
assert.deepStrictEqual(exhaustedQuota({ dailyLimit: 60, remaining: 3 }),
  { needLogin: false, dailyLimit: 60, used: 60, remaining: 0 })
assert.strictEqual(exhaustedQuota(null).dailyLimit, 20)
assert.strictEqual(exhaustedQuota({}).remaining, 0)

console.log('[aiChat.test] PASS')
