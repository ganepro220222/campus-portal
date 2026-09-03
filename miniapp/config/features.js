/**
 * 小程序功能开关。
 *
 * 智能问答已完整保留（packageD/ai-chat、components/ai-assistant、utils/aiChat.js、
 * 后端 RAG 接口都不删）。当前为过审临时关闭：用户和审核员都看不到问答入口。
 *
 * ——— 加回智能问答时按顺序做这 4 步 ———
 * 1. 本文件 ENABLE_AI_CHAT 改为 true
 * 2. miniapp/app.json → packageD.pages 加回 "ai-chat/index"、"ai-chat/history"
 *    （可把分包 name 从「分享」改回「智能」）
 * 3. 去掉 miniapp/project.config.json → packOptions.ignore 里这三项：
 *    folder packageD/ai-chat、folder components/ai-assistant、file utils/aiChat.js
 * 4. 首页 / 动态详情 / 展馆详情 / 文创详情 / 课程详情：加回
 *    <ai-assistant />（或 bottom="60"）以及 json 里的 usingComponents
 *
 * 个人中心菜单、关于页功能列表、首页后台入口、协议里的问答段落
 * 会随本开关自动恢复，不必再改。
 */
const ENABLE_AI_CHAT = false

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

function hideAiChatLegalCopy(html) {
  if (ENABLE_AI_CHAT || !html) return html
  let s = String(html)
  s = s.replace(/<p><strong>\d+\.\s*[^<]*(智能问答|AI\s*问答)[^<]*<\/strong><\/p>\s*<p>[\s\S]*?<\/p>\s*/g, '')
  s = s.replace(/（\d+）智能问答：[^<]*(<br\s*\/?>)?\s*/g, '')
  s = s.replace(/<p>[^<]*(AI 生成内容|内容由 AI 生成)[^<]*<\/p>\s*/g, '')
  s = s.replace(/、智能问答/g, '')
  s = s.replace(/智能问答、/g, '')
  return s
}

function hideAiChatPlainCopy(text) {
  if (ENABLE_AI_CHAT || text == null || text === '') return text
  return String(text)
    .replace(/、智能问答/g, '')
    .replace(/智能问答、/g, '')
    .replace(/以及智能问答/g, '')
    .replace(/和智能问答/g, '')
}

module.exports = {
  ENABLE_AI_CHAT,
  AI_CHAT_APP_PAGES,
  AI_CHAT_PACK_IGNORES,
  isAiChatPath,
  hideAiChatLegalCopy,
  hideAiChatPlainCopy
}
