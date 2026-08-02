import assert from 'node:assert/strict'
import { panoValueFor, panoOptgroupLabel, panoOptionLabel } from './studio-pano-labels.mjs'

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}

console.log('studio-pano-labels tests')

test('panoValueFor 加 ../ 前缀', () => {
  assert.equal(panoValueFor('共享背景/museum.jpg'), '../共享背景/museum.jpg')
})

test('panoOptgroupLabel 区分 configured 与 shared', () => {
  assert.equal(panoOptgroupLabel('configured'), '正在使用的全景')
  assert.equal(panoOptgroupLabel('shared'), '公共背景')
})

test('panoOptionLabel 带来源标签与尺寸', () => {
  assert.equal(
    panoOptionLabel({ source: 'configured', path: 'craft-001/assets/pano.jpg', width: 2048, height: 1024 }),
    '已配置 · craft-001/assets/pano.jpg（2048×1024）',
  )
  assert.equal(
    panoOptionLabel({ source: 'shared', path: '共享背景/dawn.jpg', width: 4096, height: 2048 }),
    '公共背景 · 共享背景/dawn.jpg（4096×2048）',
  )
})

console.log('')
if (fail) {
  console.error(`studio-pano-labels: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`studio-pano-labels: ${pass} passed`)
