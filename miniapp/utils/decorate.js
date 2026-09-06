// utils/decorate.js — 列表项着色、图标分配等展示层辅助

const { formatCount } = require('./format')

const HALL_COLORS     = ['hc1', 'hc2', 'hc3', 'hc4', 'hc5']
const BANNER_COLORS   = ['s1', 's2', 's3']
const NEWS_FEED_COLORS = ['hc1', 'hc3', 'hc2', 'hc4', 'hc5']
const NEWS_FEED_ICONS  = ['file', 'flag', 'star', 'course', 'megaphone']
const NEWS_ICONS      = ['file', 'flag', 'star', 'megaphone']
const COURSE_ICONS    = ['course', 'clock', 'book']
const COURSE_COLORS   = ['hc1', 'hc3', 'hc2', 'hc5', 'hc4']
const COURSE_CARD_ICONS = ['course', 'clock', 'book', 'star', 'flag']
const ACTIVITY_COLORS = ['hc1', 'hc3', 'hc2', 'hc5']
const ACTIVITY_ICONS  = ['megaphone', 'flag', 'star', 'calendar']
const CRAFT_COLORS    = ['hc1', 'hc5', 'hc3', 'hc2', 'hc4']
const CRAFT_ICONS     = ['medal', 'star', 'museum', 'book', 'flag']

function resolveCoverImageMode(coverFitMode) {
  return coverFitMode === 'fit' ? 'aspectFit' : 'aspectFill'
}

function withCoverFields(it) {
  return {
    ...it,
    coverImageMode: resolveCoverImageMode(it.coverFitMode)
  }
}

function decorateHalls(list) {
  return (list || []).map((it, i) => withCoverFields({
    ...it,
    colorClass: it.colorClass || HALL_COLORS[i % HALL_COLORS.length],
    shortName: it.shortName || (it.name || '').replace(/馆$/, '').slice(0, 8),
    desc: it.desc || it.intro || '',
    vrReady: it.vrReady === true || (it.vrUrl && String(it.vrUrl).startsWith('https://'))
  }))
}

function decorateNews(list) {
  return (list || []).map((it, i) => withCoverFields({
    ...it,
    categoryName: it.categoryName || it.category || '书院动态',
    publishTime: it.publishTime ? String(it.publishTime).slice(0, 10) : it.publishTime,
    colorClass: it.colorClass || HALL_COLORS[i % HALL_COLORS.length],
    icon: it.icon || NEWS_ICONS[i % NEWS_ICONS.length]
  }))
}

function decorateNewsFeed(list) {
  return (list || []).map((it, i) => withCoverFields({
    ...it,
    categoryName: it.categoryName || it.category || '书院动态',
    publishTime: it.publishTime ? String(it.publishTime).slice(0, 10) : it.publishTime,
    readText: formatCount(it.readCount || 0),
    colorClass: it.colorClass || NEWS_FEED_COLORS[i % NEWS_FEED_COLORS.length],
    icon: it.icon || NEWS_FEED_ICONS[i % NEWS_FEED_ICONS.length]
  }))
}

function resolveCourseCardTags(it) {
  const rawTags = Array.isArray(it.tags) ? it.tags.filter(Boolean) : []
  const categoryFromTags = rawTags.find((t) => t !== '字幕' && t !== '在线课程')
  const categoryName = [it.categoryName, it.cat, categoryFromTags, it.tag]
    .find((v) => v && String(v).trim() && v !== '字幕') || '精品课程'
  const hasSubtitle = it.hasSubtitle === true
    || it.tagGold === true
    || it.tag === '字幕'
    || rawTags.includes('字幕')
  return {
    categoryName,
    cat: it.cat || categoryName,
    hasSubtitle,
    tags: hasSubtitle ? [categoryName, '字幕'] : [categoryName],
    tag: categoryName,
    tagGold: false
  }
}

function decorateCourses(list) {
  return (list || []).map((it, i) => withCoverFields({
    ...it,
    ...resolveCourseCardTags(it),
    colorClass: it.colorClass || HALL_COLORS[i % HALL_COLORS.length],
    icon: it.icon || COURSE_ICONS[i % COURSE_ICONS.length]
  }))
}

function decorateCourseCards(list) {
  return (list || []).map((it, i) => withCoverFields({
    ...it,
    ...resolveCourseCardTags(it),
    colorClass: it.colorClass || COURSE_COLORS[i % COURSE_COLORS.length],
    icon: it.icon || COURSE_CARD_ICONS[i % COURSE_CARD_ICONS.length],
    audience: it.audience || it.targetAudience || '全校学生'
  }))
}

function decorateBanners(list) {
  return (list || []).map((it, i) => withCoverFields({
    ...it,
    linkType: it.linkType || it.link_type,
    linkValue: it.linkValue || it.link_value,
    colorClass: it.colorClass || BANNER_COLORS[i % BANNER_COLORS.length]
  }))
}

function resolveActivityEnrollHint(it, full) {
  if (it.enrollHint) return it.enrollHint
  if (it.enrollState === 'not_started') return '报名未开始'
  if (it.enrollState === 'open' || it.canEnroll === true) return '立即报名'
  if (it.enrollState === 'full' || full) return '已满'
  if (it.enrollState === 'started') return '进行中'
  if (it.enrollState === 'started_no_end') return '已开始'
  if (it.enrollState === 'ended') return '已结束'
  if (it.enrollState === 'closed' || it.canEnroll === false) return '报名已截止'
  return '立即报名'
}

function decorateActivities(list) {
  return (list || []).map((it, i) => {
    const full = it.full != null ? !!it.full : (it.quota > 0 && it.enrolledCount >= it.quota)
    const canEnroll = it.canEnroll === true
    return withCoverFields({
      ...it,
      colorClass: it.colorClass || ACTIVITY_COLORS[i % ACTIVITY_COLORS.length],
      icon: it.icon || ACTIVITY_ICONS[i % ACTIVITY_ICONS.length],
      full,
      canEnroll,
      enrollState: it.enrollState || (canEnroll ? 'open' : (full ? 'full' : '')),
      enrollHint: resolveActivityEnrollHint(it, full)
    })
  })
}

function decorateCrafts(list) {
  return (list || []).map((it, i) => withCoverFields({
    ...it,
    colorClass: it.colorClass || CRAFT_COLORS[i % CRAFT_COLORS.length],
    icon: it.icon || CRAFT_ICONS[i % CRAFT_ICONS.length],
    categoryName: it.categoryName || '非遗工艺',
    badge: '多图'
  }))
}

module.exports = {
  HALL_COLORS,
  resolveCoverImageMode,
  resolveCourseCardTags,
  decorateHalls,
  decorateCrafts,
  decorateNews,
  decorateNewsFeed,
  decorateCourses,
  decorateCourseCards,
  decorateBanners,
  decorateActivities
}
