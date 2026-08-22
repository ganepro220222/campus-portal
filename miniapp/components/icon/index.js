// components/icon/index.js
// 通用 SVG 图标组件 —— 用法：<icon name="bell" size="20" color="#2B356E" />
const { buildSrc } = require('./icons')

Component({
  properties: {
    name:  { type: String, value: '' },
    // 语义是「375pt 宽机型上的 pt 数」，实际渲染成 size × 2 rpx——
    // rpx 会随屏宽等比缩放，图标才跟得上周围元素（见 index.wxml 注释）
    size:  { type: Number, value: 24 },
    color: { type: String, value: '#1F2547' },
    sw:    { type: Number, value: 0 }      // 覆盖描边粗细，0 = 用图标默认
  },
  data: { src: '', boxRpx: 48 },
  observers: {
    'name, size, color, sw': function (name, size, color, sw) {
      this.setData({ src: buildSrc(name, size, color, sw), boxRpx: size * 2 })
    }
  },
  lifetimes: {
    attached() {
      const { name, size, color, sw } = this.properties
      this.setData({ src: buildSrc(name, size, color, sw), boxRpx: size * 2 })
    }
  }
})
