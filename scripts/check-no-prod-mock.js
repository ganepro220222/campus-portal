#!/usr/bin/env node
/**
 * 生产构建门禁：禁止 prod 环境启用 mock 或危险 fallback
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const envFile = path.join(root, 'miniapp', 'config', 'env.js')
const requestFile = path.join(root, 'miniapp', 'utils', 'request.js')
const appFile = path.join(root, 'miniapp', 'app.js')

const errors = []

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    errors.push(`缺少文件: ${path.relative(root, filePath)}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

const envContent = read(envFile)
const requestContent = read(requestFile)
const appContent = read(appFile)

// 1. prod 配置 useMock 必须为 false
const envMatch = envContent.match(/const\s+ENV\s*=\s*['"](\w+)['"]/)
const activeEnv = envMatch ? envMatch[1] : 'unknown'
const prodBlock = envContent.match(/prod\s*:\s*\{([\s\S]*?)\}/)
if (prodBlock) {
  const useMockMatch = prodBlock[1].match(/useMock\s*:\s*(true|false)/)
  if (!useMockMatch || useMockMatch[1] !== 'false') {
    errors.push('prod 配置中 useMock 必须为 false')
  }
} else {
  errors.push('未找到 prod 环境配置块')
}

if (activeEnv === 'prod') {
  if (/useMock\s*:\s*true/.test(envContent)) {
    errors.push('当前 ENV=prod 但存在 useMock: true')
  }
  if (/localhost/i.test(envContent.match(/prod\s*:\s*\{[\s\S]*?\}/)?.[0] || '')) {
    errors.push('prod baseUrl 不应使用 localhost')
  }
}

// 2. 关键入口禁止 mock fallback 关键字
const dangerousPatterns = [
  { file: requestFile, content: requestContent, patterns: ['mockData', 'require(\'../mock', 'require("./mock', 'require(\'../../mock'] },
  { file: appFile, content: appContent, patterns: ['require(\'./mock', 'require("./mock'] }
]

dangerousPatterns.forEach(({ file, content, patterns }) => {
  patterns.forEach((pattern) => {
    if (content.includes(pattern)) {
      errors.push(`${path.relative(root, file)} 含危险 mock 引用: ${pattern}`)
    }
  })
})

if (errors.length > 0) {
  console.error('[check-no-prod-mock] 未通过:')
  errors.forEach((msg) => console.error('  -', msg))
  process.exit(1)
}

console.log(`[check-no-prod-mock] 通过 (当前 ENV=${activeEnv})`)
