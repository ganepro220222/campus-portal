import { dropPastedBackgrounds } from '@/utils/pastedBackground.mjs'

/**
 * 富文本入库前基础净化：去除 script/iframe、事件属性与 javascript: 链接，
 * 外加把粘贴带进来的白底摘掉——见 utils/pastedBackground.mjs 的说明。
 * 在这里做是为了**新写的内容不再带进来**；已经发出去的旧内容由小程序端兜住。
 */
export function sanitizeRichHtml(html?: string): string {
  if (!html) return ''
  let out = html
  out = out.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
  out = out.replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
  out = out.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  out = out.replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '')
  out = dropPastedBackgrounds(out)
  return out
}

/** 将 HTML 转为纯文本（用于 AI 输入） */
export function stripHtml(html?: string): string {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** 将 AI 返回的纯文本转为 WangEditor 可用的 HTML 段落 */
export function plainTextToHtml(text?: string): string {
  if (!text) return ''
  if (/<[a-z][\s\S]*>/i.test(text)) return text
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('')
}

/** 从多行标题建议中取第一行作为默认标题 */
export function pickFirstTitleSuggestion(text?: string): string {
  if (!text) return ''
  const firstLine = text.split('\n').map((line) => line.trim()).find(Boolean) || ''
  return firstLine.replace(/^\d+[\.\、\)]\s*/, '').trim()
}
