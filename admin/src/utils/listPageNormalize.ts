/** 删除/筛选后若当前页超过最大页，回退到最后一页 */
export function normalizeListPage(page: number, total: number, pageSize: number): number {
  if (pageSize <= 0) {
    return Math.max(1, page)
  }
  const maxPage = Math.max(1, Math.ceil(total / pageSize))
  return Math.min(Math.max(1, page), maxPage)
}
