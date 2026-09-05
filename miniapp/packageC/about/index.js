// packageC/about/index.js — 关于云端书院
const { get } = require('../../utils/request')
const { ENABLE_AI_CHAT, hideAiChatPlainCopy } = require('../../config/features')
const { enablePageShare, buildShareAppMessage, buildShareTimeline } = require('../../utils/pageShare')

const ALL_FEATURES = [
  { icon: 'museum', name: '线上展馆', desc: '沉浸式线上展馆，图文 + 语音讲解' },
  { icon: 'course', name: '精品课程', desc: '多门在线课程，支持课程字幕' },
  { icon: 'medal',  name: '文创展示', desc: '精品好物双语鉴赏与多图 / 3D 展示' },
  { icon: 'calendar', name: '活动报名', desc: '讲座研学在线报名与凭证签到' },
  { icon: 'robot',  name: '知识问答', desc: '按平台知识库检索资料作答' }
]

Page({
  data: {
    version: '1.0.0',
    // 简介 / 联系方式 / 备案号 由后台「内容配置」维护；此处为拉取前的兜底默认值
    intro: '云端书院是面向校园的线上学习服务平台，整合线上展馆、精品课程、文创展示与活动报名等功能，支持随时随地学习与交流，线上线下相结合。',
    // 联系方式默认留空，wxml 里三行都有 wx:if，不配置就整行不渲染。
    // 原先内置的电话是编的、邮箱是学校的 edu.cn 域，备案主体换成公司后两者都对不上；
    // 与其展示假信息，不如不展示——真实值请在后台「内容配置」填写。
    address: '',
    phone: '',
    email: '',
    // 小程序备案号须在小程序内可见（《互联网信息服务管理办法》）。
    // 后台「内容配置」可覆盖；这里必须有兜底值，否则后台没配就等于没展示。
    icp: '黔ICP备17005610号-10X',
    features: ENABLE_AI_CHAT ? ALL_FEATURES : ALL_FEATURES.filter((f) => f.name !== '知识问答')
  },

  onLoad() {
    enablePageShare()
    try {
      const v = wx.getAccountInfoSync().miniProgram.version
      if (v) this.setData({ version: v })
    } catch (e) {}

    get('/config/about').then((res) => {
      if (!res) return
      this.setData({
        intro: hideAiChatPlainCopy(res.intro || this.data.intro),
        address: res.address || this.data.address,
        phone: res.phone || this.data.phone,
        email: res.email || this.data.email,
        // 与上面几项一致：后台没配就保留兜底，不要清空成 ''
        icp: res.icp || this.data.icp
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
  },

  onShareAppMessage() {
    return buildShareAppMessage({ title: '云端书院', path: '/packageC/about/index' })
  },

  onShareTimeline() {
    return buildShareTimeline({ title: '云端书院' })
  }
})
