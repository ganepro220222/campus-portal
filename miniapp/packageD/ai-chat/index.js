// packageD/ai-chat/index.js — AI 文化问答（对接后端 RAG）
const { request } = require('../../utils/request')

const FAQ_FALLBACK = {
  '阳明': '王阳明在贵州龙场悟道，提出“知行合一”“致良知”。书院「阳明文化馆」系统呈现其生平、思想与黔中实践，推荐先看《阳明心学十二讲》课程。',
  '屯堡': '屯堡文化源于明代“调北征南”，保留了六百年前的江南遗风，地戏被誉为“戏剧活化石”。可前往「屯堡文化馆」沉浸浏览并收听语音讲解。'
}

Page({
  data: {
    sessionId: null,
    messages: [
      { role: 'ai', text: '你好！我是书院文化助手，可以基于书院知识库为你解答阳明文化、屯堡文化等问题。' }
    ],
    chips: ['什么是阳明文化？', '屯堡文化有何特色？', '龙场悟道讲了什么？'],
    firstAsk: true,
    input: '',
    scrollTo: '',
    loading: false
  },

  onLoad() {
    this.ensureSession()
  },

  async ensureSession() {
    try {
      const session = await request('/ai/chat/sessions', 'POST', {})
      if (session && session.id) {
        this.setData({ sessionId: session.id })
      }
    } catch (e) {
      // 未登录时保留本地展示，发送时会提示登录
    }
  },

  onInput(e) { this.setData({ input: e.detail.value }) },

  onChip(e) {
    this._ask(e.currentTarget.dataset.q)
  },

  send() {
    const v = (this.data.input || '').trim()
    if (!v) return
    this.setData({ input: '' })
    this._ask(v)
  },

  async _ask(shown) {
    const msgs = this.data.messages.concat([
      { role: 'me', text: shown },
      { role: 'ai', text: '正在思考…' }
    ])
    const idx = msgs.length - 1
    this.setData({ messages: msgs, firstAsk: false, scrollTo: 'm' + idx, loading: true })

    try {
      if (!this.data.sessionId) {
        await this.ensureSession()
      }
      if (!this.data.sessionId) {
        throw new Error('no-session')
      }
      const res = await request(`/ai/chat/sessions/${this.data.sessionId}/messages`, 'POST', {
        question: shown
      })
      const list = this.data.messages.slice()
      list[idx] = { role: 'ai', text: res.content || '暂时无法回答，请换个问法试试。' }
      this.setData({ messages: list, scrollTo: 'm' + idx, loading: false })
    } catch (e) {
      const matchKey = Object.keys(FAQ_FALLBACK).find(k => shown.indexOf(k) >= 0)
      const answer = matchKey
        ? FAQ_FALLBACK[matchKey]
        : '暂未获取到回答，请确认已登录，或在管理后台录入知识库资料后重试。'
      const list = this.data.messages.slice()
      list[idx] = { role: 'ai', text: answer }
      this.setData({ messages: list, scrollTo: 'm' + idx, loading: false })
    }
  }
})
