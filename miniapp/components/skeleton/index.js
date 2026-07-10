// components/skeleton/index.js — 通用骨架屏（shimmer 占位）
Component({
  properties: {
    show:  { type: Boolean, value: false },
    // list（横向卡片列表）/ grid（两列网格）/ home（首页）
    type:  { type: String, value: 'list' },
    count: { type: Number, value: 6 }
  },
  data: { items: [] },
  observers: {
    count(c) { this.setData({ items: Array.from({ length: c || 6 }) }) }
  },
  lifetimes: {
    attached() { this.setData({ items: Array.from({ length: this.data.count || 6 }) }) }
  }
})
