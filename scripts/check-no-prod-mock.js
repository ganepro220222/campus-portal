#!/usr/bin/env node
/**
 * 生产构建门禁：禁止 prod 环境启用 mock 或页面级静默 fallback
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const miniappRoot = path.join(root, 'miniapp')
const envFile = path.join(miniappRoot, 'config', 'env.js')
const requestFile = path.join(miniappRoot, 'utils', 'request.js')
const appFile = path.join(miniappRoot, 'app.js')

const releaseMode = process.argv.includes('--release')
const errors = []

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    errors.push(`缺少文件: ${path.relative(root, filePath)}`)
    return ''
  }
  return fs.readFileSync(filePath, 'utf8')
}

function walkJsFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue
      walkJsFiles(full, acc)
    } else if (entry.name.endsWith('.js')) {
      acc.push(full)
    }
  }
  return acc
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

if (releaseMode) {
  if (activeEnv !== 'prod') {
    errors.push('发布检查（--release）要求 config/env.js 中 ENV=prod')
  }
  const prodUrlMatch = envContent.match(/prod\s*:\s*\{[\s\S]*?baseUrl\s*:\s*['"]([^'"]+)['"]/)
  const prodUrl = prodUrlMatch ? prodUrlMatch[1] : ''
  if (!prodUrl || /localhost|example\.edu\.cn/i.test(prodUrl)) {
    errors.push('发布检查要求 prod.baseUrl 为正式域名（非 localhost / example.edu.cn 占位）')
  }
}

// 2. 关键入口禁止 mock fallback 关键字
const dangerousPatterns = [
  { file: requestFile, content: requestContent, patterns: ['mockData', "require('../mock", 'require("./mock', "require('../../mock"] },
  { file: appFile, content: appContent, patterns: ["require('./mock", 'require("./mock'] }
]

dangerousPatterns.forEach(({ file, content, patterns }) => {
  patterns.forEach((pattern) => {
    if (content.includes(pattern)) {
      errors.push(`${path.relative(root, file)} 含危险 mock 引用: ${pattern}`)
    }
  })
})

// 3. 页面级引用 mock/defaults 必须经 mockGuard 或已内置 useMock 守卫的工具模块
const UTIL_GUARDED = new Set([
  'utils/content.js',
  'utils/activity.js',
  'utils/category.js'
])

walkJsFiles(miniappRoot).forEach((filePath) => {
  const rel = path.relative(miniappRoot, filePath).replace(/\\/g, '/')
  if (rel.startsWith('mock/')) return
  const content = read(filePath)
  if (!content.includes('mock/defaults')) return
  if (UTIL_GUARDED.has(rel)) return
  if (!content.includes('mockGuard')) {
    errors.push(`${rel} 引用了 mock/defaults 但未使用 mockGuard`)
  }
})

// 4. 禁止明显的静默 fallback 写法（未配合 useMock / withListFallback）
const SILENT_PATTERNS = [
  /:\s*mock\.\w+/,
  /\?\s*mock\.\w+/,
  /:\s*decorate\w+\(mock\./,
  /mergeActivityDetail\([^,]+,\s*mock\./
]

walkJsFiles(miniappRoot).forEach((filePath) => {
  const rel = path.relative(miniappRoot, filePath).replace(/\\/g, '/')
  if (rel.startsWith('mock/') || UTIL_GUARDED.has(rel)) return
  const content = read(filePath)
  if (!content.includes('mock/defaults') && !content.includes('mock.')) return
  SILENT_PATTERNS.forEach((pattern) => {
    if (pattern.test(content) && !content.includes('mockGuard') && !content.includes('useMock')) {
      errors.push(`${rel} 可能存在静默 mock 回退: ${pattern}`)
    }
  })
})

if (errors.length > 0) {
  console.error('[check-no-prod-mock] 未通过:')
  errors.forEach((msg) => console.error('  -', msg))
  process.exit(1)
}

console.log(`[check-no-prod-mock] 通过 (当前 ENV=${activeEnv})`)
