import assert from 'node:assert/strict'
import { memberDeleteGuidance } from './memberDeleteGuidance.ts'

function test(name: string, fn: () => void) {
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
    references: [{ label: '报名记录', count: 3 }]
  })
  assert.equal(g?.risk, 'BLOCKED')
  assert.match(g!.referenceHint, /请改用「清退」/)
  assert.match(g!.blockedDescription, /再回来删除/)
})

test('已清退且有历史记录时为终态文案', () => {
  const g = memberDeleteGuidance({
    canDelete: false,
    canAnonymize: false,
    references: [{ label: '报名记录', count: 3 }]
  })
  assert.equal(g?.risk, 'BLOCKED')
  assert.equal(g!.blockedTitle, '账号已完成清退')
  assert.doesNotMatch(g!.referenceHint, /请改用「清退」/)
  assert.doesNotMatch(g!.blockedDescription, /再回来删除/)
  assert.match(g!.referenceHint, /无需继续操作/)
})

console.log('memberDeleteGuidance.test.ts OK')
