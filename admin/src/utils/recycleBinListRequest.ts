/** 回收站列表请求：仅当序号仍为最新且类型未切换时才应用结果 */
export function shouldApplyRecycleListResult(
  requestedType: string,
  currentType: string,
  seq: number,
  latestSeq: number
): boolean {
  return seq === latestSeq && requestedType === currentType
}
