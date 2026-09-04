/**
 * 小程序知识问答开关。
 *
 * 学生端只检索知识库、不调大模型。关闭时入口、分包页与协议问答段一并隐藏。
 */
const ENABLE_AI_CHAT = true

const AI_CHAT_APP_PAGES = ['ai-chat/index', 'ai-chat/history']

const AI_CHAT_PACK_IGNORES = [
  { type: 'folder', value: 'packageD/ai-chat' },
  { type: 'folder', value: 'components/ai-assistant' },
  { type: 'file', value: 'utils/aiChat.js' }
]

function isAiChatPath(path) {
  const p = String(path || '').split('?')[0]
  return /\/packageD\/ai-chat(\/|$)/.test(p)
}

function sanitizeGenerativeAiClaims(html) {
  if (!html) return html
  let s = String(html)
  s = s.replace(/<p>[^<]*(AI 生成内容|内容由 AI 生成)[^<]*<\/p>\s*/g, '')
  s = s.replace(/相关内容可能经已备案的第三方模型服务处理。/g, '')
  s = s.replace(/您在「智能问答」中提交的问题将用于生成回答；/g, '您在「知识问答」中提交的问题将用于在平台知识库中检索资料；')
  s = s.replace(/AI 回答仅供参考/g, '回答仅供参考')
  s = s.replace(/智能问答（AI）/g, '知识问答')
  return s
}

function hideAiChatLegalCopy(html) {
  if (!html) return html
  let s = sanitizeGenerativeAiClaims(html)
  if (ENABLE_AI_CHAT) return s
  s = s.replace(/<p><strong>\d+\.\s*[^<]*(智能问答|AI\s*问答|知识问答)[^<]*<\/strong><\/p>\s*<p>[\s\S]*?<\/p>\s*/g, '')
  s = s.replace(/（\d+）(?:智能问答|知识问答)：[^<]*(<br\s*\/?>)?\s*/g, '')
  s = s.replace(/、(?:智能问答|知识问答)/g, '')
  s = s.replace(/(?:智能问答|知识问答)、/g, '')
  return s
}

function hideAiChatPlainCopy(text) {
  if (ENABLE_AI_CHAT || text == null || text === '') return text
  return String(text)
    .replace(/、智能问答/g, '')
    .replace(/智能问答、/g, '')
    .replace(/以及智能问答/g, '')
    .replace(/和智能问答/g, '')
    .replace(/、知识问答/g, '')
    .replace(/知识问答、/g, '')
    .replace(/以及知识问答/g, '')
    .replace(/和知识问答/g, '')
}

module.exports = {
  ENABLE_AI_CHAT,
  AI_CHAT_APP_PAGES,
  AI_CHAT_PACK_IGNORES,
  isAiChatPath,
  hideAiChatLegalCopy,
  hideAiChatPlainCopy,
  sanitizeGenerativeAiClaims
}
