#!/usr/bin/env node
const assert = require('assert')
const {
  parseEnvFile,
  validateDeployEnv,
  validateRepoStagingYaml
} = require('./lib/deploy-env-rules')

function run() {
  const parsed = parseEnvFile(`
# comment
SPRING_PROFILES_ACTIVE=prod
DB_PASSWORD=strong-password
REDIS_PASSWORD=redis-strong
JWT_SECRET=prod-jwt-secret-with-enough-length-for-validation
`)
  assert.deepStrictEqual(validateDeployEnv(parsed, { release: true }), [])

  const badProfile = parseEnvFile('SPRING_PROFILES_ACTIVE=dev\n')
  assert.ok(validateDeployEnv(badProfile, { release: true }).some((msg) => msg.includes('SPRING_PROFILES_ACTIVE')))

  const badJwt = parseEnvFile(`
SPRING_PROFILES_ACTIVE=staging
DB_PASSWORD=strong-password
REDIS_PASSWORD=redis-strong
JWT_SECRET=shuyuan-dev-jwt-secret
`)
  assert.ok(validateDeployEnv(badJwt, { release: true }).some((msg) => msg.includes('JWT_SECRET')))

  const badCors = parseEnvFile(`
SPRING_PROFILES_ACTIVE=prod
DB_PASSWORD=strong-password
REDIS_PASSWORD=redis-strong
JWT_SECRET=prod-jwt-secret-with-enough-length-for-validation
SHUYUAN_CORS_ALLOWED_ORIGIN_PATTERNS=https://admin.example.com,http://localhost:5173
`)
  assert.ok(validateDeployEnv(badCors, { release: true }).some((msg) => msg.includes('localhost')))

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
