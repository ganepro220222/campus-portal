#!/usr/bin/env node
/**
 * 从 miniapp/config/navigate-appids.json 同步 navigateToMiniProgramAppIdList 到 app.json
 *
 * 用法：
 *   node scripts/sync-navigate-appids.js
 *   node scripts/sync-navigate-appids.js --config miniapp/config/navigate-appids.json
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const args = process.argv.slice(2)
const configFlag = args.indexOf('--config')
const configPath = configFlag >= 0
  ? path.resolve(args[configFlag + 1])
  : path.join(root, 'miniapp/config/navigate-appids.json')
const appJsonPath = path.join(root, 'miniapp/app.json')

if (!fs.existsSync(configPath)) {
  console.error(`[sync-navigate-appids] 未找到配置: ${configPath}`)
  console.error('  请先复制 navigate-appids.template.json 为 navigate-appids.json 并填入 AppID')
  process.exit(1)
}

const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const entries = Array.isArray(raw.appIds) ? raw.appIds : []
const appIds = [...new Set(
  entries
    .map((item) => (typeof item === 'string' ? item : item && item.appId))
    .filter((id) => typeof id === 'string' && id.trim() && !id.includes('PLACEHOLDER'))
)]

if (appIds.length === 0) {
  console.warn('[sync-navigate-appids] 无有效 AppID（已跳过 PLACEHOLDER），app.json 将写入空数组')
}

const appJsonText = fs.readFileSync(appJsonPath, 'utf8')
JSON.parse(appJsonText)
const listJson = JSON.stringify(appIds, null, 2)
  .split('\n')
  .map((line, idx) => (idx === 0 ? line : `  ${line}`))
  .join('\n')
const next = appJsonText.replace(
  /"navigateToMiniProgramAppIdList"\s*:\s*\[[\s\S]*?\]/,
  `"navigateToMiniProgramAppIdList": ${listJson}`
)
if (next === appJsonText && !/"navigateToMiniProgramAppIdList"\s*:/.test(appJsonText)) {
  console.error('[sync-navigate-appids] app.json 缺少 navigateToMiniProgramAppIdList')
  process.exit(1)
}
fs.writeFileSync(appJsonPath, next.endsWith('\n') ? next : `${next}\n`, 'utf8')

console.log(`[sync-navigate-appids] 已写入 ${appIds.length} 个 AppID 到 miniapp/app.json`)
appIds.forEach((id) => console.log('  -', id))
