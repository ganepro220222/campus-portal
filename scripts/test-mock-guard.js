#!/usr/bin/env node
/**
 * mockGuard 单元测试：验证 staging/prod 不回退 mock
 */
const assert = require('assert')
const path = require('path')

function loadMockGuard(useMock) {
  const envPath = require.resolve('../miniapp/config/env')
  const guardPath = require.resolve('../miniapp/utils/mockGuard')
  delete require.cache[envPath]
  delete require.cache[guardPath]
  require.cache[envPath] = {
    id: envPath,
    filename: envPath,
    loaded: true,
    exports: { ENV: useMock ? 'dev' : 'prod', baseUrl: 'http://test', useMock }
  }
  return require('../miniapp/utils/mockGuard')
}

function run() {
  const dev = loadMockGuard(true)
  assert.deepStrictEqual(dev.withListFallback([], [{ id: 1 }]), [{ id: 1 }])
  assert.deepStrictEqual(dev.withListFallback([{ id: 2 }], [{ id: 1 }]), [{ id: 2 }])
  assert.deepStrictEqual(dev.withObjectFallback(null, { title: 'x' }), { title: 'x' })
  assert.strictEqual(dev.mockOrEmpty('m', 'e'), 'm')

  const prod = loadMockGuard(false)
  assert.deepStrictEqual(prod.withListFallback([], [{ id: 1 }]), [])
  assert.deepStrictEqual(prod.withListFallback(null, [{ id: 1 }]), [])
  assert.deepStrictEqual(prod.withObjectFallback(null, { title: 'x' }), {})
  assert.strictEqual(prod.mockOrEmpty('m', 'e'), 'e')

  console.log('[test-mock-guard] 通过')
}

run()
