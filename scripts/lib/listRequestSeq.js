/** @param {number} seq @param {number} latestSeq */
function shouldApplyListResult(seq, latestSeq) {
  return seq === latestSeq
}

module.exports = { shouldApplyListResult }
