// mock/defaults.js — 接口不可用时的本地兜底数据（联调完成后可逐步移除）

module.exports = {
  banners: [
    { id: 1, title: '王阳明“知行合一”专题讲座圆满举行', description: '名家云集，共探黔中阳明心学的当代价值', colorClass: 's1', category: '书院动态' },
    { id: 2, title: '“通途之路”研学品牌正式启动', description: '线上承载 · 线下研学，打造协同育人新格局', colorClass: 's2', category: '通途之路' },
    { id: 3, title: '屯堡地戏走进校园 · 六百年非遗活态传承', description: '沉浸式线上展馆同步上线，可听语音讲解', colorClass: 's3', category: '文化传承' }
  ],

  hallsHome: [
    { id: 1, name: '阳明文化馆' },
    { id: 2, name: '屯堡文化馆' },
    { id: 3, name: '红色文化馆' },
    { id: 4, name: '民族文化馆' },
    { id: 5, name: '交通文化馆' },
    { id: 6, name: '校史馆' }
  ],

  hallsFull: [
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
    name: '阳明文化馆',
    slides: [
      { cls: 'gi1', icon: 'museum' },
      { cls: 'gi2', icon: 'star' },
      { cls: 'gi3', icon: 'book' }
    ],
    caption: '阳明先生像 · 龙场悟道（左右滑动浏览，支持双指放大）',
    audioTime: '语音讲解 03:48',
    intro: '王阳明谪居贵州龙场期间，于困顿中悟“格物致知”之旨，史称“龙场悟道”，由此奠定心学体系。本馆以图文、实景与多媒体相结合的方式，系统呈现阳明先生的生平、思想脉络及其在黔中大地的深远影响，引导师生在沉浸式浏览中体悟“知行合一”的精神品格。'
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
