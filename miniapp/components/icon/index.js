// components/icon/index.js
// 通用 SVG 图标组件 —— 用法：<icon name="bell" size="20" color="#2B356E" />
const { buildSrc } = require('./icons')

Component({
  properties: {
    name:  { type: String, value: '' },
    size:  { type: Number, value: 24 },   // px
    color: { type: String, value: '#1F2547' },
    sw:    { type: Number, value: 0 }      // 覆盖描边粗细，0 = 用图标默认
  },
  data: { src: '' },
  observers: {
    'name, size, color, sw': function (name, size, color, sw) {
      this.setData({ src: buildSrc(name, size, color, sw) })
    }
  },
  lifetimes: {
    attached() {
      const { name, size, color, sw } = this.properties
      this.setData({ src: buildSrc(name, size, color, sw) })
    }
  }
})
