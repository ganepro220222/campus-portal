/** 空列表从 0 起；已有条目则接在最大排序之后，不超过 999 */
export function nextRecommendSort(sorts) {
  const list = Array.isArray(sorts) ? sorts : []
  if (!list.length) {
    return 0
  }
  return Math.min(999, Math.max(...list) + 1)
}
