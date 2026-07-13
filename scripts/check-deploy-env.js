#!/usr/bin/env node
/**
 * 部署环境门禁：校验 .env 与仓库内 staging 默认配置
 *
 * 用法：
 *   node scripts/check-deploy-env.js                     # 校验仓库 staging 默认配置
 *   node scripts/check-deploy-env.js --env .env          # 校验部署机 .env
 *   node scripts/check-deploy-env.js --env .env --release
 */
const fs = require('fs')
const path = require('path')
const {
  parseEnvFile,
  validateDeployEnv,
  validateRepoStagingYaml
} = require('./lib/deploy-env-rules')

const root = path.join(__dirname, '..')
const args = process.argv.slice(2)
const releaseMode = args.includes('--release')
const envFlagIndex = args.indexOf('--env')
const envPath = envFlagIndex >= 0 ? args[envFlagIndex + 1] : null

const errors = []

if (envPath) {
  const resolved = path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath)
  if (!fs.existsSync(resolved)) {
    errors.push(`未找到 .env 文件: ${resolved}`)
  } else {
    const content = fs.readFileSync(resolved, 'utf8')
    errors.push(...validateDeployEnv(parseEnvFile(content), { release: releaseMode }))
  }
} else {
  const stagingYaml = path.join(root, 'backend/src/main/resources/application-staging.yml')
  if (!fs.existsSync(stagingYaml)) {
    errors.push(`未找到 ${path.relative(root, stagingYaml)}`)
  } else {
    errors.push(...validateRepoStagingYaml(fs.readFileSync(stagingYaml, 'utf8')))
  }
}

if (errors.length > 0) {
  console.error('[check-deploy-env] 未通过:')
  errors.forEach((msg) => console.error('  -', msg))
  process.exit(1)
}

if (envPath) {
  console.log(`[check-deploy-env] 通过 (${envPath}${releaseMode ? ', release' : ''})`)
} else {
  console.log('[check-deploy-env] 通过（仓库 staging 默认配置）')
}
