// utils/search.js — 搜索结果映射与跳转路径

const TYPE_ROUTES = {
  news: (id) => `/packageA/news/detail?id=${id}`,
  hall: (id) => `/packageA/hall/detail?id=${id}`,
  craft: (id) => `/packageA/craft/detail?id=${id}`,
  course: (id) => `/packageB/course/detail?id=${id}`,
  resource: () => '/packageB/resource/list'
}

function mapSearchResults(records) {
  return (records || []).map((it) => ({
    ...it,
    typeLabel: it.typeLabel || it.targetType,
    route: buildRoute(it.targetType, it.targetId)
  }))
}

function buildRoute(type, id) {
  const fn = TYPE_ROUTES[type]
  return fn ? fn(id) : ''
}

module.exports = {
  mapSearchResults,
  buildRoute
}
