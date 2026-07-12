// packageD/ai-chat/index.js — AI 文化问答（对接后端 RAG）
const {
  createSession,
  fetchQuota,
  sendQuestion,
  quotaSubtitle,
  applyQuotaFromMessage,
  resolveErrorAnswer
} = require('../../utils/aiChat')

const { loadMiniappConfig, DEFAULT_MINIAPP_CONFIG } = require('../../utils/miniappConfig')

const QUESTION_MAX = 500

Page({
  data: {
    sessionId: null,
    messages: [
      { role: 'ai', text: DEFAULT_MINIAPP_CONFIG.aiAssistantWelcome }
    ],
    chips: DEFAULT_MINIAPP_CONFIG.aiAssistantChips,
    firstAsk: true,
    input: '',
    scrollTo: '',
    loading: false,
    quota: null,
    quotaText: '登录后可使用 AI 智能问答'
  },

  onLoad() {
    this._loadPublicConfig()
    this._prepareSession()
  },

  async _loadPublicConfig() {
    try {
      const cfg = await loadMiniappConfig()
      this.setData({
        chips: cfg.aiAssistantChips,
        messages: [{ role: 'ai', text: cfg.aiAssistantWelcome }]
      })
    } catch (e) {
      // 默认文案
    }
  },

  async _prepareSession() {
    try {
      const quota = await fetchQuota()
      this._setQuota(quota)
      if (!quota.needLogin) {
        const sessionId = await createSession({ silent: true })
        if (sessionId) {
          this.setData({ sessionId })
        }
      }
    } catch (e) {
      // 未登录时保留本地展示
    }
  },

  _setQuota(quota) {
    this.setData({
      quota,
      quotaText: quotaSubtitle(quota)
    })
  },

  onInput(e) { this.setData({ input: e.detail.value }) },

  onChip(e) {
    this._ask(e.currentTarget.dataset.q)
  },

  send() {
    const v = (this.data.input || '').trim()
    if (!v || this.data.loading) return
    this.setData({ input: '' })
    this._ask(v)
  },

  async _ask(shown) {
    if (shown.length > QUESTION_MAX) {
      wx.showToast({ title: '问题过长，请控制在500字以内', icon: 'none' })
      return
    }
    const quota = this.data.quota
    if (quota && quota.needLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    if (quota && quota.remaining <= 0) {
      wx.showToast({ title: '今日次数已用完', icon: 'none', duration: 3500 })
      return
    }

    const msgs = this.data.messages.concat([
      { role: 'me', text: shown },
      { role: 'ai', text: '正在思考…' }
    ])
    const idx = msgs.length - 1
    this.setData({ messages: msgs, firstAsk: false, scrollTo: 'm' + idx, loading: true })

    try {
      if (!this.data.sessionId) {
        const sessionId = await createSession()
        if (!sessionId) throw new Error('no-session')
        this.setData({ sessionId })
      }
      const res = await sendQuestion(this.data.sessionId, shown)
      const list = this.data.messages.slice()
      list[idx] = { role: 'ai', text: res.content || '暂时无法回答，请换个问法试试。' }
      this._setQuota(applyQuotaFromMessage(this.data.quota, res))
      this.setData({ messages: list, scrollTo: 'm' + idx, loading: false })
    } catch (e) {
      const list = this.data.messages.slice()
      list[idx] = { role: 'ai', text: resolveErrorAnswer(e, shown) }
      if (e && e.code === 429) {
        this._setQuota({ needLogin: false, dailyLimit: 20, used: 20, remaining: 0 })
      }
      this.setData({ messages: list, scrollTo: 'm' + idx, loading: false })
    }
  }
})
