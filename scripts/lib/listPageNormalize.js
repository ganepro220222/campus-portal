function normalizeListPage(page, total, pageSize) {
  if (pageSize <= 0) {
    return Math.max(1, page)
  }
  const maxPage = Math.max(1, Math.ceil(total / pageSize))
  return Math.min(Math.max(1, page), maxPage)
}

module.exports = { normalizeListPage }
