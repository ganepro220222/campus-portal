/** @param {string} requestedType @param {string} currentType @param {number} seq @param {number} latestSeq */
function shouldApplyRecycleListResult(requestedType, currentType, seq, latestSeq) {
  return seq === latestSeq && requestedType === currentType
}

module.exports = { shouldApplyRecycleListResult }
