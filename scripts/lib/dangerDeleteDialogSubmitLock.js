/** @see admin/src/utils/dangerDeleteDialogSubmitLock.ts */
function shouldAllowDangerDeleteDialogClose(submitting) {
  return !submitting
}

module.exports = { shouldAllowDangerDeleteDialogClose }
