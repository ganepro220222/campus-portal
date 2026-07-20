import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  resolveOrthogonal, leg1LockedKnee, leg2LockedKnee, interiorAngle,
  isRightAngle, packCalloutPos, unpackCalloutPos,
  resolveCalloutGeom, migratePanelLeader, LEG2_AUTO_TAIL,
  nudgePanelFromHotspot, hotspotInsidePanel, panelHotspotCollision, panelHotspotClear,
  layoutPanelFromHotspot,
} from './leader-geom.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}
function near(a, b, eps = 0.01) { assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b}`) }

const VP = (maxX, maxY, cw = 280, ch = 150) => ({ minX: 8, minY: 66, maxX, maxY: maxY - ch - 24 })

console.log('leader-geom tests')

test('orthogonal: audit case is 90°', () => {
  const r = resolveOrthogonal(100, 100, 500, 300, 300, 150, { elbowMode: 'orthogonal' })
  near(interiorAngle(100, 100, r.kx, r.ky, r.ax, r.ay), 90)
  assert.ok(isRightAngle(100, 100, r.kx, r.ky, r.ax, r.ay))
})

test('nudge: audit probe — axial overlap only, no move', () => {
  const n = nudgePanelFromHotspot(150, 50, 100, 200, 100, 100)
  assert.equal(n.cardX, 100)
  assert.equal(n.cardY, 200)
  assert.ok(!panelHotspotCollision(150, 50, 100, 200, 100, 100))
})

test('nudge: true overlap moves panel', () => {
  const n = nudgePanelFromHotspot(400, 350, 300, 300, 300, 150)
  assert.ok(panelHotspotClear(400, 350, n.cardX, n.cardY, 300, 150))
})

test('nudge: result stays within viewport', () => {
  const vp = VP(600, 900, 200, 120)
  const n = layoutPanelFromHotspot(150, 50, 100, 200, 200, 120, vp)
  assert.ok(n.cardX >= vp.minX && n.cardX <= vp.maxX)
  assert.ok(n.cardY >= vp.minY && n.cardY <= vp.maxY)
})

test('nudge: left edge hotspot does not go negative X', () => {
  const vp = VP(500, 900, 180, 100)
  const n = layoutPanelFromHotspot(30, 400, 50, 350, 180, 100, vp)
  assert.ok(n.cardX >= vp.minX, `cardX=${n.cardX}`)
})

test('orthogonal: panel overlapping hotspot nudges to 90°', () => {
  const mx = 400, my = 350, cw = 300, ch = 150
  const r = resolveCalloutGeom(mx, my, cw, ch, { elbowMode: 'orthogonal' }, null, { cardX: 300, cardY: 300 }, VP(1200, 900, cw, ch))
  assert.ok(panelHotspotClear(mx, my, r.cardX, r.cardY, cw, ch))
  near(r.meta.ang, 90)
})

test('orthogonal: explicit horizontal keeps first segment horizontal', () => {
  const r = resolveOrthogonal(100, 100, 500, 300, 300, 150, { elbowMode: 'orthogonal', leg1Axis: 'h' })
  near(r.ky, 100)
  near(interiorAngle(100, 100, r.kx, r.ky, r.ax, r.ay), 90)
})

test('leg2-lock: horizontal means ky===ay', () => {
  const panel = { elbowMode: 'leg2-lock', leg2Axis: 'h', leaderTail: 60 }
  const [kx, ky] = leg2LockedKnee(100, 100, 400, 300, panel)
  near(ky, 300)
  near(Math.abs(kx - 400), 60)
})

test('leg2-lock: tail=0 uses LEG2_AUTO_TAIL', () => {
  const panel = { elbowMode: 'leg2-lock', leg2Axis: 'h', leaderTail: 0 }
  const [kx, ky] = leg2LockedKnee(100, 100, 400, 300, panel)
  near(Math.abs(kx - 400), LEG2_AUTO_TAIL)
})

test('pack/unpack callout pos scales with viewport', () => {
  const p = packCalloutPos(100, 200, 1920, 1080)
  const u = unpackCalloutPos(p, 960, 540)
  near(u.x, 50); near(u.y, 100)
})

test('migratePanelLeader copies leg1Axis to leg2Axis in leg2-lock', () => {
  const m = migratePanelLeader({ elbowMode: 'leg2-lock', leg1Axis: 'h' })
  assert.equal(m.leg2Axis, 'h')
})

test('export viewer strips editMode and buildEditor', () => {
  let src = fs.readFileSync(path.join(ROOT, 'player.html'), 'utf8')
  src = src.replace(/[ \t]*\/\* EDITOR-CSS-START[\s\S]*?\/\* EDITOR-CSS-END \*\/\n?/, '')
           .replace(/[ \t]*<!-- EDITOR-HTML-START[\s\S]*?<!-- EDITOR-HTML-END -->\n?/, '')
           .replace(/[ \t]*\/\* EDITOR-JS-START[\s\S]*?\/\* EDITOR-JS-END \*\/\n?/, '')
           .replace(/const editMode = params\.get\('mode'\) === 'edit'/, "const editMode = false /* viewer-only */")
           .replace(/if \(editMode && typeof buildEditor === 'function'\) buildEditor\(\)/, '/* viewer-only: no editor */')
  assert.match(src, /const editMode = false \/\* viewer-only \*\//)
  assert.doesNotMatch(src, /buildEditor\(\)/)
})

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
