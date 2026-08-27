#!/usr/bin/env node
/** memberDeleteGuidance 纯函数测试（Node 20 CI 兼容，不依赖 --experimental-strip-types） */
const assert = require('node:assert/strict')
const path = require('node:path')
const { execSync } = require('node:child_process')
const { memberDeleteGuidance } = require('./lib/memberDeleteGuidance')

function test(name, fn) {
  try {
    fn()
    console.log(`  ok  ${name}`)
  } catch (e) {
    console.error(`  FAIL ${name}`)
    throw e
  }
}

test('impact 未加载时不输出误导文案', () => {
  assert.equal(memberDeleteGuidance(null), null)
  assert.equal(memberDeleteGuidance(undefined), null)
})

test('无历史记录时可彻底删除', () => {
  const g = memberDeleteGuidance({ canDelete: true, canAnonymize: true, references: [] })
  assert.equal(g?.risk, 'LOW')
})

test('未清退且有历史记录时引导清退', () => {
  const g = memberDeleteGuidance({
    canDelete: false,
    canAnonymize: true,
    references: [{ label: '报名记录', count: 3 }],
  })
  assert.equal(g?.risk, 'BLOCKED')
  assert.match(g.referenceHint, /请改用「清退」/)
  assert.match(g.blockedDescription, /再回来删除/)
})

test('已清退且有历史记录时为终态文案', () => {
  const g = memberDeleteGuidance({
    canDelete: false,
    canAnonymize: false,
    references: [{ label: '报名记录', count: 3 }],
  })
  assert.equal(g?.risk, 'BLOCKED')
  assert.equal(g.blockedTitle, '账号已完成清退')
  assert.doesNotMatch(g.referenceHint, /请改用「清退」/)
  assert.doesNotMatch(g.blockedDescription, /再回来删除/)
  assert.match(g.referenceHint, /无需继续操作/)
})

const root = path.resolve(__dirname, '..')
execSync(`node "${path.join(__dirname, 'check-member-delete-guidance.js')}"`, { stdio: 'inherit', cwd: root })
console.log('test-member-delete-guidance: PASS')
