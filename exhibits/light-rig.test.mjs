import assert from 'node:assert/strict'
import {
  LIGHT_KEYS,
  LIGHT_DEFAULTS,
  LIGHT_OPTIONAL,
  LIGHT_LABELS,
  SHADOW_CASTER,
  ENV_PRESETS,
  ENV_PRESET_KEYS,
  defaultPosition,
  defaultIntensity,
  isLightOn,
  effectiveIntensity,
  positionToAngles,
  anglesToPosition,
  withAngle,
  defaultLights,
  diagnoseBrightness,
  brightnessInputs,
  resolveShadow,
  shadowWillLand,
  resolveEnvSource,
  createEnvLoadGuard,
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

test('出厂三盏主要灯的仰角都在上方（合伙人反馈的现象可复现）', () => {
  for (const k of ['key', 'fill', 'rim']) {
    assert.ok(positionToAngles(LIGHT_DEFAULTS[k].position).elevation > 0, k)
  }
})

test('地面反射光的仰角在下方，才谈得上「反射」', () => {
  assert.ok(positionToAngles(LIGHT_DEFAULTS.bounce.position).elevation < -30)
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
  assert.equal(isLightOn(undefined, 'key'), true)
  assert.equal(isLightOn({}, 'key'), true)
  assert.equal(isLightOn({ enabled: true }, 'key'), true)
  assert.equal(isLightOn({ enabled: false }, 'key'), false)
})

test('新增的地面反射光：旧配置里没有就不亮，写了 enabled 才听配置', () => {
  assert.ok(LIGHT_OPTIONAL.has('bounce'))
  assert.equal(isLightOn(undefined, 'bounce'), false)
  assert.equal(isLightOn({}, 'bounce'), false)
  assert.equal(effectiveIntensity('bounce', undefined), 0)
  assert.equal(effectiveIntensity('bounce', { intensity: 0.8 }), 0)
  assert.equal(effectiveIntensity('bounce', { intensity: 0.8, enabled: true }), 0.8)
  assert.equal(effectiveIntensity('bounce', { enabled: true }), LIGHT_DEFAULTS.bounce.intensity)
})

test('每盏灯都有中文名，投影只由主光产生', () => {
  for (const k of ['ambient', ...LIGHT_KEYS]) assert.ok(LIGHT_LABELS[k], k)
  assert.equal(SHADOW_CASTER, 'key')
  assert.ok(LIGHT_KEYS.includes(SHADOW_CASTER))
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
  assert.deepEqual(Object.keys(d).sort(), ['ambient', 'bounce', 'fill', 'key', 'rim'])
  // 恢复出厂后地面反射光应回到「不亮」
  assert.equal(effectiveIntensity('bounce', d.bounce), 0)
})

/* ── 阴影 ── */

test('阴影默认关闭，旧展品观感零变化', () => {
  assert.equal(resolveShadow({}).enabled, false)
  assert.equal(resolveShadow({ shadow: {} }).enabled, false)
  assert.equal(resolveShadow({ shadow: { enabled: 'yes' } }).enabled, false)
  assert.equal(resolveShadow({ shadow: { enabled: true } }).enabled, true)
})

test('阴影参数被夹取到安全范围', () => {
  const s = resolveShadow({ shadow: { enabled: true, opacity: 9, softness: -4, groundOffset: 88 } })
  assert.equal(s.opacity, 1)
  assert.equal(s.softness, 0)
  assert.equal(s.groundOffset, 1)
  const t = resolveShadow({ shadow: { enabled: true, opacity: 'x', softness: null } })
  assert.equal(t.opacity, 0.32)
  assert.equal(t.softness, 3)
})

test('展台随阴影一起默认开启（深色背景下没有承影面 = 白开）', () => {
  assert.equal(resolveShadow({ shadow: { enabled: true } }).plate, true)
  assert.equal(resolveShadow({ shadow: { enabled: true, plate: false } }).plate, false)
  assert.equal(resolveShadow({ shadow: { enabled: true, plate: 0 } }).plate, true)   // 只有显式 false 才关
})

test('展台颜色必须是 6 位色值，非法值回落到出厂色', () => {
  assert.equal(resolveShadow({ shadow: { plateColor: '#123abc' } }).plateColor, '#123abc')
  for (const bad of ['red', '#fff', 'javascript:x', 42, null, '#12345g']) {
    assert.equal(resolveShadow({ shadow: { plateColor: bad } }).plateColor, '#2b2f3a')
  }
})

test('主光在水平以下 / 被关掉 / 强度为 0 时，地面接不到影子', () => {
  const on = { shadow: { enabled: true }, lights: { key: { position: [5, 8, 6], intensity: 1.1 } } }
  assert.equal(shadowWillLand(on), true)
  assert.equal(shadowWillLand({ ...on, shadow: { enabled: false } }), false)
  assert.equal(shadowWillLand({ ...on, lights: { key: { position: [5, 8, 6], enabled: false } } }), false)
  assert.equal(shadowWillLand({ ...on, lights: { key: { position: [5, 8, 6], intensity: 0 } } }), false)
  assert.equal(shadowWillLand({ ...on, lights: { key: { position: [5, -8, 6] } } }), false)
  assert.equal(shadowWillLand({ ...on, lights: { key: { position: [5, 0.05, 6] } } }), false)  // 几乎水平
  assert.equal(shadowWillLand({ shadow: { enabled: true } }), true)                            // 缺 lights 用出厂方向
})

/* ── 环境预设 ── */

test('全景优先于预设，预设优先于内置房间', () => {
  assert.deepEqual(resolveEnvSource({}), { kind: 'room' })
  assert.deepEqual(resolveEnvSource({ environment: { preset: 'studio' } }), { kind: 'preset', preset: 'studio' })
  assert.deepEqual(
    resolveEnvSource({ environment: { mode: 'panorama', preset: 'studio' }, assets: { panorama: 'a.jpg' } }),
    { kind: 'panorama', url: 'a.jpg' },
  )
})

test('声明了 panorama 模式却没有全景文件 → 回落到预设/房间，不留空环境', () => {
  assert.deepEqual(resolveEnvSource({ environment: { mode: 'panorama' } }), { kind: 'room' })
  assert.deepEqual(
    resolveEnvSource({ environment: { mode: 'panorama', preset: 'gallery' } }),
    { kind: 'preset', preset: 'gallery' },
  )
})

test('未知预设名回落到内置房间，不抛异常', () => {
  assert.deepEqual(resolveEnvSource({ environment: { preset: 'nope' } }), { kind: 'room' })
  assert.deepEqual(resolveEnvSource({ environment: { preset: null } }), { kind: 'room' })
})

test('每个环境预设都可渲染：有中文名，非内置的有天地色与柔光区', () => {
  assert.ok(ENV_PRESET_KEYS.includes('room'))
  for (const k of ENV_PRESET_KEYS) {
    const p = ENV_PRESETS[k]
    assert.ok(p.label, k)
    if (p.builtin) continue
    for (const c of [p.sky, p.ground, p.horizon]) assert.match(c, /^#[0-9a-f]{6}$/i, `${k} 颜色`)
    assert.ok(p.spots.length >= 1, k)
    p.spots.forEach(s => {
      assert.ok(s.u >= 0 && s.u <= 1 && s.v >= 0 && s.v <= 1, `${k} 柔光区位置`)
      assert.ok(s.r > 0 && s.i > 0, `${k} 柔光区尺寸/强度`)
      assert.match(s.c, /^#[0-9a-f]{6}$/i, `${k} 柔光区颜色`)
    })
  }
})

test('未知灯名不抛异常', () => {
  assert.ok(Array.isArray(defaultPosition('nope')))
  assert.equal(typeof defaultIntensity('nope'), 'number')
})

/* ── 亮度诊断 ── */

const texts = (list) => list.map((x) => x.text).join('\n')

test('高金属度 + 低环境 → 首条就是金属度警告', () => {
  const r = diagnoseBrightness({ metalness: 1, envMapIntensity: 1, envIntensity: 1, hasCustomEnv: true })
  assert.equal(r[0].level, 'warn')
  assert.match(r[0].text, /金属度/)
})

test('环境照明按 场景级 × 材质级 相乘判定', () => {
  const dark = { metalness: 1, envMapIntensity: 1.4, envIntensity: 0.5, hasCustomEnv: true }
  assert.ok(diagnoseBrightness(dark).some(x => x.level === 'warn' && /金属度/.test(x.text)))
  // 同样的材质级强度，把场景级提上去后金属度警告消失
  const bright = { ...dark, envIntensity: 1.4 }
  assert.ok(!diagnoseBrightness(bright).some(x => /金属度/.test(x.text)))
})

test('环境照明偏低时同时点名两个来源', () => {
  const t = texts(diagnoseBrightness({ envMapIntensity: 1, envIntensity: 1, hasCustomEnv: true, exposure: 1.4 }))
  assert.match(t, /环境 IBL → 环境光照/)
  assert.match(t, /材质 → 环境光强/)
})

test('环境光拉过头 → 明确劝阻', () => {
  const r = diagnoseBrightness({ ambient: 1.8, hasCustomEnv: true, exposure: 1.4, envMapIntensity: 1.8 })
  assert.ok(r.some((x) => x.level === 'warn' && /环境光/.test(x.text)))
})

test('低曝光 / 低环境光强 会被点名', () => {
  const r = texts(diagnoseBrightness({ exposure: 1.0, envMapIntensity: 1.0, hasCustomEnv: true }))
  assert.match(r, /曝光/)
  assert.match(r, /环境光强/)
})

test('用内置房间时提示换环境预设或全景图', () => {
  const t = texts(diagnoseBrightness({ hasCustomEnv: false }))
  assert.match(t, /环境预设/)
  assert.match(t, /全景图/)
})

test('参数都正常时给出「正常」结论且只有一条', () => {
  const r = diagnoseBrightness({
    exposure: 1.4, envMapIntensity: 1.8, ambient: 0.25, key: 1.2,
    metalness: 0, roughness: 0.5, hasCustomEnv: true, keyElevation: 45,
  })
  assert.equal(r.length, 1)
  assert.equal(r[0].level, 'ok')
})

test('主光接近顶光时建议开地面反射光；已开则不再啰嗦', () => {
  const base = {
    exposure: 1.4, envMapIntensity: 1.8, ambient: 0.25, key: 1.2,
    metalness: 0, roughness: 0.5, hasCustomEnv: true,
  }
  assert.match(texts(diagnoseBrightness({ ...base, keyElevation: 78 })), /地面反射光/)
  assert.ok(!/地面反射光/.test(texts(diagnoseBrightness({ ...base, keyElevation: 78, bounceOn: true }))))
  assert.ok(!/地面反射光/.test(texts(diagnoseBrightness({ ...base, keyElevation: 40 }))))
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

test('brightnessInputs：preset 环境 hasCustomEnv=true', () => {
  const cfg = { environment: { mode: 'preset', preset: 'studio', intensity: 1 }, lights: defaultLights() }
  const inputs = brightnessInputs(cfg)
  assert.equal(inputs.hasCustomEnv, true)
  const tips = diagnoseBrightness(inputs).filter((x) => x.level === 'tip').map((x) => x.text).join('\n')
  assert.ok(!/RoomEnvironment/.test(tips), 'preset 环境不应提示换 RoomEnvironment')
})

test('brightnessInputs：room 环境 hasCustomEnv=false', () => {
  const cfg = { environment: { mode: 'preset', preset: 'room', intensity: 1 }, lights: defaultLights() }
  const inputs = brightnessInputs(cfg)
  assert.equal(inputs.hasCustomEnv, false)
  const tips = diagnoseBrightness(inputs).filter((x) => x.level === 'tip').map((x) => x.text).join('\n')
  assert.match(tips, /RoomEnvironment/)
})

test('createEnvLoadGuard 使旧 token 失效', () => {
  const g = createEnvLoadGuard()
  const t1 = g.next()
  assert.equal(g.isCurrent(t1), true)
  g.invalidate()
  assert.equal(g.isCurrent(t1), false)
  const t2 = g.next()
  assert.equal(g.isCurrent(t2), true)
  assert.equal(g.isCurrent(t1), false)
})

console.log(`\nlight-rig: ${pass} passed${fail ? `, ${fail} FAILED` : ''}`)
process.exit(fail ? 1 : 0)
