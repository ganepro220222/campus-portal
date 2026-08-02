import assert from 'node:assert/strict'
import {
  pickOverrideForMaterial, applyOverrideFields, matchingOverridePattern,
} from './material-override.mjs'

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}

console.log('material-override tests')

test('精确 namePattern 优先于子串', () => {
  const ov = [
    { namePattern: 'Bod', metalness: 0.9 },
    { namePattern: 'Body', metalness: 0.3 },
  ]
  assert.equal(pickOverrideForMaterial(ov, 'Body').metalness, 0.3)
})

test('无精确匹配时取最长子串', () => {
  const ov = [
    { namePattern: 'Bo', metalness: 0.1 },
    { namePattern: 'Bod', metalness: 0.9 },
  ]
  assert.equal(pickOverrideForMaterial(ov, 'Body').metalness, 0.9)
})

test('列表顺序不影响结果', () => {
  const ov = [
    { namePattern: 'Body', metalness: 0.3 },
    { namePattern: 'Bod', metalness: 0.9 },
  ]
  assert.equal(pickOverrideForMaterial(ov, 'Body').metalness, 0.3)
})

test('BodyGold 不会被 Body 的子串规则误伤（精确优先）', () => {
  const ov = [
    { namePattern: 'Body', metalness: 0.2 },
    { namePattern: 'BodyGold', metalness: 0.8 },
  ]
  assert.equal(pickOverrideForMaterial(ov, 'BodyGold').metalness, 0.8)
  assert.equal(pickOverrideForMaterial(ov, 'Body').metalness, 0.2)
})

test('applyOverrideFields 只写有值的字段', () => {
  const m = { roughness: 0.5, metalness: 0, envMapIntensity: 1 }
  applyOverrideFields(m, { metalness: 0.77 })
  assert.equal(m.metalness, 0.77)
  assert.equal(m.roughness, 0.5)
})

test('matchingOverridePattern 返回实际生效的非自身条目', () => {
  const ov = [{ namePattern: 'Bod', metalness: 0.9 }]
  assert.equal(matchingOverridePattern('Body', ov), 'Bod')
  assert.equal(matchingOverridePattern('Body', [{ namePattern: 'Body', metalness: 0.3 }]), '')
})

console.log('')
if (fail) {
  console.error(`material-override: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`material-override: ${pass} passed`)
