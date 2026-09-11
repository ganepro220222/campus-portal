/**
 * 把分页列表接口翻完。管理端选内容（轮播跳转、首页推荐）不能只拿第一页。
 *
 * size 是单页条数，不是总上限。maxPages 只防止接口异常时死循环。
 */
export async function loadAllPagedRecords(fetchPage, size = 100, maxPages = 50) {
  const pageSize = size > 0 ? size : 100
  const pageLimit = maxPages > 0 ? maxPages : 50
  const all = []
  for (let page = 1; page <= pageLimit; page += 1) {
    const res = await fetchPage(page, pageSize)
    const records = Array.isArray(res && res.records) ? res.records : []
    all.push(...records)
    const total = res && typeof res.total === 'number' ? res.total : null
    if (!records.length || records.length < pageSize) {
      break
    }
    if (total != null && all.length >= total) {
      break
    }
  }
  return all
}
