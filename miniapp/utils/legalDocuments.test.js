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
const { ENABLE_AI_CHAT } = require('../config/features')

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
if (ENABLE_AI_CHAT) {
  assert.ok(baselineFallback.privacy.includes('知识问答'))
  assert.ok(baselineFallback.agreement.includes('知识问答'))
  assert.ok(!baselineFallback.privacy.includes('第三方模型'))
  assert.ok(!baselineFallback.agreement.includes('AI 生成'))
} else {
  assert.ok(!baselineFallback.privacy.includes('智能问答'))
  assert.ok(!baselineFallback.agreement.includes('智能问答'))
  assert.ok(!baselineFallback.privacy.includes('知识问答'))
  assert.ok(!baselineFallback.agreement.includes('知识问答'))
  assert.ok(!baselineFallback.privacy.includes('AI 生成'))
  assert.ok(!baselineFallback.agreement.includes('AI 生成'))
}
assert.strictEqual(sourceHint(baselineFallback), '')
assert.ok(BASELINE.privacy.includes('贵州云漫科技有限公司'))
assert.ok(BASELINE.agreement.includes('贵州云漫科技有限公司'))
assert.ok(!BASELINE.privacy.includes('内置基线'))
assert.ok(!BASELINE.agreement.includes('内置基线'))
assert.ok(!BASELINE.privacy.includes('第三方模型'))
assert.ok(!BASELINE.agreement.includes('第三方模型'))
assert.ok(!BASELINE.privacy.includes('AI 生成'))
assert.ok(!BASELINE.agreement.includes('AI 生成'))
assert.ok(!BASELINE.privacy.includes('智能问答'))
assert.ok(!BASELINE.agreement.includes('智能问答'))

console.log('[legalDocuments.test] PASS')
