/** WangEditor HTML 是否为空：无文字且无插图才算空（纯图片动态允许保存） */
export function isEditorContentEmpty(htmlValue?: string): boolean {
  if (!htmlValue) return true
  if (/<img\b/i.test(htmlValue)) return false
  const text = htmlValue
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim()
  return !text
}
