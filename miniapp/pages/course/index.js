// pages/course/index.js —— 课程中心（底部 Tab）
const { get } = require('../../utils/request')

const CATS = ['全部', '阳明文化', '思政必修', '文化传承', '美育素养']
const CARD_COLORS = ['hc1', 'hc3', 'hc2', 'hc5', 'hc4']
const CARD_ICONS  = ['course', 'clock', 'book', 'star', 'flag']

const DEFAULT_COURSES = [
  { id: 1, name: '阳明心学十二讲', cat: '阳明文化', audience: '全校学生', lessonCount: 12, tag: 'AI 字幕', tagGold: true,
    desc: '从龙场悟道到致良知，系统讲授阳明心学的精髓与当代价值。' },
  { id: 2, name: '长征精神与红色交通史', cat: '思政必修', audience: '全校学生', lessonCount: 8, tag: '思政必修',
    desc: '重温红色交通线，传承长征精神，赓续红色血脉。' },
  { id: 3, name: '屯堡文化探源', cat: '文化传承', audience: '全校学生', lessonCount: 6, tag: '文化传承',
    desc: '走进六百年江南遗风，解读屯堡地戏与石头建筑的活态传承。' },
  { id: 4, name: '贵州非遗技艺赏析', cat: '文化传承', audience: '全校学生', lessonCount: 10, tag: '非遗',
    desc: '蜡染、银饰、地戏……感受多彩黔中的匠心与巧思。' },
  { id: 5, name: '中华书法入门', cat: '美育素养', audience: '全校学生', lessonCount: 12, tag: '美育',
    desc: '笔墨纸砚，从执笔运锋到临帖创作，涵养审美与心性。' }
]

function decorate(list) {
  return (list || []).map((it, i) => ({
    ...it,
    colorClass: it.colorClass || CARD_COLORS[i % CARD_COLORS.length],
    icon: it.icon || CARD_ICONS[i % CARD_ICONS.length],
    audience: it.audience || it.targetAudience || '全校学生',
    tag: it.tag || it.categoryName || '文化课程',
    tagGold: it.tagGold || it.tag === 'AI 字幕'
  }))
}

Page({
  data: {
    statusBarHeight: 20,
    cats: CATS,
    activeCat: 0,
    courseList: [],
    loading: true
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 })
    this._load()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  onPullDownRefresh() { this._load().then(() => wx.stopPullDownRefresh()) },

  async _load() {
    this.setData({ loading: true })
    const cat = this.data.activeCat ? CATS[this.data.activeCat] : undefined
    try {
      const list = await get('/courses', { category: cat }).catch(() => null)
      const src = (list && list.length) ? list : DEFAULT_COURSES
      const filtered = cat ? src.filter(c => (c.cat || c.categoryName) === cat) : src
      this.setData({ courseList: decorate(filtered), loading: false })
    } catch {
      this.setData({ courseList: decorate(DEFAULT_COURSES), loading: false })
    }
  },

  switchCat(e) {
    const i = e.currentTarget.dataset.index
    if (i === this.data.activeCat) return
    this.setData({ activeCat: i })
    this._load()
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageB/course/detail?id=${e.currentTarget.dataset.id}` })
  }
})
