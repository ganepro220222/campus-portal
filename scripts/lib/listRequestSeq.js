/** @param {number} seq @param {number} latestSeq */
function shouldApplyListResult(seq, latestSeq) {
  return seq === latestSeq
}

/**
 * 与 admin/src/utils/listRequestSeq.ts 保持一致。
 * 首页推荐添加弹窗：序号、板块、弹窗都对得上才写入候选，避免快速切换串台。
 * @param {number} seq
 * @param {number} latestSeq
 * @param {boolean} dialogOpen
 * @param {string} requestedModule
 * @param {string} currentModule
 */
function shouldApplyCandidateResult(seq, latestSeq, dialogOpen, requestedModule, currentModule) {
  return !!dialogOpen && seq === latestSeq && requestedModule === currentModule
}

module.exports = { shouldApplyListResult, shouldApplyCandidateResult }
