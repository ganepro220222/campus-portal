/**
 * 部署环境变量校验（纯逻辑，供 CLI 与单测复用）
 */

const DEV_JWT_SECRETS = new Set([
  'shuyuan-dev-jwt-secret-change-in-prod',
  'shuyuan-dev-jwt-secret'
])

const DEV_PASSWORDS = new Set(['dev123456', ''])
const GUARDED_PROFILES = new Set(['staging', 'prod'])
const UNSAFE_PROFILES = new Set(['dev', 'docker', ''])

function parseEnvFile(content) {
  const vars = {}
  if (!content) return vars
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const idx = line.indexOf('=')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    vars[key] = value
  }
  return vars
}

function splitCorsPatterns(value) {
  if (!value || !value.trim()) return []
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function validateCorsPatterns(patterns, errors, label) {
  patterns.forEach((pattern) => {
    const lower = pattern.toLowerCase()
    if (pattern === '*') {
      errors.push(`${label} CORS 禁止使用通配符 *`)
    }
    if (lower.includes('localhost') || lower.includes('127.0.0.1')) {
      errors.push(`${label} CORS 禁止包含 localhost: ${pattern}`)
    }
    if (lower.includes('example.edu.cn')) {
      errors.push(`${label} CORS 禁止使用占位域名 example.edu.cn: ${pattern}`)
    }
  })
}

function validateDeployEnv(vars, options = {}) {
  const release = Boolean(options.release)
  const errors = []
  const profile = (vars.SPRING_PROFILES_ACTIVE || '').trim().toLowerCase()

  if (release) {
    if (!GUARDED_PROFILES.has(profile)) {
      errors.push(`发布检查要求 SPRING_PROFILES_ACTIVE=staging 或 prod（当前: ${profile || '(空)'}）`)
    }
  } else if (UNSAFE_PROFILES.has(profile)) {
    errors.push(`SPRING_PROFILES_ACTIVE 仍为 ${profile || '(空)'}，staging/prod 部署前必须修改`)
  }

  const dbPassword = vars.DB_PASSWORD || ''
  const redisPassword = vars.REDIS_PASSWORD || ''
  if (release || GUARDED_PROFILES.has(profile)) {
    if (DEV_PASSWORDS.has(dbPassword)) {
      errors.push('DB_PASSWORD 不得为空或 dev123456')
    }
    if (DEV_PASSWORDS.has(redisPassword)) {
      errors.push('REDIS_PASSWORD 不得为空或 dev123456')
    }
    const jwtSecret = (vars.JWT_SECRET || '').trim()
    if (!jwtSecret || jwtSecret.length < 32) {
      errors.push('JWT_SECRET 必填且长度至少 32 字符')
    } else if (DEV_JWT_SECRETS.has(jwtSecret)) {
      errors.push('JWT_SECRET 禁止使用开发默认值')
    }
  }

  const corsPatterns = splitCorsPatterns(vars.SHUYUAN_CORS_ALLOWED_ORIGIN_PATTERNS)
  if (corsPatterns.length > 0) {
    validateCorsPatterns(corsPatterns, errors, '环境变量')
  }

  return errors
}

function validateRepoStagingYaml(content) {
  const errors = []
  if (!content) {
    errors.push('缺少 application-staging.yml')
    return errors
  }
  const corsBlock = content.match(/allowed-origin-patterns:\s*([\s\S]*?)(?:\n\S|\n*$)/)
  if (!corsBlock) return errors

  const lines = corsBlock[1].split(/\r?\n/)
  const patterns = lines
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim())

  validateCorsPatterns(patterns, errors, 'application-staging.yml')
  return errors
}

module.exports = {
  DEV_JWT_SECRETS,
  parseEnvFile,
  validateDeployEnv,
  validateRepoStagingYaml,
  splitCorsPatterns
}
