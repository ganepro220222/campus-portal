import assert from 'node:assert/strict'
import {
  resolveOrthogonal, leg1LockedKnee, leg2LockedKnee, interiorAngle,
  isRightAngle, packCalloutPos, unpackCalloutPos,
  resolveCalloutGeom, migratePanelLeader, LEG2_AUTO_TAIL,
  nudgePanelFromHotspot, hotspotInsidePanel,
} from './leader-geom.mjs'

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}
function near(a, b, eps = 0.01) { assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b}`) }

console.log('leader-geom tests')

test('orthogonal: audit case is 90°', () => {
  const r = resolveOrthogonal(100, 100, 500, 300, 300, 150, { elbowMode: 'orthogonal' })
  near(interiorAngle(100, 100, r.kx, r.ky, r.ax, r.ay), 90)
  assert.ok(isRightAngle(100, 100, r.kx, r.ky, r.ax, r.ay))
})

test('orthogonal: panel overlapping hotspot nudges to 90°', () => {
  const mx = 400, my = 350, cw = 300, ch = 150
  const cardX = 300, cardY = 300
  assert.ok(hotspotInsidePanel(mx, my, cardX, cardY, cw, ch))
  const r = resolveCalloutGeom(mx, my, cw, ch, { elbowMode: 'orthogonal' }, null, { cardX, cardY })
  assert.ok(!hotspotInsidePanel(mx, my, r.cardX, r.cardY, cw, ch))
  near(r.meta.ang, 90)
})

test('nudgePanelFromHotspot pushes panel away', () => {
  const n = nudgePanelFromHotspot(400, 350, 300, 300, 300, 150)
  assert.ok(!hotspotInsidePanel(400, 350, n.cardX, n.cardY, 300, 150))
})

test('orthogonal: panel right of hotspot', () => {
  const r = resolveOrthogonal(200, 400, 520, 300, 280, 150, { elbowMode: 'orthogonal', leg1Axis: 'auto' })
  near(interiorAngle(200, 400, r.kx, r.ky, r.ax, r.ay), 90)
})

test('orthogonal: explicit horizontal keeps first segment horizontal', () => {
  const r = resolveOrthogonal(100, 100, 500, 300, 300, 150, { elbowMode: 'orthogonal', leg1Axis: 'h' })
  near(r.ky, 100)
  near(interiorAngle(100, 100, r.kx, r.ky, r.ax, r.ay), 90)
})

test('orthogonal: explicit vertical keeps first segment vertical', () => {
  const r = resolveOrthogonal(100, 100, 500, 300, 300, 150, { elbowMode: 'orthogonal', leg1Axis: 'v' })
  near(r.kx, 100)
  near(interiorAngle(100, 100, r.kx, r.ky, r.ax, r.ay), 90)
})

test('leg1-lock: horizontal length equals stub', () => {
  const [kx, ky] = leg1LockedKnee(100, 200, 'h', 1, 48)
  near(kx, 148); near(ky, 200)
  near(Math.hypot(kx - 100, ky - 200), 48)
})

test('leg1-lock: vertical length equals stub', () => {
  const [kx, ky] = leg1LockedKnee(100, 200, 'v', -1, 48)
  near(kx, 100); near(ky, 152)
})

test('leg2-lock: horizontal means ky===ay', () => {
  const panel = { elbowMode: 'leg2-lock', leg2Axis: 'h', leaderTail: 60 }
  const [kx, ky] = leg2LockedKnee(100, 100, 400, 300, panel)
  near(ky, 300)
  near(Math.abs(kx - 400), 60)
})

test('leg2-lock: vertical means kx===ax', () => {
  const panel = { elbowMode: 'leg2-lock', leg2Axis: 'v', leaderTail: 50 }
  const [kx, ky] = leg2LockedKnee(100, 100, 400, 300, panel)
  near(kx, 400)
  near(Math.abs(ky - 300), 50)
})

test('leg2-lock: tail=0 uses LEG2_AUTO_TAIL', () => {
  const panel = { elbowMode: 'leg2-lock', leg2Axis: 'h', leaderTail: 0 }
  const [kx, ky] = leg2LockedKnee(100, 100, 400, 300, panel)
  near(Math.abs(kx - 400), LEG2_AUTO_TAIL)
  near(ky, 300)
})

test('pack/unpack callout pos scales with viewport', () => {
  const p = packCalloutPos(100, 200, 1920, 1080)
  const u = unpackCalloutPos(p, 960, 540)
  near(u.x, 50); near(u.y, 100)
})

test('resolveCalloutGeom leg1-lock horizontal first segment locked', () => {
  const r = resolveCalloutGeom(100, 100, 300, 150, { elbowMode: 'leg1-lock', leg1Axis: 'h', leaderGap: 48 }, null, { cardX: 500, cardY: 300 })
  near(r.meta.l1, 48)
  near(r.meta.ky, 100)
})

test('migratePanelLeader copies leg1Axis to leg2Axis in leg2-lock', () => {
  const m = migratePanelLeader({ elbowMode: 'leg2-lock', leg1Axis: 'h' })
  assert.equal(m.leg2Axis, 'h')
})

test('resolveCalloutGeom orthogonal after panel drag layout', () => {
  const r = resolveCalloutGeom(100, 100, 300, 150, { elbowMode: 'orthogonal' }, { calloutPosManual: true, calloutPos: { x: 500, y: 300 } }, { cardX: 500, cardY: 300 })
  near(interiorAngle(100, 100, r.meta.kx, r.meta.ky, r.ax, r.ay), 90)
})

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
