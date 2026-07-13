#!/usr/bin/env node
/**
 * 全量发布门禁：串联后端 .env 与小程序 release 检查
 *
 * 用法：
 *   npm run check:release-all -- --env /path/to/.env
 */
const { spawnSync } = require('child_process')
const path = require('path')

const scriptsDir = __dirname
const root = path.join(scriptsDir, '..')
const args = process.argv.slice(2)
const envFlagIndex = args.indexOf('--env')
const envPath = envFlagIndex >= 0 ? args[envFlagIndex + 1] : null

if (!envPath) {
  console.error('[check-release-all] 用法: npm run check:release-all -- --env /path/to/.env')
  process.exit(1)
}

function runStep(label, scriptName, scriptArgs) {
  console.log(`[check-release-all] ${label}...`)
  const result = spawnSync(process.execPath, [path.join(scriptsDir, scriptName), ...scriptArgs], {
    cwd: root,
    stdio: 'inherit'
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

runStep('后端部署环境', 'check-deploy-env.js', ['--env', envPath, '--release'])
runStep('小程序发布环境', 'check-no-prod-mock.js', ['--release'])

console.log('[check-release-all] 全部通过')
