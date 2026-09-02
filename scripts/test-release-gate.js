#!/usr/bin/env node
/**
 * 发布门禁回归：验证 release 规则与 prod 模板，不要求仓库 env.js 当前为 prod
 */
const fs = require('fs')
const path = require('path')
const { parseEnvFile, validateDeployEnv } = require('./lib/deploy-env-rules')

const root = path.join(__dirname, '..')
const fixtureEnv = path.join(__dirname, 'fixtures', '.env.ci-release')
const prodTemplate = path.join(root, 'miniapp/config/env.prod.template.js')
const requestFile = path.join(root, 'miniapp/utils/request.js')

function assertReleaseEnvFixture() {
  const content = fs.readFileSync(fixtureEnv, 'utf8')
  const errors = validateDeployEnv(parseEnvFile(content), { release: true })
  if (errors.length > 0) {
    console.error('[test-release-gate] .env.ci-release 未通过 release 校验:')
    errors.forEach((msg) => console.error('  -', msg))
    process.exit(1)
  }
}

function assertProdMiniappTemplate() {
  const content = fs.readFileSync(prodTemplate, 'utf8')
  const envMatch = content.match(/const\s+ENV\s*=\s*['"](\w+)['"]/)
  if (!envMatch || envMatch[1] !== 'prod') {
    console.error('[test-release-gate] env.prod.template.js 须 ENV=prod')
    process.exit(1)
  }
  const prodBlock = content.match(/prod\s*:\s*\{([\s\S]*?)\}/)
  if (!prodBlock) {
    console.error('[test-release-gate] env.prod.template.js 缺少 prod 配置块')
    process.exit(1)
  }
  const useMockMatch = prodBlock[1].match(/useMock\s*:\s*(true|false)/)
  if (!useMockMatch || useMockMatch[1] !== 'false') {
    console.error('[test-release-gate] prod 模板 useMock 必须为 false')
    process.exit(1)
  }
  const urlMatch = prodBlock[1].match(/baseUrl\s*:\s*['"]([^'"]+)['"]/)
  const prodUrl = urlMatch ? urlMatch[1] : ''
  if (!prodUrl || /localhost|example\.edu\.cn/i.test(prodUrl)) {
    console.error('[test-release-gate] prod 模板 baseUrl 须为正式域名占位（非 localhost/example.edu.cn）')
    process.exit(1)
  }
}

function assertRequestLazyGetApp() {
  const content = fs.readFileSync(requestFile, 'utf8')
  if (/^const\s+app\s*=\s*getApp\(\)/m.test(content)) {
    console.error('[test-release-gate] request.js 不应在模块顶层缓存 getApp()')
    process.exit(1)
  }
  if (!content.includes('function getRuntimeApp')) {
    console.error('[test-release-gate] request.js 缺少 getRuntimeApp 惰性封装')
    process.exit(1)
  }
}

function assertViewerCheckInPreflight() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
  if (!pkg.scripts || !pkg.scripts['check:viewer']) {
    console.error('[test-release-gate] package.json 缺少 check:viewer（改 player.html 后必须能本地拦住过期观看版）')
    process.exit(1)
  }
  if (!String(pkg.scripts['preflight:local'] || '').includes('check:viewer')) {
    console.error('[test-release-gate] preflight:local 必须包含 check:viewer，否则观看版 bundle 会再次漏提交')
    process.exit(1)
  }
}

function assertBackendEnvTemplatesExposeRuntimeControls() {
  const required = [
    'JWT_ADMIN_EXPIRE_HOURS',
    'AI_PROVIDER',
    'AI_API_KEY',
    'AI_BASE_URL',
    'AI_MODEL',
    'AI_PER_DAY',
    'AI_DAILY_LIMIT',
    'AI_MIN_RELEVANCE_SCORE'
  ]
  for (const rel of ['.env.example', '.env.prod.template']) {
    const content = fs.readFileSync(path.join(root, rel), 'utf8')
    for (const key of required) {
      if (!new RegExp(`^${key}=`, 'm').test(content)) {
        console.error(`[test-release-gate] ${rel} 缺少 ${key}`)
        process.exit(1)
      }
    }
  }

  const appConfig = fs.readFileSync(
    path.join(root, 'backend/src/main/resources/application.yaml'), 'utf8')
  if (!appConfig.includes('admin-expire-hours: ${JWT_ADMIN_EXPIRE_HOURS:8}')) {
    console.error('[test-release-gate] application.yaml 未接入 JWT_ADMIN_EXPIRE_HOURS')
    process.exit(1)
  }
}

assertReleaseEnvFixture()
assertProdMiniappTemplate()
assertRequestLazyGetApp()
assertViewerCheckInPreflight()
assertBackendEnvTemplatesExposeRuntimeControls()
console.log('[test-release-gate] 通过')
