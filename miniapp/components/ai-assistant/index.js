// components/ai-assistant/index.js — 书院文化问答浮标（对接后端前使用本地预设回复）
const FAQ_REPLIES = {
  '阳明文化': '王阳明在贵州龙场悟道，提出“知行合一”“致良知”。书院“阳明文化馆”系统呈现其生平、思想与黔中实践，建议先看《阳明心学十二讲》课程。',
  '屯堡文化': '屯堡文化源于明代“调北征南”，保留了六百年前的江南遗风，地戏被誉为“戏剧活化石”。可前往“屯堡文化馆”沉浸浏览，并收听语音讲解。',
  '红色文化': '贵州是长征转折之地，遵义会议在此召开。书院“红色文化馆”联动“长征精神与红色交通史”课程，传承红色基因。'
}

Component({
  properties: {
    bottom: { type: Number, value: 150 }
  },
  data: {
    open: false,
    input: '',
    firstAsk: true,
    chips: ['什么是阳明文化？', '屯堡文化有何特色？', '贵州的红色文化'],
    messages: [
      { role: 'ai', text: '你好！我是书院文化助手 📚 可以为你讲解阳明文化、屯堡文化、红色文化等。试试下面的问题：' }
    ],
    scrollTo: ''
  },
  methods: {
    open() { this.setData({ open: true }) },
    close() { this.setData({ open: false }) },
    noop() {},
    onInput(e) { this.setData({ input: e.detail.value }) },

    onChip(e) {
      const q = e.currentTarget.dataset.q
      this._ask(q.replace(/[？?]/g, '').replace(/^什么是|有何特色|贵州的/g, '') || q, q)
    },

    send() {
      const v = (this.data.input || '').trim()
      if (!v) return
      this.setData({ input: '' })
      this._ask(v, v)
    },

    _ask(key, shown) {
      const msgs = this.data.messages.concat([{ role: 'me', text: shown }, { role: 'ai', text: '正在思考…' }])
      const idx = msgs.length - 1
      this.setData({ messages: msgs, firstAsk: false, scrollTo: 'm' + idx })
      const matchKey = Object.keys(FAQ_REPLIES).find(k => key.indexOf(k) >= 0)
      const answer = matchKey ? FAQ_REPLIES[matchKey]
        : ('关于“' + shown + '”，暂未找到相关资料，请换个问法或稍后再试。')
      setTimeout(() => {
        const list = this.data.messages.slice()
        list[idx] = { role: 'ai', text: answer }
        this.setData({ messages: list, scrollTo: 'm' + idx })
      }, 650)
    }
  }
})
