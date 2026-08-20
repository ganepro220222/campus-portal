// packageC/about/index.js — 关于云端书院
const { get } = require('../../utils/request')

Page({
  data: {
    version: '1.0.0',
    // 简介 / 联系方式 / 备案号 由后台「内容配置」维护；此处为拉取前的兜底默认值
    intro: '云端书院是“马院 + 书院”协同育人的线上思政平台，依托中华文化书院资源，整合线上展馆、精品课程、文创展示与活动报名等功能，支持师生随时随地学习与交流，线上线下相结合。',
    address: '贵州省贵阳市清镇职教城西区',
    phone: '0851-12345678',
    email: 'shuyuan@gzjtzy.edu.cn',
    icp: '',
    features: [
      { icon: 'museum', name: '线上展馆', desc: '11 座沉浸式线上展馆，图文 + 语音讲解' },
      { icon: 'course', name: '精品课程', desc: '多门精品课程与 AI 字幕' },
      { icon: 'medal',  name: '文创展示', desc: '精品好物双语鉴赏与多图 / 3D 展示' },
      { icon: 'calendar', name: '活动报名', desc: '讲座研学在线报名与凭证签到' },
      { icon: 'robot',  name: '智能问答', desc: '基于书院知识库的智能问答助手' }
    ]
  },

  onLoad() {
    try {
      const v = wx.getAccountInfoSync().miniProgram.version
      if (v) this.setData({ version: v })
    } catch (e) {}

    get('/config/about').then((res) => {
      if (!res) return
      this.setData({
        intro: res.intro || this.data.intro,
        address: res.address || this.data.address,
        phone: res.phone || this.data.phone,
        email: res.email || this.data.email,
        icp: res.icp || ''
      })
    }).catch(() => {})
  },

  onCopy(e) {
    const val = e.currentTarget.dataset.val
    if (!val) return
    wx.setClipboardData({ data: String(val), success() { wx.showToast({ title: '已复制', icon: 'none' }) } })
  },

  onPrivacy() {
    wx.navigateTo({ url: '/packageC/legal/privacy' })
  }
})
