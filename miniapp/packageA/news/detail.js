// packageA/news/detail.js —— 新闻详情（对齐 demo 新闻栏）
const { get } = require('../../utils/request')

const DEFAULT = {
  title: '中华文化书院举办王阳明“知行合一”专题讲座',
  category: '书院动态',
  date: '2026-06-05',
  read: '1,234',
  colorClass: 'hc1',
  drop: '六',
  lead: '月五日，贵州交通职业大学中华文化书院在明德讲堂举办“知行合一”阳明文化专题讲座，邀请省内知名学者主讲，全校师生代表三百余人参加。讲座深入阐释了王阳明在贵州龙场悟道的历史背景与“致良知”的思想精髓。',
  paras: [
    '主讲人结合黔中文化与当代育人实践，指出阳明心学“知行合一”的理念，对于新时代青年学子立德修身、笃行实干具有重要的现实意义。现场互动热烈，师生纷纷表示受益匪浅。',
    '据悉，本次讲座是书院“马院 + 书院”协同育人系列活动之一，后续还将依托云端书院平台陆续推出线上课程与线上展馆，让中华优秀传统文化以更便捷的方式走近师生。'
  ]
}
const RECO = [
  { id: 2, n: '“通途之路”研学品牌启动仪式在我校举行', m: '活动通知 · 2026-06-03' },
  { id: 3, n: '屯堡地戏走进校园：非遗活态传承公开课开讲', m: '文化传承 · 2026-06-01' },
  { id: 4, n: '阳明心学十二讲课程上线，欢迎选学', m: '书院动态 · 2026-05-28' }
]

Page({
  data: { article: DEFAULT, reco: RECO, liked: false, collected: false },

  onLoad(opts) {
    const id = opts && opts.id
    if (!id) return
    get(`/news/${id}`).then(a => {
      if (a) this.setData({ article: { ...DEFAULT, ...a } })
    }).catch(() => {})
  },

  onLike() {
    const liked = !this.data.liked
    this.setData({ liked })
    if (liked) wx.showToast({ title: '点赞成功', icon: 'none' })
  },
  onCollect() {
    const collected = !this.data.collected
    this.setData({ collected })
    if (collected) wx.showToast({ title: '收藏成功', icon: 'none' })
  },
  onShare() { wx.showToast({ title: '已生成分享卡片', icon: 'none' }) },
  onReco(e) {
    wx.navigateTo({ url: `/packageA/news/detail?id=${e.currentTarget.dataset.id}` })
  }
})
