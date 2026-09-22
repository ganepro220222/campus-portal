// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    /* 对照 design/demo/v2/shuyuan.css：.tab.on .t-ic 是 --jin-80，
       未选中的 .tab .t-ic 是 --jin-60。图标是烤成 data URI 的图片，
       颜色只能从这儿传进去，不能靠 wxss 的 color 继承。
       两个值和 app.json 的 tabBar.selectedColor / color 保持一致——
       自定义栏没加载出来时系统会用那一份兜底，两边不一致就会闪一下色。 */
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
