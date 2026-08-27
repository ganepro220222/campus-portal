/** 不可逆删除提交中：禁止关闭弹窗，避免 UI 已关但 DELETE 仍在途 */
export function shouldAllowDangerDeleteDialogClose(submitting: boolean): boolean {
  return !submitting
}
