// custom-tab-bar/index.js —— 自定义底部导航（首页/新闻/展馆/课程）
Component({
  data: {
    selected: 0,
    active:   '#2B356E',
    inactive: '#8A93B2',
    list: [
      { icon: 'home',   text: '首页', path: '/pages/index/index' },
      { icon: 'news',   text: '新闻', path: '/pages/news/index' },
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
