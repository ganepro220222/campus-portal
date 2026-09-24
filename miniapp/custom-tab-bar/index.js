// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    /* 选中 --jin-80 / 未选 --jin-60；与 app.json tabBar 色一致 */
    active:   '#614923',   /* = --jin-80 */
    inactive: '#9E7D45',   /* = --jin-60 */
    list: [
      { icon: 'home',   text: '首页', path: '/pages/index/index' },
      { icon: 'news',   text: '动态', path: '/pages/news/index' },
      { icon: 'museum', text: '展馆', path: '/pages/hall/index' },
      { icon: 'course', text: '课程', path: '/pages/course/index' }
    ]
  },
  methods: {
    onTap(e) {
      const { index, path } = e.currentTarget.dataset
      if (index === this.data.selected) return
      wx.switchTab({ url: path })
    }
  }
})
