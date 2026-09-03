/**
 * 首页加载：接口失败不得被哨兵压成「运营没配」，也不得把空哨兵写进会话缓存。
 */

function allContentFailed(flags) {
  return !flags.banners && !flags.recommends && !flags.colleges
}

function shouldShowHomeError(hasPrevious, flags) {
  return !hasPrevious && allContentFailed(flags)
}

function shouldShowHomeRefreshError(hasPrevious, flags) {
  return !!hasPrevious && (!flags.banners || !flags.recommends || !flags.colleges)
}

/** 失败栏沿用上次成功数据；没有上次成功数据则不写进缓存（避免空哨兵钉会话）。 */
function mergeHomeCache(previous, next, failed) {
  const prev = previous || {}
  const pick = (fail, key, fallback) => {
    if (!fail) return next[key]
    if (prev[key] != null) return prev[key]
    return fallback
  }
  const out = {}
  const banners = pick(failed.banners, 'banners')
  const hallList = pick(failed.recommends, 'hallList')
  const newsList = pick(failed.recommends, 'newsList')
  const courseList = pick(failed.recommends, 'courseList')
  const collegeList = pick(failed.colleges, 'collegeList')
  const collegeHome = pick(failed.colleges, 'collegeHome')
  const navEntries = pick(failed.navItems, 'navEntries', next.navEntries)
  if (banners != null) out.banners = banners
  if (hallList != null) out.hallList = hallList
  if (newsList != null) out.newsList = newsList
  if (courseList != null) out.courseList = courseList
  if (collegeList != null) out.collegeList = collegeList
  if (collegeHome != null) out.collegeHome = collegeHome
  if (navEntries != null) out.navEntries = navEntries
  return out
}

function hasCacheableHomeData(cache) {
  if (!cache) return false
  return !!(
    (cache.banners && cache.banners.length)
    || (cache.hallList && cache.hallList.length)
    || (cache.newsList && cache.newsList.length)
    || (cache.courseList && cache.courseList.length)
    || (cache.collegeList && cache.collegeList.length)
  )
}

function viewListsFromHomeCache(cache, defaultNav) {
  const c = cache || {}
  return {
    banners: c.banners || [],
    hallList: c.hallList || [],
    newsList: c.newsList || [],
    courseList: c.courseList || [],
    collegeList: c.collegeList || [],
    collegeHome: c.collegeHome || [],
    navEntries: c.navEntries || defaultNav
  }
}

function resolveHomeSection(failed, decorated, previousList) {
  if (!failed) return decorated || []
  return Array.isArray(previousList) ? previousList : []
}

module.exports = {
  allContentFailed,
  shouldShowHomeError,
  shouldShowHomeRefreshError,
  mergeHomeCache,
  hasCacheableHomeData,
  viewListsFromHomeCache,
  resolveHomeSection
}
