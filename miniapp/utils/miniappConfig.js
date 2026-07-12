// utils/miniappConfig.js — 小程序公开配置（AI 助手文案、搜索热词）

const { get } = require('./request')

const DEFAULT = {
  aiAssistantWelcome: '你好！我是书院文化助手，可以基于书院知识库为你解答文化相关问题。',
  aiAssistantChips: ['什么是阳明文化？', '屯堡文化有何特色？', '龙场悟道讲了什么？'],
  searchHotTags: ['阳明文化', '屯堡地戏', '红色交通', '非遗银饰', '知行合一']
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
