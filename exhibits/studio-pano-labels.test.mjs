import assert from 'node:assert/strict'
import { panoValueFor, panoOptionLabel, panoOptionTitle, PANO_MANUAL } from './studio-pano-labels.mjs'

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}

console.log('studio-pano-labels tests')

test('panoValueFor 加 ../ 前缀', () => {
  assert.equal(panoValueFor('共享背景/museum.jpg'), '../共享背景/museum.jpg')
})

test('panoOptionLabel 带来源标签，中间层级用省略号收短', () => {
  assert.equal(
    panoOptionLabel({ source: 'configured', path: 'craft-001/assets/pano.jpg', width: 2048, height: 1024 }),
    '已配置 · craft-001/…/pano.jpg',
  )
  // 两段路径本来就短，省了反而看不出是哪张
  assert.equal(
    panoOptionLabel({ source: 'shared', path: '共享背景/dawn.jpg', width: 4096, height: 2048 }),
    '公共背景 · 共享背景/dawn.jpg',
  )
  // 再深的层级也只留首段和文件名
  assert.equal(
    panoOptionLabel({ source: 'shared', path: 'bg/2024/夏/museum.jpg', width: 4096, height: 2048 }),
    '公共背景 · bg/…/museum.jpg',
  )
})

test('panoOptionTitle 给出完整路径与尺寸，一个字不省', () => {
  assert.equal(
    panoOptionTitle({ source: 'configured', path: 'craft-001/assets/pano.jpg', width: 2048, height: 1024 }),
    '已配置 · craft-001/assets/pano.jpg（2048×1024）',
  )
  assert.equal(
    panoOptionTitle({ source: 'shared', path: 'bg/2024/夏/museum.jpg', width: 4096, height: 2048 }),
    '公共背景 · bg/2024/夏/museum.jpg（4096×2048）',
  )
})

test('显示文案一定比气泡短（否则收短就白做了）', () => {
  const c = { source: 'configured', path: 'craft-001/assets/panorama.jpg', width: 2048, height: 1024 }
  assert.ok(panoOptionLabel(c).length < panoOptionTitle(c).length)
})

test('PANO_MANUAL 不带括号——控件列只有 107px，六个字加下拉箭头会贴边', () => {
  assert.equal(PANO_MANUAL, '手动输入')
})

console.log('')
if (fail) {
  console.error(`studio-pano-labels: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`studio-pano-labels: ${pass} passed`)
