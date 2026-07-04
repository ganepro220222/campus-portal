// packageD/ai-chat/index.js — AI 文化问答（全屏）
const FAQ_REPLIES = {
  '阳明': '王阳明在贵州龙场悟道，提出“知行合一”“致良知”。书院「阳明文化馆」系统呈现其生平、思想与黔中实践，推荐先看《阳明心学十二讲》课程。',
  '屯堡': '屯堡文化源于明代“调北征南”，保留了六百年前的江南遗风，地戏被誉为“戏剧活化石”。可前往「屯堡文化馆」沉浸浏览并收听语音讲解。',
  '红色': '贵州是长征转折之地，遵义会议在此召开。书院「红色文化馆」联动《长征精神与红色交通史》课程，赓续红色血脉。',
  '龙场': '龙场悟道是王阳明思想的转折点：在贵州修文龙场，他悟出“圣人之道，吾性自足”，由此奠定心学体系。',
  '知行合一': '“知行合一”指知与行本是一体：知是行之始，行是知之成，反对知而不行、行而不知。',
  '致良知': '“致良知”是把心中本有的善端（良知）推致到事事物物之上，是阳明心学的核心功夫。',
  '非遗': '书院「文创展示」汇集苗族银饰、蜡染、屯堡石雕等非遗好物，并配套线上展馆与语音讲解，助你读懂黔中匠心。'
}

Page({
  data: {
    messages: [
      { role: 'ai', text: '你好！我是书院文化助手 📚 可以为你讲解阳明文化、屯堡文化、红色文化与非遗技艺。试试下面的问题：' }
    ],
    chips: ['什么是阳明文化？', '屯堡文化有何特色？', '贵州的红色文化', '龙场悟道讲了什么？'],
    firstAsk: true,
    input: '',
    scrollTo: ''
  },

  onInput(e) { this.setData({ input: e.detail.value }) },

  onChip(e) {
    const q = e.currentTarget.dataset.q
    this._ask(q, q)
  },

  send() {
    const v = (this.data.input || '').trim()
    if (!v) return
    this.setData({ input: '' })
    this._ask(v, v)
  },

  _ask(key, shown) {
    const msgs = this.data.messages.concat([
      { role: 'me', text: shown },
      { role: 'ai', text: '正在思考…' }
    ])
    const idx = msgs.length - 1
    this.setData({ messages: msgs, firstAsk: false, scrollTo: 'm' + idx })

    const matchKey = Object.keys(FAQ_REPLIES).find(k => key.indexOf(k) >= 0)
    const answer = matchKey ? FAQ_REPLIES[matchKey]
      : ('关于“' + shown + '”，我暂未在书院知识库中找到相关资料，可换个问法，或到「全局搜索」中查询新闻、课程与展馆内容。')
    setTimeout(() => {
      const list = this.data.messages.slice()
      list[idx] = { role: 'ai', text: answer }
      this.setData({ messages: list, scrollTo: 'm' + idx })
    }, 620)
  }
})
