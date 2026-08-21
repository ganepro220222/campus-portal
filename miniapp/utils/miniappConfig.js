// utils/miniappConfig.js — 小程序公开配置（AI 助手文案、搜索热词）

const { get } = require('./request')

/*
 * 注意：这里是「后台没配」时的兜底，和 mock/defaults.js 不一样——
 * mock 走 useMock 开关、prod 根本不加载；这份 DEFAULT 在 prod 照样生效。
 * 提审时若后台内容配置还是空的，审核员看到的就是下面这几行，
 * 所以一律取功能导向的中性表述，不放具体内容话题。
 */
const DEFAULT = {
  aiAssistantWelcome: '你好！我是书院助手，可以基于平台知识库为你解答使用与学习相关的问题。',
  aiAssistantChips: ['平台有哪些线上展馆？', '怎么报名参加活动？', '在哪查看学习足迹？'],
  searchHotTags: ['线上展馆', '精品课程', '活动报名', '学习资源', '文创展示']
}

let cached = null
let loading = null

async function loadMiniappConfig(force = false) {
  if (!force && cached) return cached
  if (!force && loading) return loading
  loading = get('/config/miniapp', {}, { silent: true })
    .then((data) => {
      cached = {
        aiAssistantWelcome: data.aiAssistantWelcome || DEFAULT.aiAssistantWelcome,
        aiAssistantChips: Array.isArray(data.aiAssistantChips) && data.aiAssistantChips.length
          ? data.aiAssistantChips : DEFAULT.aiAssistantChips,
        searchHotTags: Array.isArray(data.searchHotTags) && data.searchHotTags.length
          ? data.searchHotTags : DEFAULT.searchHotTags
      }
      return cached
    })
    .catch(() => {
      cached = { ...DEFAULT }
      return cached
    })
    .finally(() => { loading = null })
  return loading
}

function getCachedMiniappConfig() {
  return cached || DEFAULT
}

module.exports = { loadMiniappConfig, getCachedMiniappConfig, DEFAULT_MINIAPP_CONFIG: DEFAULT }
