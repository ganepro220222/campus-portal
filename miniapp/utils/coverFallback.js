// utils/coverFallback.js — 列表封面加载失败后回退图标，不把一次破图钉死

const COVER_LIST_KEYS = {
  banners: true,
  hallList: true,
  newsList: true,
  courseList: true,
  activityList: true,
  craftList: true
}

function readEventDataset(e) {
  return (e && e.currentTarget && e.currentTarget.dataset) || {}
}

function coverUrlOf(item) {
  if (!item) return ''
  return String(item.cover || item.imageUrl || '')
}

function markCoverFailed(list, id, expectedUrl) {
  const key = id == null || id === '' ? '' : String(id)
  if (!key || !Array.isArray(list) || !list.length) return list
  const expect = expectedUrl == null || expectedUrl === '' ? '' : String(expectedUrl)
  let changed = false
  const next = list.map((item) => {
    if (!item || String(item.id) !== key) return item
    if (item.coverFailed) return item
    if (expect && coverUrlOf(item) !== expect) return item
    changed = true
    return { ...item, coverFailed: true }
  })
  return changed ? next : list
}

function coverFailedPatch(data, listKey, id, expectedUrl) {
  if (!COVER_LIST_KEYS[listKey]) return null
  const list = data && data[listKey]
  const next = markCoverFailed(list, id, expectedUrl)
  if (next === list) return null
  return { [listKey]: next }
}

function applyCoverFailed(page, listKey, e) {
  if (!page || typeof page.setData !== 'function') return false
  const ds = readEventDataset(e)
  const key = listKey || ds.list
  const patch = coverFailedPatch(page.data, key, ds.id, ds.cover)
  if (!patch) return false
  page.setData(patch)
  return true
}

module.exports = {
  COVER_LIST_KEYS,
  coverUrlOf,
  markCoverFailed,
  coverFailedPatch,
  applyCoverFailed
}
