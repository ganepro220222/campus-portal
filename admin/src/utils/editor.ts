/** WangEditor HTML 是否为空（去掉标签与 &nbsp; 后无文字） */
export function isEditorContentEmpty(htmlValue?: string): boolean {
  if (!htmlValue) return true
  const text = htmlValue
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim()
  return !text
}
