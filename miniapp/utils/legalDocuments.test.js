/**
 * 协议文档兜底逻辑单测
 * 运行：node miniapp/utils/legalDocuments.test.js
 */
const assert = require('assert')
const {
  BASELINE,
  resolveFromSources,
  sourceHint,
  pickRemoteField
} = require('./legalDocuments')

assert.strictEqual(pickRemoteField({ privacy: '  ' }, 'privacy'), '')
assert.strictEqual(pickRemoteField({ privacy: '<p>远程</p>' }, 'privacy'), '<p>远程</p>')

const remoteOnly = resolveFromSources(
  { privacy: '<p>P</p>', agreement: '<p>A</p>', version: 'v2' },
  null
)
assert.strictEqual(remoteOnly.source, 'remote')
assert.strictEqual(remoteOnly.privacy, '<p>P</p>')

const cacheFallback = resolveFromSources(null, { privacy: '<p>C</p>', agreement: '<p>CA</p>' })
assert.strictEqual(cacheFallback.source, 'cache')
assert.strictEqual(cacheFallback.privacy, '<p>C</p>')

const baselineFallback = resolveFromSources(null, null)
assert.strictEqual(baselineFallback.source, 'baseline')
assert.strictEqual(baselineFallback.privacy, BASELINE.privacy)
assert.strictEqual(sourceHint(baselineFallback), '')
assert.ok(BASELINE.privacy.includes('贵州云漫科技有限公司'))
assert.ok(BASELINE.agreement.includes('贵州云漫科技有限公司'))
assert.ok(!BASELINE.privacy.includes('内置基线'))
assert.ok(!BASELINE.agreement.includes('内置基线'))

console.log('[legalDocuments.test] PASS')
