#!/usr/bin/env node
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  parseEnvFile,
  validateDeployEnv,
  validateRepoStagingYaml,
  extractJdbcHost
} = require('./lib/deploy-env-rules')

const STRONG_ENV = `
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:mysql://db.prod.internal:3306/shuyuan?useUnicode=true&characterEncoding=UTF-8
DB_USERNAME=shuyuan_app
DB_PASSWORD=strong-db-password
REDIS_HOST=redis.prod.internal
REDIS_PASSWORD=strong-redis-password
JWT_SECRET=prod-jwt-secret-with-enough-length-for-validation
WX_APPID=wxrealappid123456
WX_SECRET=wxrealsecret1234567890abcdef
`

function run() {
  assert.deepStrictEqual(validateDeployEnv(parseEnvFile(STRONG_ENV), { release: true }), [])

  const envExampleProd = parseEnvFile(fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8'))
  envExampleProd.SPRING_PROFILES_ACTIVE = 'prod'
  const exampleErrors = validateDeployEnv(envExampleProd, { release: true })
  assert.ok(exampleErrors.length > 0, 'prod + .env.example placeholders must fail')
  assert.ok(exampleErrors.some((msg) => msg.includes('JWT_SECRET')))
  assert.ok(exampleErrors.some((msg) => msg.includes('WX_APPID') || msg.includes('WX_SECRET')))
  assert.ok(exampleErrors.some((msg) => msg.includes('DB_PASSWORD') || msg.includes('REDIS_PASSWORD')))

  const badProfile = parseEnvFile('SPRING_PROFILES_ACTIVE=dev\n')
  assert.ok(validateDeployEnv(badProfile, { release: true }).some((msg) => msg.includes('SPRING_PROFILES_ACTIVE')))

  const badJwt = parseEnvFile(`
SPRING_PROFILES_ACTIVE=staging
DB_URL=jdbc:mysql://db.staging.internal:3306/shuyuan
DB_USERNAME=shuyuan_app
DB_PASSWORD=strong-db-password
REDIS_HOST=redis.staging.internal
REDIS_PASSWORD=strong-redis-password
JWT_SECRET=shuyuan-dev-jwt-secret
`)
  assert.ok(validateDeployEnv(badJwt, { release: true }).some((msg) => msg.includes('JWT_SECRET')))

  const placeholderJwt = parseEnvFile(`
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:mysql://db.prod.internal:3306/shuyuan
DB_USERNAME=shuyuan_app
DB_PASSWORD=strong-db-password
REDIS_HOST=redis.prod.internal
REDIS_PASSWORD=strong-redis-password
JWT_SECRET=your-jwt-secret-at-least-32-chars
WX_APPID=wxrealappid123456
WX_SECRET=wxrealsecret1234567890abcdef
`)
  assert.ok(validateDeployEnv(placeholderJwt, { release: true }).some((msg) => msg.includes('占位')))

  const badCors = parseEnvFile(`
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:mysql://db.prod.internal:3306/shuyuan
DB_USERNAME=shuyuan_app
DB_PASSWORD=strong-db-password
REDIS_HOST=redis.prod.internal
REDIS_PASSWORD=strong-redis-password
JWT_SECRET=prod-jwt-secret-with-enough-length-for-validation
WX_APPID=wxrealappid123456
WX_SECRET=wxrealsecret1234567890abcdef
SHUYUAN_CORS_ALLOWED_ORIGIN_PATTERNS=https://admin.example.com,http://localhost:5173
`)
  assert.ok(validateDeployEnv(badCors, { release: true }).some((msg) => msg.includes('localhost')))

  const localDbRelease = parseEnvFile(`
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:mysql://localhost:3306/shuyuan?redirect=remote
DB_USERNAME=shuyuan_app
DB_PASSWORD=strong-db-password
REDIS_HOST=redis.prod.internal
REDIS_PASSWORD=strong-redis-password
JWT_SECRET=prod-jwt-secret-with-enough-length-for-validation
WX_APPID=wxrealappid123456
WX_SECRET=wxrealsecret1234567890abcdef
`)
  assert.ok(validateDeployEnv(localDbRelease, { release: true }).some((msg) => msg.includes('DB_URL')))

  assert.strictEqual(
    extractJdbcHost('jdbc:mysql://rds.aliyuncs.com:3306/shuyuan?foo=localhost'),
    'rds.aliyuncs.com'
  )
  assert.strictEqual(extractJdbcHost('jdbc:mysql://[::1]:3306/shuyuan'), '::1')

  const goodStagingYaml = `
shuyuan:
  cors:
    allowed-origin-patterns: []
`
  assert.deepStrictEqual(validateRepoStagingYaml(goodStagingYaml), [])

  const badStagingYaml = `
shuyuan:
  cors:
    allowed-origin-patterns:
      - https://staging.example.edu.cn
      - http://localhost:5173
`
  assert.ok(validateRepoStagingYaml(badStagingYaml).length >= 2)

  console.log('[test-deploy-env] 通过')
}

run()
