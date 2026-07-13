/**
 * 部署环境变量校验（纯逻辑，供 CLI 与单测复用）
 */

const DEV_JWT_SECRETS = new Set([
  'shuyuan-dev-jwt-secret-change-in-prod',
  'shuyuan-dev-jwt-secret'
])

const PLACEHOLDER_VALUES = new Set([
  'your-jwt-secret-at-least-32-chars',
  'your-db-password',
  'your-redis-password',
  'your-wx-appid',
  'your-wx-secret',
  'your-oss-access-key',
  'your-oss-secret-key'
])

const DEV_PASSWORDS = new Set(['dev123456', ''])
const GUARDED_PROFILES = new Set(['staging', 'prod'])
const UNSAFE_PROFILES = new Set(['dev', 'docker', ''])
const LOCAL_DB_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'mysql'])
const LOCAL_REDIS_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'redis'])

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

function isPlaceholderValue(value) {
  if (!value || !value.trim()) return false
  return PLACEHOLDER_VALUES.has(value.trim())
}

function extractJdbcHost(dbUrl) {
  if (!dbUrl || !dbUrl.trim()) return ''
  const match = dbUrl.trim().match(/^jdbc:[^:]+:\/\/(?:\[([^\]]+)\]|([^/:?]+))/)
  if (!match) return ''
  return (match[1] || match[2] || '').trim().toLowerCase()
}

function isLocalDbHost(host) {
  return LOCAL_DB_HOSTS.has((host || '').trim().toLowerCase())
}

function isLocalRedisHost(host) {
  return LOCAL_REDIS_HOSTS.has((host || '').trim().toLowerCase())
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
  const guarded = release || GUARDED_PROFILES.has(profile)

  if (release) {
    if (!GUARDED_PROFILES.has(profile)) {
      errors.push(`发布检查要求 SPRING_PROFILES_ACTIVE=staging 或 prod（当前: ${profile || '(空)'}）`)
    }
  } else if (UNSAFE_PROFILES.has(profile)) {
    errors.push(`SPRING_PROFILES_ACTIVE 仍为 ${profile || '(空)'}，staging/prod 部署前必须修改`)
  }

  if (guarded) {
    const dbPassword = (vars.DB_PASSWORD || '').trim()
    const redisPassword = (vars.REDIS_PASSWORD || '').trim()
    if (DEV_PASSWORDS.has(dbPassword)) {
      errors.push('DB_PASSWORD 不得为空或 dev123456')
    } else if (isPlaceholderValue(dbPassword)) {
      errors.push('DB_PASSWORD 不得使用 .env.example 占位值')
    }
    if (DEV_PASSWORDS.has(redisPassword)) {
      errors.push('REDIS_PASSWORD 不得为空或 dev123456')
    } else if (isPlaceholderValue(redisPassword)) {
      errors.push('REDIS_PASSWORD 不得使用 .env.example 占位值')
    }

    const jwtSecret = (vars.JWT_SECRET || '').trim()
    if (!jwtSecret || jwtSecret.length < 32) {
      errors.push('JWT_SECRET 必填且长度至少 32 字符')
    } else if (DEV_JWT_SECRETS.has(jwtSecret)) {
      errors.push('JWT_SECRET 禁止使用开发默认值')
    } else if (isPlaceholderValue(jwtSecret)) {
      errors.push('JWT_SECRET 不得使用 .env.example 占位值')
    }

    const dbHost = extractJdbcHost(vars.DB_URL || '')
    if (!dbHost) {
      errors.push('DB_URL 必填且须为有效 JDBC 连接串')
    } else if (!isLocalDbHost(dbHost)) {
      // ok
    } else if (release) {
      errors.push(`DB_URL 主机不得为本地/compose 占位地址（当前: ${dbHost}）`)
    }

    const redisHost = (vars.REDIS_HOST || '').trim().toLowerCase()
    if (!redisHost) {
      errors.push('REDIS_HOST 必填')
    } else if (isLocalRedisHost(redisHost) && release) {
      errors.push(`REDIS_HOST 不得为本地/compose 占位地址（当前: ${redisHost}）`)
    }

    const dbUsername = (vars.DB_USERNAME || '').trim().toLowerCase()
    if (profile === 'prod' && dbUsername === 'root') {
      errors.push('prod 环境 DB_USERNAME 不应使用 root，请改为专用应用账号')
    }

    if (profile === 'prod') {
      const wxAppId = (vars.WX_APPID || '').trim()
      const wxSecret = (vars.WX_SECRET || '').trim()
      if (!wxAppId) {
        errors.push('prod 环境 WX_APPID 必填')
      } else if (isPlaceholderValue(wxAppId)) {
        errors.push('WX_APPID 不得使用 .env.example 占位值')
      }
      if (!wxSecret) {
        errors.push('prod 环境 WX_SECRET 必填')
      } else if (isPlaceholderValue(wxSecret)) {
        errors.push('WX_SECRET 不得使用 .env.example 占位值')
      }
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
  PLACEHOLDER_VALUES,
  parseEnvFile,
  validateDeployEnv,
  validateRepoStagingYaml,
  splitCorsPatterns,
  extractJdbcHost,
  isPlaceholderValue
}
