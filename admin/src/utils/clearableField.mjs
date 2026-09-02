/**
 * 后台可清空字段：把 null/undefined 收成空串。
 * Element Plus 日期清除默认是 null；`|| undefined` 会把空串吃掉，后端就当没改。
 */
export function explicitClear(value) {
  return value == null ? '' : value
}
