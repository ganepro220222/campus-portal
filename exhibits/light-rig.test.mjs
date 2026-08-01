import assert from 'node:assert/strict'
import {
  LIGHT_KEYS,
  LIGHT_DEFAULTS,
  defaultPosition,
  defaultIntensity,
  isLightOn,
  effectiveIntensity,
  positionToAngles,
  anglesToPosition,
  withAngle,
  defaultLights,
  diagnoseBrightness,
} from './light-rig.mjs'

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}
const near = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`)
const nearPos = (a, b, tol = 0.02) => a.forEach((v, i) => near(v, b[i], tol))

console.log('light-rig tests')

/* ── 角度换算 ── */

test('+Z 为方位角 0°，水平为仰角 0°', () => {
  const a = positionToAngles([0, 0, 5])
  assert.equal(a.azimuth, 0)
  assert.equal(a.elevation, 0)
  assert.equal(a.radius, 5)
})

test('+X 为方位角 90°', () => {
  assert.equal(positionToAngles([5, 0, 0]).azimuth, 90)
  assert.equal(positionToAngles([-5, 0, 0]).azimuth, -90)
  assert.equal(Math.abs(positionToAngles([0, 0, -5]).azimuth), 180)
})

test('正上方为仰角 90°，正下方为 -90°', () => {
  assert.equal(positionToAngles([0, 4, 0]).elevation, 90)
  assert.equal(positionToAngles([0, -4, 0]).elevation, -90)
})

test('零向量不产生 NaN', () => {
  const a = positionToAngles([0, 0, 0])
  assert.deepEqual(a, { azimuth: 0, elevation: 0, radius: 0 })
})

test('非法/缺失分量按 0 处理', () => {
  assert.deepEqual(positionToAngles(null), { azimuth: 0, elevation: 0, radius: 0 })
  assert.deepEqual(positionToAngles([]), { azimuth: 0, elevation: 0, radius: 0 })
  const a = positionToAngles(['x', 3, undefined])
  assert.equal(a.elevation, 90)
})

test('anglesToPosition 与 positionToAngles 互为逆运算', () => {
  for (const [x, y, z] of [[5, 8, 6], [-5, 2, -3], [-2, 3, -7], [1, -4, 2], [0, 0, 9], [-8, -8, -8]]) {
    const a = positionToAngles([x, y, z])
    nearPos(anglesToPosition(a.azimuth, a.elevation, a.radius), [x, y, z])
  }
})

test('出厂三盏灯的仰角都在上方（合伙人反馈的现象可复现）', () => {
  for (const k of LIGHT_KEYS) {
    assert.ok(positionToAngles(LIGHT_DEFAULTS[k].position).elevation > 0, k)
  }
})

test('radius 为 0 或非法时取安全半径 10 且方向正确', () => {
  nearPos(anglesToPosition(0, 0, 0), [0, 0, 10])
  nearPos(anglesToPosition(90, 0, NaN), [10, 0, 0])
  nearPos(anglesToPosition(0, 90, undefined), [0, 10, 0])
})

test('仰角超范围被夹取到 ±90°', () => {
  nearPos(anglesToPosition(0, 200, 5), [0, 5, 0])
  nearPos(anglesToPosition(0, -200, 5), [0, -5, 0])
})

test('方位角绕圈等价（±360° 不改变方向）', () => {
  nearPos(anglesToPosition(370, 20, 6), anglesToPosition(10, 20, 6))
  nearPos(anglesToPosition(-190, 20, 6), anglesToPosition(170, 20, 6))
})

/* ── withAngle：只动一个角度 ── */

test('withAngle 改仰角时保持方位角与半径', () => {
  const conf = { position: [5, 8, 6] }
  const before = positionToAngles(conf.position)
  const after = positionToAngles(withAngle(conf, 'key', 'el', -30))
  near(after.elevation, -30, 0.05)
  near(after.azimuth, before.azimuth, 0.05)
  near(after.radius, before.radius, 0.02)
})

test('withAngle 改方位角时保持仰角与半径', () => {
  const conf = { position: [-5, 2, -3] }
  const before = positionToAngles(conf.position)
  const after = positionToAngles(withAngle(conf, 'fill', 'az', 120))
  near(after.azimuth, 120, 0.05)
  near(after.elevation, before.elevation, 0.05)
  near(after.radius, before.radius, 0.02)
})

test('withAngle 在 position 缺失时回落到该灯的出厂方向', () => {
  const after = positionToAngles(withAngle({}, 'rim', 'az', 0))
  near(after.elevation, positionToAngles(LIGHT_DEFAULTS.rim.position).elevation, 0.05)
})

test('反复微调不会累积漂移', () => {
  let conf = { position: [5, 8, 6] }
  const r0 = positionToAngles(conf.position).radius
  for (let i = 0; i < 200; i++) {
    conf = { position: withAngle(conf, 'key', 'az', ((i * 7) % 360) - 180) }
    conf = { position: withAngle(conf, 'key', 'el', ((i * 3) % 180) - 90) }
  }
  near(positionToAngles(conf.position).radius, r0, 0.05)
})

/* ── 启用 / 强度 ── */

test('缺省视为启用，旧配置行为不变', () => {
  assert.equal(isLightOn(undefined), true)
  assert.equal(isLightOn({}), true)
  assert.equal(isLightOn({ enabled: true }), true)
  assert.equal(isLightOn({ enabled: false }), false)
})

test('关闭的灯实际强度为 0，但配置里的强度值保留', () => {
  const conf = { intensity: 1.4, enabled: false }
  assert.equal(effectiveIntensity('key', conf), 0)
  assert.equal(conf.intensity, 1.4)
  conf.enabled = true
  assert.equal(effectiveIntensity('key', conf), 1.4)
})

test('强度缺失时按该灯出厂值', () => {
  assert.equal(effectiveIntensity('key', {}), defaultIntensity('key'))
  assert.equal(effectiveIntensity('fill', {}), LIGHT_DEFAULTS.fill.intensity)
  assert.equal(effectiveIntensity('rim', { intensity: 'x' }), LIGHT_DEFAULTS.rim.intensity)
})

test('defaultPosition / defaultLights 返回副本，改不坏常量', () => {
  const p = defaultPosition('key')
  p[0] = 999
  assert.equal(LIGHT_DEFAULTS.key.position[0], 5)
  const d = defaultLights()
  d.key.intensity = 999
  assert.equal(LIGHT_DEFAULTS.key.intensity, 1.1)
  assert.deepEqual(Object.keys(d).sort(), ['ambient', 'fill', 'key', 'rim'])
})

test('未知灯名不抛异常', () => {
  assert.ok(Array.isArray(defaultPosition('nope')))
  assert.equal(typeof defaultIntensity('nope'), 'number')
})

/* ── 亮度诊断 ── */

const texts = (list) => list.map((x) => x.text).join('\n')

test('高金属度 + 低环境 → 首条就是金属度警告', () => {
  const r = diagnoseBrightness({ metalness: 1, envMapIntensity: 1, envIntensity: 1, hasPanorama: true })
  assert.equal(r[0].level, 'warn')
  assert.match(r[0].text, /金属度/)
})

test('环境照明按 场景级 × 材质级 相乘判定', () => {
  const dark = { metalness: 1, envMapIntensity: 1.4, envIntensity: 0.5, hasPanorama: true }
  assert.ok(diagnoseBrightness(dark).some(x => x.level === 'warn' && /金属度/.test(x.text)))
  // 同样的材质级强度，把场景级提上去后金属度警告消失
  const bright = { ...dark, envIntensity: 1.4 }
  assert.ok(!diagnoseBrightness(bright).some(x => /金属度/.test(x.text)))
})

test('环境照明偏低时同时点名两个来源', () => {
  const t = texts(diagnoseBrightness({ envMapIntensity: 1, envIntensity: 1, hasPanorama: true, exposure: 1.4 }))
  assert.match(t, /环境 IBL → 环境光照/)
  assert.match(t, /材质 → 环境光强/)
})

test('环境光拉过头 → 明确劝阻', () => {
  const r = diagnoseBrightness({ ambient: 1.8, hasPanorama: true, exposure: 1.4, envMapIntensity: 1.8 })
  assert.ok(r.some((x) => x.level === 'warn' && /环境光/.test(x.text)))
})

test('低曝光 / 低环境光强 会被点名', () => {
  const r = texts(diagnoseBrightness({ exposure: 1.0, envMapIntensity: 1.0, hasPanorama: true }))
  assert.match(r, /曝光/)
  assert.match(r, /环境光强/)
})

test('无全景图时提示换环境贴图', () => {
  assert.match(texts(diagnoseBrightness({ hasPanorama: false })), /全景图/)
})

test('参数都正常时给出「正常」结论且只有一条', () => {
  const r = diagnoseBrightness({
    exposure: 1.4, envMapIntensity: 1.8, ambient: 0.25, key: 1.2,
    metalness: 0, roughness: 0.5, hasPanorama: true,
  })
  assert.equal(r.length, 1)
  assert.equal(r[0].level, 'ok')
})

test('空入参不抛异常且必有结论', () => {
  const r = diagnoseBrightness()
  assert.ok(r.length >= 1)
  r.forEach((x) => {
    assert.ok(['warn', 'tip', 'ok'].includes(x.level))
    assert.ok(x.text && typeof x.text === 'string')
  })
})

test('warn 永远排在 tip 之前', () => {
  const r = diagnoseBrightness({ metalness: 1, ambient: 1.5, exposure: 0.8, envMapIntensity: 0.5, key: 0.2, roughness: 0.95 })
  const firstTip = r.findIndex((x) => x.level === 'tip')
  const lastWarn = r.map((x) => x.level).lastIndexOf('warn')
  assert.ok(lastWarn < firstTip, '警告应排在建议之前')
})

console.log(`\nlight-rig: ${pass} passed${fail ? `, ${fail} FAILED` : ''}`)
process.exit(fail ? 1 : 0)
