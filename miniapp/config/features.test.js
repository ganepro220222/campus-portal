/**
 * 智能问答开关与注册页、上传包忽略项必须对齐。
 * 运行：node miniapp/config/features.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  ENABLE_AI_CHAT,
  AI_CHAT_APP_PAGES,
  AI_CHAT_PACK_IGNORES,
  isAiChatPath,
  hideAiChatLegalCopy
} = require('./features')

const miniappDir = path.join(__dirname, '..')
const app = JSON.parse(fs.readFileSync(path.join(miniappDir, 'app.json'), 'utf8'))
const project = JSON.parse(fs.readFileSync(path.join(miniappDir, 'project.config.json'), 'utf8'))
const packageD = (app.subpackages || []).find((p) => p.root === 'packageD')
assert.ok(packageD, 'app.json 缺少 packageD')
const pages = packageD.pages || []
const ignore = (project.packOptions && project.packOptions.ignore) || []

function hasIgnore(item) {
  return ignore.some((it) => it.type === item.type && it.value === item.value)
}

if (ENABLE_AI_CHAT) {
  AI_CHAT_APP_PAGES.forEach((p) => {
    assert.ok(pages.includes(p), `开关已打开，app.json packageD 须加回 ${p}`)
  })
  AI_CHAT_PACK_IGNORES.forEach((item) => {
    assert.ok(!hasIgnore(item), `开关已打开，须去掉 packOptions.ignore ${item.value}`)
  })
} else {
  AI_CHAT_APP_PAGES.forEach((p) => {
    assert.ok(!pages.includes(p), `过审关闭期，app.json 不得注册 ${p}`)
  })
  AI_CHAT_PACK_IGNORES.forEach((item) => {
    assert.ok(hasIgnore(item), `过审关闭期，packOptions.ignore 须包含 ${item.value}`)
  })
  assert.ok(pages.includes('poster/generate'), '关闭问答后仍须保留海报页')
}

assert.ok(isAiChatPath('/packageD/ai-chat/index'))
assert.ok(isAiChatPath('/packageD/ai-chat/history?x=1'))
assert.ok(!isAiChatPath('/packageD/poster/generate'))

const stripped = hideAiChatLegalCopy('<p><strong>5. 智能问答声明</strong></p>\n<p>AI 生成内容仅供参考。</p>\n<p>其他</p>')
assert.ok(!stripped.includes('AI 生成'), stripped)
assert.ok(stripped.includes('其他'))
if (!ENABLE_AI_CHAT) {
  assert.ok(!stripped.includes('智能问答'))
}

if (ENABLE_AI_CHAT) {
  const fabPages = [
    'pages/index/index.json',
    'packageA/news/detail.json',
    'packageA/hall/detail.json',
    'packageA/craft/detail.json',
    'packageB/course/detail.json'
  ]
  fabPages.forEach((rel) => {
    const json = JSON.parse(fs.readFileSync(path.join(miniappDir, rel), 'utf8'))
    const comps = json.usingComponents || {}
    assert.ok(comps['ai-assistant'], `开关已打开，${rel} 须注册 ai-assistant`)
  })
}

console.log('[features.test] PASS')
