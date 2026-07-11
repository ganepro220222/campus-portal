// utils/aiChat.js — 书院文化助手（会话、配额、提问）

const { get, post } = require('./request')

async function createSession() {
  const session = await post('/ai/chat/sessions', {})
  return session && session.id ? session.id : null
}

async function fetchQuota() {
  try {
    return await get('/ai/chat/quota')
  } catch (e) {
    return { needLogin: true, dailyLimit: 20, used: 0, remaining: 0 }
  }
}

async function sendQuestion(sessionId, question) {
  return post(`/ai/chat/sessions/${sessionId}/messages`, { question })
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
    return '请先登录后再使用书院文化助手。'
  }
  return '暂时无法回答，请确认已登录，或在管理后台录入知识库资料后重试。'
}

module.exports = {
  createSession,
  fetchQuota,
  sendQuestion,
  quotaSubtitle,
  applyQuotaFromMessage,
  resolveErrorAnswer
}
