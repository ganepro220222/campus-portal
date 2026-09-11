/** 列表请求：仅当序号仍为最新时才应用结果 */
export function shouldApplyListResult(seq: number, latestSeq: number): boolean {
  return seq === latestSeq
}

/** 首页推荐添加弹窗：序号、板块、弹窗都对得上才写入候选，避免快速切换串台 */
export function shouldApplyCandidateResult(
  seq: number,
  latestSeq: number,
  dialogOpen: boolean,
  requestedModule: string,
  currentModule: string
): boolean {
  return !!dialogOpen && seq === latestSeq && requestedModule === currentModule
}

