/*
 * mock/defaults.js — 仅 dev 环境的本地兜底数据。
 *
 * env.js 里 prod/staging 的 useMock 都是 false，mockGuard 会让这份数据一律返回空，
 * 所以线上与提审时审核员都看不到它。它的用途只有两个：本地开发和给甲方演示。
 *
 * 两条约定：
 * 1. 展馆（hallsHome / hallsFull / hallDetail）与学院名（colleges）是**真实**的，
 *    带真实 720 云 VR 链接，改了演示时就看到假东西——不要动。
 * 2. 其余条目是占位示例，一律用中性、不挂真实地标与真实人物的内容。
 *    后台配置分类和内容时**不要照抄这里**，那才是线上真正会显示的东西。
 */

module.exports = {
  banners: [
    { id: 1, title: '示例：春季学期选课通道开放', description: '选课时间、操作指引与常见问题说明', colorClass: 's1', category: '书院动态', linkType: 'news', linkValue: '1' },
    { id: 2, title: '示例：线上展馆新增语音讲解', description: '六座展馆支持 VR 漫游与语音导览', colorClass: 's2', category: '书院动态', linkType: 'fixed', linkValue: 'hall' },
    { id: 3, title: '示例：职业素养系列课程上线', description: '沟通表达、数字素养与安全基础', colorClass: 's3', category: '专题学习', linkType: 'fixed', linkValue: 'course' }
  ],

  // 各模块默认分类（接口 /categories 不可用时的兜底）
  categories: {
    news:   ['全部', '书院动态', '活动通知', '专题学习'],
    hall:   ['全部', '博物馆与校史', '红色教育', '研学服务', '素质教育', '文化艺术', '安全教育', '主题展馆'],
    course: ['全部', '职业素养', '通识必修', '专题学习', '美育素养']
  },

  hallsHome: [
    { id: 1, name: '贵州交通博物馆·教育馆', shortName: '交通博物馆' },
    { id: 2, name: '校史馆', shortName: '校史馆' },
    { id: 3, name: '贵州交通红色教育基地', shortName: '红色教育基地' },
    { id: 4, name: '交旅融合研学服务中心', shortName: '交旅研学' },
    { id: 5, name: '学生素质发展中心', shortName: '素质发展中心' },
    { id: 6, name: '学生科普体验中心', shortName: '科普体验中心' }
  ],

  hallsFull: [
    { id: 1,  name: '贵州交通博物馆·教育馆', shortName: '交通博物馆', cat: '博物馆与校史', desc: '交通发展历程与教育成果展陈', vrUrl: 'https://roma.720yun.com/vr/515a9635070ca212/', vrReady: true },
    { id: 2,  name: '校史馆', shortName: '校史馆', cat: '博物馆与校史', desc: '办学历程与重要里程碑', vrUrl: 'https://roma.720yun.com/vr/b5b7196093f3c25a/', vrReady: true },
    { id: 3,  name: '贵州交通红色教育基地', shortName: '红色教育基地', cat: '红色教育', desc: '交通行业发展史主题展陈', vrUrl: 'https://roma.720yun.com/vr/59e140eb05f9e134/', vrReady: true },
    { id: 4,  name: '交旅融合研学服务中心', shortName: '交旅研学', cat: '研学服务', desc: '交旅融合主题研学服务', vrUrl: 'https://roma.720yun.com/vr/96cb6946cefd5b99/', vrReady: true },
    { id: 5,  name: '学生素质发展中心', shortName: '素质发展中心', cat: '素质教育', desc: '学生综合素质培养成果展示', vrUrl: 'https://www.720yun.com/vr/374j5dyvrf2', vrReady: true },
    { id: 6,  name: '学生科普体验中心', shortName: '科普体验中心', cat: '素质教育', desc: '交通科技与学生科普互动体验', vrUrl: 'https://www.720yun.com/vr/7a0j5dyksk9', vrReady: true },
    { id: 7,  name: '文化千岛艺术馆', shortName: '千岛艺术馆', cat: '文化艺术', desc: '多元文化艺术作品线上展陈', vrUrl: 'https://www.720yun.com/vr/660j5dyvsv5', vrReady: true },
    { id: 8,  name: '校园安全教育馆', shortName: '校园安全教育馆', cat: '安全教育', desc: '校园安全常识与警示教育', vrUrl: 'https://www.bafang720.com/tour/4220d0a68856dcb9', vrReady: true },
    { id: 9,  name: '西部山区道路运输安全警示教育基地', shortName: '西部山区安全基地', cat: '安全教育', desc: '山区道路运输安全警示教育', vrUrl: 'https://eqvrar.com/hcvr/692/?t=1567242165', vrReady: true },
    { id: 10, name: '节水宣传教育中心', shortName: '节水宣传中心', cat: '主题展馆', desc: '节水理念与宣传教育成果', vrUrl: 'https://www.720yun.com/vr/f7bj5pmOkO2', vrReady: true }
  ],

  newsHome: [
    { id: 1, title: '示例：春季学期选课通道开放，请按时完成', categoryName: '书院动态', publishTime: '2026-06-05' },
    { id: 2, title: '示例：图书馆延长开放时间的通知', categoryName: '活动通知', publishTime: '2026-06-03' },
    { id: 3, title: '示例：职业素养系列课程第一讲开讲', categoryName: '专题学习', publishTime: '2026-06-01' }
  ],

  newsFull: [
    { id: 1, title: '示例：春季学期选课通道开放，请按时完成', category: '书院动态', publishTime: '2026-06-05', readCount: 1234 },
    { id: 2, title: '示例：图书馆延长开放时间的通知', category: '活动通知', publishTime: '2026-06-03', readCount: 980 },
    { id: 3, title: '示例：职业素养系列课程第一讲开讲', category: '专题学习', publishTime: '2026-06-01', readCount: 1500 },
    { id: 4, title: '示例：线上展馆新增语音讲解功能', category: '书院动态', publishTime: '2026-05-28', readCount: 860 },
    { id: 5, title: '示例：实训中心开放日安排公布', category: '专题学习', publishTime: '2026-05-25', readCount: 742 },
    { id: 6, title: '示例：关于开展本学期技能竞赛报名的通知', category: '活动通知', publishTime: '2026-05-20', readCount: 655 }
  ],

  coursesHome: [
    { id: 1, name: '示例课程：职业沟通与表达', categoryName: 'AI 字幕', lessonCount: 12, audience: '全校学生' },
    { id: 2, name: '示例课程：数字素养通识', categoryName: '通识必修', lessonCount: 8, audience: '全校学生' }
  ],

  coursesFull: [
    { id: 1, name: '示例课程：职业沟通与表达', cat: '职业素养', audience: '全校学生', lessonCount: 12, tag: 'AI 字幕', tagGold: true,
      desc: '示例内容。从倾听、提问到公开表达，训练职场沟通的基本功。' },
    { id: 2, name: '示例课程：数字素养通识', cat: '通识必修', audience: '全校学生', lessonCount: 8, tag: '通识必修',
      desc: '示例内容。信息检索、数据素养与网络安全常识。' },
    { id: 3, name: '示例课程：实训安全基础', cat: '专题学习', audience: '全校学生', lessonCount: 6, tag: '专题学习',
      desc: '示例内容。实训场地规范、防护装备与应急处置流程。' },
    { id: 4, name: '示例课程：职业生涯规划', cat: '专题学习', audience: '全校学生', lessonCount: 10, tag: '规划',
      desc: '示例内容。自我认知、行业认知与求职准备。' },
    { id: 5, name: '示例课程：设计美学入门', cat: '美育素养', audience: '全校学生', lessonCount: 12, tag: '美育',
      desc: '示例内容。色彩、构图与版式的基本规律。' }
  ],

  activities: [
    { id: 1, title: '示例活动：职业规划专题讲座', startTime: '2026-06-15 14:30', location: '学术报告厅', enrolledCount: 186, quota: 300, tag: '讲座' },
    { id: 2, title: '示例活动：校园开放日', startTime: '2026-06-20 09:00', location: '综合实训楼', enrolledCount: 240, quota: 240, tag: '活动' },
    { id: 3, title: '示例活动：数字素养公开课', startTime: '2026-06-25 15:00', location: '信息中心机房', enrolledCount: 88, quota: 120, tag: '公开课' },
    { id: 4, title: '示例活动：企业参观与实习宣讲', startTime: '2026-07-02 08:30', location: '校内报告厅', enrolledCount: 56, quota: 80, tag: '参观' }
  ],

  /*
   * 关联小程序。真实的只有「通途星」一个，AppID 尚未拿到（配置在
   * config/navigate-appids.json，由 scripts/sync-navigate-appids.js 同步进 app.json）。
   * 其余两条明确标注为示例，只为在 dev 下撑起列表布局——别当成真实院系名。
   */
  colleges: [
    { id: 1, name: '通途星', short: '通途', en: 'Tongtu', desc: '关联小程序 · AppID 待配置', colorClass: 'hc1' },
    { id: 2, name: '示例关联应用 A', short: '示例', en: 'Sample A', desc: '示例条目 · 用于演示列表布局', colorClass: 'hc2' },
    { id: 3, name: '示例关联应用 B', short: '示例', en: 'Sample B', desc: '示例条目 · 用于演示列表布局', colorClass: 'hc4' }
  ],

  /** 首页「关联应用」横滑兜底：现实中只有通途星一个，就只放一个 */
  collegesHome: [
    { id: 1, name: '通途星', short: '通途', en: '小程序跳转', desc: '关联小程序 · AppID 待配置', colorClass: 'hc1', contentType: 'jump', appid: 'wxPLACEHOLDER001', path: 'pages/index/index' }
  ],

  activityDetail: {
    id: 1,
    title: '示例活动：职业规划专题讲座',
    location: '学术报告厅',
    startTime: '2026-06-15 14:30',
    intro: '示例内容。围绕自我认知、行业认知与求职准备展开，含现场答疑环节。',
    tag: '讲座',
    quota: 300,
    enrolledCount: 186,
    canEnroll: true,
    enrollStatus: 'none'
  },

  crafts: [
    { id: 1, name: '示例文创：校园帆布包', intro: '示例条目 · 帆布材质，印校园插画', categoryName: '校园文创' },
    { id: 2, name: '示例文创：纪念金属徽章', intro: '示例条目 · 合金材质，含收纳卡', categoryName: '校园文创' },
    { id: 3, name: '示例文创：手作陶艺杯', intro: '示例条目 · 手工拉坯，单件成型', categoryName: '手作工艺' }
  ],

  craftDetail: {
    id: 1,
    name: '示例文创：校园帆布包',
    introZh: '示例内容。帆布材质，正面印校园插画，可作日常通勤与书包使用。',
    introEn: 'Sample item. Canvas tote bag printed with a campus illustration.',
    images: [{ imageUrl: '', angleLabel: '正面' }],
    contact: { phone: '0851-12345678', wechat: 'shuyuan_craft', email: 'craft@gzjtzy.edu.cn' }
  },

  resources: [
    { id: 1, name: '示例：职业规划手册.pdf', fileType: 'pdf', fileSizeKb: 2048, fileSizeText: '2.0 MB', categoryName: '学习读本' },
    { id: 2, name: '示例：实训安全指引.ppt', fileType: 'ppt', fileSizeKb: 5120, fileSizeText: '5.0 MB', categoryName: '课程课件' },
    { id: 3, name: '示例：数字素养读本.doc', fileType: 'word', fileSizeKb: 1024, fileSizeText: '1.0 MB', categoryName: '学习读本' },
    { id: 4, name: '示例：沟通与表达·配套课件.pptx', fileType: 'ppt', fileSizeKb: 6220, fileSizeText: '6.1 MB', categoryName: '课程课件' },
    { id: 5, name: '示例：实训操作演示.mp4', fileType: 'mp4', fileSizeKb: 86016, fileSizeText: '84 MB', categoryName: '视频课程' },
    { id: 6, name: '示例：课程音频导读.mp3', fileType: 'mp3', fileSizeKb: 18432, fileSizeText: '18 MB', categoryName: '音频伴学' },
    { id: 7, name: '示例：校园开放日纪录短片.mp4', fileType: 'mp4', fileSizeKb: 132096, fileSizeText: '129 MB', categoryName: '视频课程' }
  ],

  newsDetail: {
    article: {
      title: '示例：春季学期选课通道开放，请按时完成',
      category: '书院动态',
      date: '2026-06-05',
      read: '1,234',
      colorClass: 'hc1',
      drop: '六',
      lead: '月五日起，本学期选课通道正式开放。本条为占位示例正文，用于本地开发时检查详情页的首字下沉、正文排版与图文混排效果，不代表任何真实通知。',
      paras: [
        '示例段落。选课入口位于「课程」页，可按分类筛选，支持查看课时、授课对象与配套资源；已选课程会出现在个人中心的学习足迹里。',
        '示例段落。如遇选课失败，请先确认账号已完成绑定；仍有问题可在「意见反馈」中提交，附上截图便于排查。'
      ]
    },
    reco: [
      { id: 2, n: '示例：图书馆延长开放时间的通知', m: '活动通知 · 2026-06-03' },
      { id: 3, n: '示例：职业素养系列课程第一讲开讲', m: '专题学习 · 2026-06-01' },
      { id: 4, n: '示例：线上展馆新增语音讲解功能', m: '书院动态 · 2026-05-28' }
    ]
  },

  hallDetail: {
    name: '校史馆',
    shortName: '校史馆',
    vrUrl: 'https://roma.720yun.com/vr/b5b7196093f3c25a/',
    vrReady: true,
    slides: [
      { cls: 'gi1', icon: 'museum' },
      { cls: 'gi2', icon: 'star' },
      { cls: 'gi3', icon: 'book' }
    ],
    sections: [
      {
        id: 1,
        title: '办学历程',
        items: [
          { imageUrl: '', caption: '建校初期校舍与首批师生合影' },
          { imageUrl: '', caption: '关键发展节点大事记展墙' }
        ]
      },
      {
        id: 2,
        title: '重要里程碑',
        items: [
          { imageUrl: '', caption: '升格本科与交通职业大学历程' }
        ]
      },
      {
        id: 3,
        title: '校训校风',
        items: [
          { imageUrl: '', caption: '校训释义与校园文化展示' }
        ]
      }
    ],
    caption: '校史馆展陈（左右滑动浏览，支持双指放大）',
    audioTime: '语音讲解',
    intro: '回顾贵州交通职业大学办学历程与重要里程碑，传承校训校风。支持 VR 全景漫游与图文介绍，可在详情页进入 720 云沉浸式体验。'
  },

  courseDetail: {
    name: '示例课程：职业沟通与表达',
    tags: ['书院动态', 'AI 字幕', '配套资源'],
    audience: '全校学生',
    duration: '12 课时',
    openTime: '2026-06',
    category: '职业素养',
    intro: '示例内容。课程从倾听与提问入手，逐步过渡到会议发言、汇报陈述与公开表达，每讲配有练习与点评，用于本地开发时检查详情页的标签、元信息与配套资源列表。',
    resources: [
      { type: 'pdf', name: '示例：课程讲义（第一讲）.pdf', size: 'PDF · 2.4 MB' },
      { type: 'ppt', name: '示例：课堂课件.pptx', size: 'PPT · 6.1 MB' },
      { type: 'mp3', name: '示例：课程音频导读.mp3', size: 'MP3 · 18 MB' }
    ]
  }
}
