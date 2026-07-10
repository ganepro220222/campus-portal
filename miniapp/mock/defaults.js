// mock/defaults.js — 接口不可用时的本地兜底数据（联调完成后可逐步移除）

module.exports = {
  banners: [
    { id: 1, title: '王阳明“知行合一”专题讲座圆满举行', description: '名家云集，共探黔中阳明心学的当代价值', colorClass: 's1', category: '书院动态', linkType: 'page', linkValue: '/packageA/news/detail?id=1' },
    { id: 2, title: '“通途之路”研学品牌正式启动', description: '线上承载 · 线下研学，打造协同育人新格局', colorClass: 's2', category: '通途之路', linkType: 'page', linkValue: '/pages/hall/index' },
    { id: 3, title: '屯堡地戏走进校园 · 六百年非遗活态传承', description: '沉浸式线上展馆同步上线，可听语音讲解', colorClass: 's3', category: '文化传承', linkType: 'page', linkValue: '/pages/course/index' }
  ],

  // 各模块默认分类（接口 /categories 不可用时的兜底）
  categories: {
    news:   ['全部', '书院动态', '活动通知', '文化传承'],
    hall:   ['全部', '博物馆与校史', '红色教育', '研学服务', '素质教育', '文化艺术', '安全教育', '主题宣教'],
    course: ['全部', '阳明文化', '思政必修', '文化传承', '美育素养']
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
    { id: 3,  name: '贵州交通红色教育基地', shortName: '红色教育基地', cat: '红色教育', desc: '弘扬长征精神与交通红色基因', vrUrl: 'https://roma.720yun.com/vr/59e140eb05f9e134/', vrReady: true },
    { id: 4,  name: '交旅融合研学服务中心', shortName: '交旅研学', cat: '研学服务', desc: '交旅融合主题研学服务', vrUrl: 'https://roma.720yun.com/vr/96cb6946cefd5b99/', vrReady: true },
    { id: 5,  name: '学生素质发展中心', shortName: '素质发展中心', cat: '素质教育', desc: '学生综合素质培养成果展示', vrUrl: 'https://www.720yun.com/vr/374j5dyvrf2', vrReady: true },
    { id: 6,  name: '学生科普体验中心', shortName: '科普体验中心', cat: '素质教育', desc: '交通科技与学生科普互动体验', vrUrl: 'https://www.720yun.com/vr/7a0j5dyksk9', vrReady: true },
    { id: 7,  name: '文化千岛艺术馆', shortName: '千岛艺术馆', cat: '文化艺术', desc: '多元文化艺术作品线上展陈', vrUrl: 'https://www.720yun.com/vr/660j5dyvsv5', vrReady: true },
    { id: 8,  name: '校园安全教育馆1', shortName: '校园安全教育馆', cat: '安全教育', desc: '校园安全常识与警示教育', vrReady: false },
    { id: 9,  name: '西部山区道路运输安全警示教育基地', shortName: '西部山区安全基地', cat: '安全教育', desc: '山区道路运输安全警示教育', vrReady: false },
    { id: 10, name: '节水宣传教育中心', shortName: '节水宣传中心', cat: '主题宣教', desc: '节水理念与宣传教育成果', vrUrl: 'https://www.720yun.com/vr/f7bj5pmOkO2', vrReady: true }
  ],

  newsHome: [
    { id: 1, title: '中华文化书院举办王阳明“知行合一”专题讲座', categoryName: '书院动态', publishTime: '2026-06-05' },
    { id: 2, title: '“通途之路”研学品牌启动仪式在我校举行', categoryName: '活动通知', publishTime: '2026-06-03' },
    { id: 3, title: '屯堡地戏走进校园：非遗活态传承公开课开讲', categoryName: '文化传承', publishTime: '2026-06-01' }
  ],

  newsFull: [
    { id: 1, title: '中华文化书院举办王阳明“知行合一”专题讲座', category: '书院动态', publishTime: '2026-06-05', readCount: 1234 },
    { id: 2, title: '“通途之路”研学品牌启动仪式在我校举行', category: '活动通知', publishTime: '2026-06-03', readCount: 980 },
    { id: 3, title: '屯堡地戏走进校园：非遗活态传承公开课开讲', category: '文化传承', publishTime: '2026-06-01', readCount: 1500 },
    { id: 4, title: '阳明心学十二讲课程上线，欢迎选学', category: '书院动态', publishTime: '2026-05-28', readCount: 860 },
    { id: 5, title: '红色交通史主题展在校史馆开展', category: '文化传承', publishTime: '2026-05-25', readCount: 742 },
    { id: 6, title: '关于开展 2026 年传统文化系列研学活动的通知', category: '活动通知', publishTime: '2026-05-20', readCount: 655 }
  ],

  coursesHome: [
    { id: 1, name: '阳明心学十二讲', categoryName: 'AI 字幕', lessonCount: 12, audience: '全校学生' },
    { id: 2, name: '长征精神与红色交通史', categoryName: '思政必修', lessonCount: 8, audience: '全校学生' }
  ],

  coursesFull: [
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
  ],

  activities: [
    { id: 1, title: '“知行合一”阳明文化专题讲座', startTime: '2026-06-15 14:30', location: '明德讲堂', enrolledCount: 186, quota: 300, tag: '讲座' },
    { id: 2, title: '“通途之路”研学品牌启动仪式', startTime: '2026-06-20 09:00', location: '学术报告厅', enrolledCount: 240, quota: 240, tag: '活动' },
    { id: 3, title: '屯堡地戏非遗活态传承公开课', startTime: '2026-06-25 15:00', location: '非遗技艺馆', enrolledCount: 88, quota: 120, tag: '公开课' },
    { id: 4, title: '红色交通史主题研学行', startTime: '2026-07-02 08:30', location: '遵义会议会址', enrolledCount: 56, quota: 80, tag: '研学' }
  ],

  colleges: [
    { id: 1,  name: '马克思主义学院', short: '马院', en: 'Marxism',        desc: '马院 + 书院协同育人', colorClass: 'hc3' },
    { id: 2,  name: '轨道交通学院', short: '轨道', en: 'Rail Transit',     desc: '轨道牵引 · 智慧运维', colorClass: 'hc1' },
    { id: 3,  name: '智能交通学院', short: '智交', en: 'Smart Traffic',    desc: '车路协同 · 智慧出行', colorClass: 'hc1' },
    { id: 4,  name: '汽车工程学院', short: '汽车', en: 'Automobile',       desc: '新能源 · 智能网联', colorClass: 'hc2' },
    { id: 5,  name: '路桥工程学院', short: '路桥', en: 'Road & Bridge',    desc: '通途之路 · 大国工匠', colorClass: 'hc2' },
    { id: 6,  name: '交通运输学院', short: '运输', en: 'Transportation',   desc: '运输组织 · 物流管理', colorClass: 'hc4' },
    { id: 7,  name: '航运航空学院', short: '航运', en: 'Aviation',         desc: '海空联运 · 蓝色梦想', colorClass: 'hc4' },
    { id: 8,  name: '建筑工程学院', short: '建工', en: 'Construction',     desc: '匠筑营造 · 品质人居', colorClass: 'hc5' },
    { id: 9,  name: '信息工程学院', short: '信息', en: 'Information',       desc: '数字技术 · 智能应用', colorClass: 'hc1' },
    { id: 10, name: '经济管理学院', short: '经管', en: 'Management',        desc: '经世致用 · 知行合一', colorClass: 'hc3' },
    { id: 11, name: '人文艺术学院', short: '人文', en: 'Humanities',       desc: '以美育人 · 以文化人', colorClass: 'hc5' }
  ],

  activityDetail: {
    id: 1,
    title: '“知行合一”阳明文化专题讲座',
    location: '明德讲堂',
    startTime: '2026-06-15 14:30',
    intro: '邀请省内知名学者主讲，深入阐释阳明心学“知行合一”的当代价值。',
    tag: '讲座',
    quota: 300,
    enrolledCount: 186,
    canEnroll: true,
    enrollStatus: 'none'
  },

  crafts: [
    { id: 1, name: '苗族银饰·蝴蝶冠', intro: '贵州苗族传统银饰', categoryName: '非遗工艺', previewType: 'multi_image' },
    { id: 2, name: '蜡染壁挂·山水阳明', intro: '蜡染工艺呈现龙场山水', categoryName: '非遗工艺', previewType: 'multi_image' },
    { id: 3, name: '屯堡石雕·地戏面具', intro: '六百年非遗活态传承', categoryName: '非遗工艺', previewType: 'model3d' }
  ],

  craftDetail: {
    id: 1,
    name: '苗族银饰·蝴蝶冠',
    introZh: '贵州苗族传统银饰，以蝴蝶妈妈为图腾，寓意生命与美好。',
    introEn: 'Traditional Miao silver headdress featuring butterfly motifs.',
    previewType: 'multi_image',
    images: [{ imageUrl: '', angleLabel: '正面' }],
    contact: { phone: '0851-12345678', wechat: 'shuyuan_craft', email: 'craft@gzjtzy.edu.cn' }
  },

  resources: [
    { id: 1, name: '阳明心学导读.pdf', fileType: 'pdf', fileSizeKb: 2048, fileSizeText: '2.0 MB', categoryName: '思政学习' },
    { id: 2, name: '长征精神学习课件.ppt', fileType: 'ppt', fileSizeKb: 5120, fileSizeText: '5.0 MB', categoryName: '思政学习' },
    { id: 3, name: '屯堡文化读本.doc', fileType: 'word', fileSizeKb: 1024, fileSizeText: '1.0 MB', categoryName: '文化读本' },
    { id: 4, name: '阳明心学十二讲·配套课件.pptx', fileType: 'ppt', fileSizeKb: 6220, fileSizeText: '6.1 MB', categoryName: '课程课件' },
    { id: 5, name: '龙场悟道·情景微课.mp4', fileType: 'mp4', fileSizeKb: 86016, fileSizeText: '84 MB', categoryName: '视频课程' },
    { id: 6, name: '致良知·音频导读.mp3', fileType: 'mp3', fileSizeKb: 18432, fileSizeText: '18 MB', categoryName: '音频伴学' },
    { id: 7, name: '屯堡地戏·非遗纪录短片.mp4', fileType: 'mp4', fileSizeKb: 132096, fileSizeText: '129 MB', categoryName: '视频课程' }
  ],

  newsDetail: {
    article: {
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
    },
    reco: [
      { id: 2, n: '“通途之路”研学品牌启动仪式在我校举行', m: '活动通知 · 2026-06-03' },
      { id: 3, n: '屯堡地戏走进校园：非遗活态传承公开课开讲', m: '文化传承 · 2026-06-01' },
      { id: 4, n: '阳明心学十二讲课程上线，欢迎选学', m: '书院动态 · 2026-05-28' }
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
    caption: '校史馆展陈（左右滑动浏览，支持双指放大）',
    audioTime: '语音讲解',
    intro: '回顾贵州交通职业大学办学历程与重要里程碑，传承校训校风。支持 VR 全景漫游与图文介绍，可在详情页进入 720 云沉浸式体验。'
  },

  courseDetail: {
    name: '阳明心学十二讲',
    tags: ['书院动态', 'AI 字幕', '配套资源'],
    audience: '全校学生',
    duration: '12 课时',
    openTime: '2026-06',
    category: '阳明文化',
    intro: '本课程围绕王阳明“心即理”“知行合一”“致良知”三大命题展开，结合龙场悟道的黔中实践，带领学生走进阳明心学的思想世界，涵养家国情怀与笃行精神。',
    resources: [
      { type: 'pdf', name: '阳明心学讲义（第一讲）.pdf', size: 'PDF · 2.4 MB' },
      { type: 'ppt', name: '知行合一·课堂课件.pptx', size: 'PPT · 6.1 MB' },
      { type: 'mp3', name: '致良知·音频导读.mp3', size: 'MP3 · 18 MB' }
    ]
  }
}
