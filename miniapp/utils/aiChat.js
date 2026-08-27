// utils/aiChat.js — 书院助手（会话、配额、提问）

const { get, post } = require('./request')

/** 配额接口都取不到时的兜底显示值，与后端 shuyuan.rate-limit.ai-per-day 的默认值一致 */
const DEFAULT_DAILY_LIMIT = 20

function hasToken() {
  const app = getApp()
  return !!(app.globalData.token || wx.getStorageSync('token'))
}

async function createSession(options = {}) {
  const session = await post('/ai/chat/sessions', {}, options)
  return session && session.id ? session.id : null
}

async function fetchQuota() {
  try {
    return await get('/ai/chat/quota', {}, { silent: true })
  } catch (e) {
    if (hasToken()) {
      return {
        needLogin: false,
        dailyLimit: DEFAULT_DAILY_LIMIT,
        used: 0,
        remaining: DEFAULT_DAILY_LIMIT,
        degraded: true
      }
    }
    return { needLogin: true, dailyLimit: DEFAULT_DAILY_LIMIT, used: 0, remaining: 0 }
  }
}

/*
 * 一次提问要走「知识库检索 → 大模型生成」，10 秒的默认超时经常不够。
 * 而超时最坑的地方在于：服务端往往已经成功、答案也写进了 ai_message，
 * 次数照扣，用户却只看到一句失败——所以这里必须单独把时间给够。
 */
const ASK_TIMEOUT = 30000

async function sendQuestion(sessionId, question) {
  return post(`/ai/chat/sessions/${sessionId}/messages`, { question }, { timeout: ASK_TIMEOUT })
}

/** 网络层失败（wx.request 的 fail 回调）没有 body.code，只能看 errMsg */
function isTimeoutError(err) {
  return !!(err && typeof err.errMsg === 'string' && /timeout/i.test(err.errMsg))
}

async function fetchSessions(options = {}) {
  const list = await get('/ai/chat/sessions', {}, options)
  return Array.isArray(list) ? list : []
}

async function fetchSessionMessages(sessionId, options = {}) {
  const list = await get(`/ai/chat/sessions/${sessionId}/messages`, {}, options)
  return Array.isArray(list) ? list : []
}

function mapSessionItem(raw) {
  if (!raw) return null
  const preview = raw.preview || '暂无提问'
  return {
    id: raw.id,
    createdAt: raw.createdAt || '',
    preview,
    title: preview
  }
}

function mapMessagesToUi(messages) {
  if (!Array.isArray(messages)) return []
  return messages.map((m) => ({
    role: m.role === 'user' ? 'me' : 'ai',
    text: m.content || ''
  }))
}

function quotaSubtitle(quota) {
  if (!quota || quota.needLogin) {
    return '登录后可使用 AI 智能问答'
  }
  if (quota.remaining <= 0) {
    return '今日问答次数已用完，请明天再来'
  }
  return `今日剩余 ${quota.remaining} 次问答`
}

/**
 * 撞上 429 时把本地余额置零。
 *
 * <p>上限是服务端配置的，页面里再各写一遍 20 就会在改配置那天集体显示错的数字。
 * 这里沿用手里已知的 dailyLimit，实在没有才退回默认值。
 */
function exhaustedQuota(quota) {
  const dailyLimit = (quota && quota.dailyLimit) || DEFAULT_DAILY_LIMIT
  return { needLogin: false, dailyLimit, used: dailyLimit, remaining: 0 }
}

function applyQuotaFromMessage(quota, message) {
  if (!message || message.remainingToday == null) {
    return quota
  }
  const dailyLimit = message.dailyLimit != null ? message.dailyLimit : (quota && quota.dailyLimit) || 20
  const remaining = message.remainingToday
  return {
    needLogin: false,
    dailyLimit,
    used: Math.max(0, dailyLimit - remaining),
    remaining
  }
}

function resolveErrorAnswer(err, question) {
  if (err && err.code === 429) {
    return err.message || '今日问答次数已用完，请明天再来'
  }
  if (err && err.code === 401) {
    return '请先登录后再使用书院助手。'
  }
  // 超时时服务端多半已经答完并存好了，再让用户去「确认登录、录入知识库」是南辕北辙
  if (isTimeoutError(err)) {
    return '回答用时较长，可能已经生成。请稍后退出并重新进入本次会话查看。'
  }
  return '暂时无法回答，请确认已登录，或在管理后台录入知识库资料后重试。'
}

module.exports = {
  createSession,
  fetchQuota,
  fetchSessions,
  fetchSessionMessages,
  sendQuestion,
  mapSessionItem,
  mapMessagesToUi,
  quotaSubtitle,
  applyQuotaFromMessage,
  resolveErrorAnswer,
  exhaustedQuota,
  isTimeoutError,
  ASK_TIMEOUT,
  DEFAULT_DAILY_LIMIT
}
