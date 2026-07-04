// pages/hall/index.js —— 线上展馆（底部 Tab）
const { get } = require('../../utils/request')

const CATS = ['全部', '传统文化', '红色文化', '非遗技艺', '校史校风']
const HALL_COLORS = ['hc1', 'hc2', 'hc3', 'hc4', 'hc5']

const DEFAULT_HALLS = [
  { id: 1,  name: '阳明文化馆', cat: '传统文化', desc: '龙场悟道 · 知行合一' },
  { id: 2,  name: '屯堡文化馆', cat: '传统文化', desc: '六百年江南遗风' },
  { id: 3,  name: '红色文化馆', cat: '红色文化', desc: '长征转折 · 红色基因' },
  { id: 4,  name: '民族文化馆', cat: '传统文化', desc: '多彩黔中 · 民族瑰宝' },
  { id: 5,  name: '交通文化馆', cat: '校史校风', desc: '通途之路 · 交通报国' },
  { id: 6,  name: '廉政文化馆', cat: '红色文化', desc: '清风正气 · 廉洁修身' },
  { id: 7,  name: '非遗技艺馆', cat: '非遗技艺', desc: '活态传承 · 匠心独运' },
  { id: 8,  name: '校史馆',     cat: '校史校风', desc: '栉风沐雨 · 弦歌不辍' },
  { id: 9,  name: '书法艺术馆', cat: '非遗技艺', desc: '翰墨丹青 · 笔走龙蛇' },
  { id: 10, name: '茶文化馆',   cat: '传统文化', desc: '黔茶飘香 · 茶道人生' },
  { id: 11, name: '农耕文化馆', cat: '非遗技艺', desc: '二十四节气 · 农事智慧' }
]

function decorate(list) {
  return (list || []).map((it, i) => ({
    ...it,
    colorClass: it.colorClass || HALL_COLORS[i % HALL_COLORS.length],
    shortName: it.shortName || (it.name || '').replace(/馆$/, ''),
    desc: it.desc || it.intro || ''
  }))
}

Page({
  data: {
    statusBarHeight: 20,
    cats: CATS,
    activeCat: 0,
    hallList: [],
    loading: true
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: sys.statusBarHeight || 20 })
    this._load()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  onPullDownRefresh() { this._load().then(() => wx.stopPullDownRefresh()) },

  async _load() {
    this.setData({ loading: true })
    const cat = this.data.activeCat ? CATS[this.data.activeCat] : undefined
    try {
      const list = await get('/halls', { category: cat }).catch(() => null)
      const src = (list && list.length) ? list : DEFAULT_HALLS
      const filtered = cat ? src.filter(h => (h.cat || h.categoryName) === cat) : src
      this.setData({ hallList: decorate(filtered), loading: false })
    } catch {
      this.setData({ hallList: decorate(DEFAULT_HALLS), loading: false })
    }
  },

  switchCat(e) {
    const i = e.currentTarget.dataset.index
    if (i === this.data.activeCat) return
    this.setData({ activeCat: i })
    this._load()
  },

  onCardTap(e) {
    wx.navigateTo({ url: `/packageA/hall/detail?id=${e.currentTarget.dataset.id}` })
  }
})
