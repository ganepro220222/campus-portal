/**
 * 用本地日历取 YYYY-MM，避免 toISOString() 的 UTC 在每月 1 日凌晨错月。
 */
export function currentYearMonth(now = new Date()) {
  const month = now.getMonth() + 1
  return `${now.getFullYear()}-${String(month).padStart(2, '0')}`
}
