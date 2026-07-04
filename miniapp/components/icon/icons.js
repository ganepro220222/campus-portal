// components/icon/icons.js
// 图标图形库 + data URI 生成。图形数据 1:1 取自 design/demo 演示稿。
// 独立成模块，便于组件与校验脚本共用。
//
// 每个图标：{ i: 内部 SVG, m: 'stroke' | 'fill', w: 默认描边粗细 }

const ICONS = {
  /* ── TabBar ── */
  'home':        { i: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>', m: 'stroke', w: 2 },
  'news':        { i: '<path d="M4 4h13a2 2 0 0 1 2 2v13a1 1 0 0 0 2 0"/><path d="M4 4v16h13"/><line x1="7" y1="9" x2="14" y2="9"/><line x1="7" y1="13" x2="14" y2="13"/>', m: 'stroke', w: 2 },
  'museum':      { i: '<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6"/>', m: 'stroke', w: 1.8 },
  'course':      { i: '<path d="M2 7l10-4 10 4-10 4z"/><path d="M6 10v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"/>', m: 'stroke', w: 1.8 },

  /* ── 顶栏 / 通用 ── */
  'bell':        { i: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>', m: 'stroke', w: 2 },
  'search':      { i: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>', m: 'stroke', w: 2 },
  'user-circle': { i: '<circle cx="12" cy="9" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="12" cy="12" r="10"/>', m: 'stroke', w: 1.8 },
  'chevron-right': { i: '<polyline points="9 18 15 12 9 6"/>', m: 'stroke', w: 2.5 },
  'chevron-left':  { i: '<polyline points="15 18 9 12 15 6"/>', m: 'stroke', w: 2.4 },
  'arrow-right': { i: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>', m: 'stroke', w: 2 },

  /* ── 功能入口 ── */
  'entry-news':     { i: '<path d="M4 4h13a2 2 0 0 1 2 2v13a1 1 0 0 0 2 0V8"/><path d="M4 4v15a1 1 0 0 0 1 1h13"/><line x1="7" y1="8" x2="14" y2="8"/><line x1="7" y1="12" x2="14" y2="12"/><line x1="7" y1="16" x2="11" y2="16"/>', m: 'stroke', w: 1.8 },
  'entry-resource': { i: '<path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="12" y1="12" x2="12" y2="18"/><polyline points="9 15 12 18 15 15"/>', m: 'stroke', w: 1.8 },
  'entry-enroll':   { i: '<path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>', m: 'stroke', w: 1.8 },

  /* ── 公告 / 资讯 ── */
  'megaphone':   { i: '<path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>', m: 'stroke', w: 2 },
  'file':        { i: '<path d="M4 19V6a2 2 0 0 1 2-2h9l5 5v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/>', m: 'stroke', w: 1.6 },
  'flag':        { i: '<path d="M4 4v16M4 4h11l-2 4 2 4H4"/>', m: 'stroke', w: 1.6 },
  'star':        { i: '<path d="M12 3l2.5 5 5.5.8-4 3.9 1 5.5L12 21l-5-2.9 1-5.5-4-3.9 5.5-.8z"/>', m: 'stroke', w: 1.6 },

  /* ── 课程 / 详情 元信息 ── */
  'users':       { i: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/>', m: 'stroke', w: 2 },
  'clock':       { i: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', m: 'stroke', w: 2 },
  'calendar':    { i: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>', m: 'stroke', w: 2 },
  'book':        { i: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>', m: 'stroke', w: 2 },
  'cc':          { i: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 11h3M7 14h6M14 11h3"/>', m: 'stroke', w: 2 },
  'download':    { i: '<path d="M12 3v12"/><polyline points="7 12 12 17 17 12"/><path d="M5 21h14"/>', m: 'stroke', w: 2.2 },

  /* ── 播放 / 媒体 ── */
  'play':        { i: '<path d="M8 5v14l11-7z"/>', m: 'fill' },

  /* ── 操作：赞 / 藏 / 享 / 海报 ── */
  'thumb':       { i: '<path d="M14 9V5a3 3 0 0 0-6 0v4H5l1.5 11h11L19 9z"/>', m: 'stroke', w: 2 },
  'bookmark':    { i: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>', m: 'stroke', w: 2 },
  'share':       { i: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>', m: 'stroke', w: 2 },
  'poster':      { i: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M4 17l5-4 4 3 3-2 4 3"/>', m: 'stroke', w: 2 },

  /* ── AI 助手 ── */
  'robot':       { i: '<path d="M12 3a7 7 0 0 1 7 7c0 2-1 3.7-2.5 4.8V18a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-3.2A7 7 0 0 1 12 3z"/><path d="M9 21h6"/><circle cx="9.5" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="10" r="1" fill="currentColor" stroke="none"/>', m: 'stroke', w: 1.8 },
  'send':        { i: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/>', m: 'stroke', w: 2.2 },

  /* ── 登录 ── */
  'user':        { i: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>', m: 'stroke', w: 2 },
  'lock':        { i: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>', m: 'stroke', w: 2 },
  'login':       { i: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>', m: 'stroke', w: 2.4 },
  'wechat':      { i: '<path d="M8.5 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm5 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM19 16c0 2.5-2.5 4.5-5.5 4.5-.6 0-1.2-.1-1.7-.2l-1.7 1-.5-1.5c-1.8-1-3-2.6-3-4.3 0-2.9 3.1-5.5 7-5.5s7 2.6 7 5.5z"/>', m: 'fill' },
  'eye':         { i: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>', m: 'stroke', w: 2 },
  'eye-off':     { i: '<path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-2.3 3.3M6.6 6.6A18 18 0 0 0 2 11s3.5 7 10 7a10 10 0 0 0 4-.8"/><line x1="2" y1="2" x2="22" y2="22"/>', m: 'stroke', w: 2 },

  /* ── 个人中心 ── */
  'medal':       { i: '<path d="M8.2 12.5 5 22l7-4 7 4-3.2-9.5"/><circle cx="12" cy="8" r="6"/>', m: 'stroke', w: 2 },
  'chat':        { i: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', m: 'stroke', w: 2 },
  'logout':      { i: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>', m: 'stroke', w: 2 },
  'heart':       { i: '<path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/>', m: 'stroke', w: 2 },
  'footprint':   { i: '<path d="M4 16c0-2 1-3 2.5-3S9 14 9 16s-1 4-2.5 4S4 18 4 16z"/><path d="M6 9c0-1.5.7-2.5 1.8-2.5S9.5 7.5 9.5 9"/><path d="M15 12c0-2 1-3 2.5-3s2.5 1 2.5 3-1 4-2.5 4-2.5-2-2.5-4z"/><path d="M17 5c0-1.5.7-2.5 1.8-2.5S20.5 3.5 20.5 5"/>', m: 'stroke', w: 1.8 },
  'grid':        { i: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>', m: 'stroke', w: 1.8 },
  'pin':         { i: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>', m: 'stroke', w: 2 }
}

function buildSrc(name, size, color, sw) {
  const def = ICONS[name]
  if (!def) return ''
  const inner = def.i.replace(/currentColor/g, color)
  let attrs
  if (def.m === 'fill') {
    attrs = 'fill="' + color + '"'
  } else {
    const width = sw > 0 ? sw : (def.w || 2)
    attrs = 'fill="none" stroke="' + color + '" stroke-width="' + width +
            '" stroke-linecap="round" stroke-linejoin="round"'
  }
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + size +
    '" height="' + size + '" viewBox="0 0 24 24" ' + attrs + '>' + inner + '</svg>'
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

module.exports = { ICONS, buildSrc }
