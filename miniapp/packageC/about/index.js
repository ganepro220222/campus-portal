// packageC/about/index.js — 关于云端书院
Page({
  data: {
    version: '1.0.0',
    features: [
      { icon: 'museum', name: '线上展馆', desc: '11 座沉浸式文化馆，图文 + 语音讲解' },
      { icon: 'course', name: '文化课程', desc: '阳明心学、红色文化等精品课程与 AI 字幕' },
      { icon: 'medal',  name: '文创展示', desc: '非遗好物双语鉴赏与多图 / 3D 展示' },
      { icon: 'calendar', name: '活动报名', desc: '讲座研学在线报名与凭证签到' },
      { icon: 'robot',  name: 'AI 文化问答', desc: '基于书院知识库的智能问答助手' }
    ]
  },

  onLoad() {
    try {
      const v = wx.getAccountInfoSync().miniProgram.version
      if (v) this.setData({ version: v })
    } catch (e) {}
  },

  onCopy(e) {
    const val = e.currentTarget.dataset.val
    if (!val) return
    wx.setClipboardData({ data: String(val), success() { wx.showToast({ title: '已复制', icon: 'none' }) } })
  }
})
