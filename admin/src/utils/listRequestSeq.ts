/** 列表请求：仅当序号仍为最新时才应用结果 */
export function shouldApplyListResult(seq: number, latestSeq: number): boolean {
  return seq === latestSeq
}
