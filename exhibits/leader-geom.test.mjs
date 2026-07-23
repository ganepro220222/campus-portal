import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  resolveOrthogonal, leg1LockedKnee, leg2LockedKnee, interiorAngle,
  isRightAngle, packCalloutPos, unpackCalloutPos, ORTH_MIN_SEG,
  resolveCalloutGeom, migratePanelLeader, LEG2_AUTO_TAIL,
  nudgePanelFromHotspot, hotspotInsidePanel, panelHotspotCollision, panelHotspotClear,
  layoutPanelFromHotspot, probeLeaderLayouts, hotspotClearance,
  anchorOnPanelEdge, getOrthPreferFirst, setOrthPreferFirst, clearOrthPreferFirst,
} from './leader-geom.js'
import { batchFieldApplies, batchFieldModeOff, collectBatchOps } from './studio-batch.mjs'
import { ensureHotspotIds, nextHotspotId, auditHotspotIds, hotspotIdIssueLabel, normalizeHotspotId, bootstrapHotspotIds, mergeHotspotIdChanges, hotspotBootAuditHadIssues, formatHotspotIdChanges, hotspotAuditSummaryParts } from './hotspot-id.mjs'
import { buildViewerSrc } from './build-viewer.mjs'

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

test('orthogonal: panel-right layout (hotspot left of panel)', () => {
  const r = resolveOrthogonal(80, 200, 400, 180, 280, 140, { elbowMode: 'orthogonal' })
  assert.ok(r.ax <= 400 + 8 || r.ax >= 400 + 280 - 8)
  near(interiorAngle(80, 200, r.kx, r.ky, r.ax, r.ay), 90)
  assert.ok(Math.hypot(r.kx - 80, r.ky - 200) >= ORTH_MIN_SEG)
  assert.ok(Math.hypot(r.ax - r.kx, r.ay - r.ky) >= ORTH_MIN_SEG)
})

test('orthogonal: explicit v keeps first segment vertical', () => {
  const r = resolveOrthogonal(100, 100, 500, 300, 300, 150, { elbowMode: 'orthogonal', leg1Axis: 'v' })
  near(r.kx, 100)
  near(interiorAngle(100, 100, r.kx, r.ky, r.ax, r.ay), 90)
  assert.ok(Math.abs(r.ky - 100) >= ORTH_MIN_SEG)
})

test('orthogonal: explicit horizontal keeps first segment horizontal', () => {
  const r = resolveOrthogonal(100, 100, 500, 300, 300, 150, { elbowMode: 'orthogonal', leg1Axis: 'h' })
  near(r.ky, 100)
  near(interiorAngle(100, 100, r.kx, r.ky, r.ax, r.ay), 90)
  assert.ok(Math.abs(r.kx - 100) >= ORTH_MIN_SEG)
})

test('orthogonal: hotspot inside panel still yields non-zero segments', () => {
  const mx = 450, my = 375, cw = 300, ch = 150
  const r = resolveOrthogonal(mx, my, 300, 300, cw, ch, { elbowMode: 'orthogonal' })
  assert.ok(isRightAngle(mx, my, r.kx, r.ky, r.ax, r.ay))
  assert.ok(Math.hypot(r.kx - mx, r.ky - my) >= ORTH_MIN_SEG)
  assert.ok(Math.hypot(r.ax - r.kx, r.ay - r.ky) >= ORTH_MIN_SEG)
})

test('leg1-lock: horizontal stub length and direction', () => {
  const [kx, ky] = leg1LockedKnee(100, 200, 'h', 1, 48)
  near(kx, 148); near(ky, 200)
  const [kx2] = leg1LockedKnee(100, 200, 'h', -1, 48)
  near(kx2, 52)
})

test('leg1-lock: vertical stub length and direction', () => {
  const [kx, ky] = leg1LockedKnee(100, 200, 'v', 1, 60)
  near(kx, 100); near(ky, 260)
})

test('resolveCalloutGeom: leg1-lock integration', () => {
  const r = resolveCalloutGeom(100, 200, 280, 140, {
    elbowMode: 'leg1-lock', leg1Axis: 'h', leaderGap: 48, dir: 'right',
  }, null, { cardX: 400, cardY: 180 }, VP(900, 800))
  near(r.meta.l1, 48, 1)
  assert.ok(r.meta.l2 >= ORTH_MIN_SEG)
})

test('leg2-lock: vertical means kx===ax', () => {
  const panel = { elbowMode: 'leg2-lock', leg2Axis: 'v', leaderTail: 50 }
  const [kx, ky] = leg2LockedKnee(100, 100, 400, 300, panel)
  near(kx, 400)
  near(Math.abs(ky - 300), 50)
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

test('resolveCalloutGeom: manual panel drag uses nudge', () => {
  const mx = 400, my = 350, cw = 300, ch = 150
  const vp = VP(900, 800, cw, ch)
  const r = resolveCalloutGeom(mx, my, cw, ch, { elbowMode: 'orthogonal' }, { calloutPosManual: true }, { cardX: 300, cardY: 300 }, vp)
  assert.ok(panelHotspotClear(mx, my, r.cardX, r.cardY, cw, ch) || r.meta.panelDegraded)
  near(r.meta.ang, 90)
})

test('nudge: audit probe — axial overlap only, no move', () => {
  const n = nudgePanelFromHotspot(150, 50, 100, 200, 100, 100)
  assert.equal(n.cardX, 100)
  assert.equal(n.cardY, 200)
  assert.ok(!n.degraded)
  assert.ok(!panelHotspotCollision(150, 50, 100, 200, 100, 100))
})

test('nudge: true overlap moves panel', () => {
  const n = nudgePanelFromHotspot(400, 350, 300, 300, 300, 150)
  assert.ok(panelHotspotClear(400, 350, n.cardX, n.cardY, 300, 150))
})

test('nudge: returns degraded metadata when gap cannot be met', () => {
  const mx = 400, my = 400, cw = 280, ch = 160
  const vp = { minX: 8, minY: 66, maxX: 420, maxY: 500, relaxedMaxX: 620 }
  const n = nudgePanelFromHotspot(mx, my, mx - 40, my - 40, cw, ch, vp)
  assert.equal(typeof n.degraded, 'boolean')
  assert.equal(typeof n.clearance, 'number')
  assert.ok(Number.isFinite(n.clearance))
  assert.ok(n.clearance >= 0, `expected non-overlap clearance, got ${n.clearance}`)
})

test('nudge: impossible overlap uses straight fallback in resolveCalloutGeom', () => {
  const mx = 200, my = 300, cw = 300, ch = 200
  const vp = { minX: 8, minY: 66, maxX: 120, maxY: 300, relaxedMaxX: 120 }
  const r = resolveCalloutGeom(mx, my, cw, ch, { elbowMode: 'orthogonal' }, {}, { cardX: 50, cardY: 200 }, vp)
  if (r.meta.panelOverlap) {
    assert.ok(['panel-overlap', 'hidden-overlap'].includes(r.meta.leaderFallback))
    if (r.meta.leaderFallback !== 'hidden-overlap') {
      assert.ok(r.meta.l1 >= ORTH_MIN_SEG)
      assert.ok(anchorOnPanelEdge(r.ax, r.ay, r.cardX, r.cardY, cw, ch))
      assert.ok(Math.hypot(r.ax - mx, r.ay - my) >= ORTH_MIN_SEG)
    }
  } else {
    assert.ok(r.meta.panelClearance >= 0)
    assert.ok(isRightAngle(mx, my, r.meta.kx, r.meta.ky, r.ax, r.ay))
  }
})

test('panel-overlap straight fallback uses edge anchor with positive length', () => {
  const mx = 50, my = 80, cw = 500, ch = 400
  const vp = { minX: 8, minY: 66, maxX: 8, maxY: 66, relaxedMaxX: 8 }
  const r = resolveCalloutGeom(mx, my, cw, ch, { elbowMode: 'orthogonal' }, {}, { cardX: 200, cardY: 200 }, vp)
  assert.equal(r.meta.leaderFallback, 'panel-overlap')
  assert.ok(r.meta.l1 >= ORTH_MIN_SEG)
  assert.ok(anchorOnPanelEdge(r.ax, r.ay, r.cardX, r.cardY, cw, ch))
  assert.ok(Math.hypot(r.pts[1][0] - r.pts[0][0], r.pts[1][1] - r.pts[0][1]) >= ORTH_MIN_SEG)
})

test('calloutOrthFirst is not written into hotspot config', () => {
  const hs = { id: 'h1', position: [0, 0, 0] }
  const before = JSON.stringify(hs)
  for (let i = 0; i < 8; i++) {
    resolveCalloutGeom(400, 350, 280, 150, { elbowMode: 'orthogonal', leg1Axis: 'auto' }, hs, { cardX: 300, cardY: 300 }, VP(900, 800))
  }
  assert.equal(JSON.stringify(hs), before)
  setOrthPreferFirst(hs, 'h')
  assert.equal(getOrthPreferFirst(hs), 'h')
  assert.ok(!('calloutOrthFirst' in hs))
  clearOrthPreferFirst(hs)
})

test('orthogonal: invalid path falls back to straight segment', () => {
  const mx = 450, my = 375, cw = 300, ch = 150
  const r = resolveCalloutGeom(mx, my, cw, ch, { elbowMode: 'orthogonal', leg1Axis: 'h' }, {}, { cardX: 300, cardY: 300 }, VP(1200, 900, cw, ch))
  if (r.meta.leaderFallback) assert.equal(r.pts.length, 2)
  else assert.ok(isRightAngle(mx, my, r.meta.kx, r.meta.ky, r.ax, r.ay))
})

test('nudge: narrow viewport picks best clearance among candidates', () => {
  const mx = 200, my = 300, cw = 200, ch = 120
  const vp = { minX: 8, minY: 66, maxX: 280, maxY: 420 }
  const n = layoutPanelFromHotspot(mx, my, 50, 200, cw, ch, vp)
  assert.ok(n.cardX >= vp.minX && n.cardX + cw <= vp.maxX + cw)
  assert.ok(n.cardY >= vp.minY)
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

test('viewport: editor 320px reserve (721px desktop branch)', () => {
  const cw = 200, ch = 120
  const maxX = 721 - 320 - cw - 8
  const vp = VP(maxX, 600, cw, ch)
  const n = layoutPanelFromHotspot(360, 300, 100, 200, cw, ch, vp)
  assert.ok(n.cardX + cw <= 721 - 320 - 8 + 1, `cardX=${n.cardX}`)
})

const EDGE_CASES = [
  ['top-left', 20, 80], ['top-right', 880, 80],
  ['bottom-left', 20, 720], ['bottom-right', 880, 720],
  ['top', 450, 70], ['bottom', 450, 750],
  ['left', 15, 400], ['right', 890, 400],
]
for (const [label, mx, my] of EDGE_CASES) {
  test(`viewport edge: ${label}`, () => {
    const cw = 220, ch = 130
    const vp = VP(900 - 320 - cw - 8, 800, cw, ch)
    const r = resolveCalloutGeom(mx, my, cw, ch, { elbowMode: 'orthogonal' }, null, { cardX: 400, cardY: 250 }, vp)
    assert.ok(r.cardX >= vp.minX && r.cardX <= vp.maxX)
    assert.ok(r.cardY >= vp.minY && r.cardY <= vp.maxY)
    assert.ok(isRightAngle(mx, my, r.meta.kx, r.meta.ky, r.ax, r.ay))
  })
}

test('orthogonal: panel overlapping hotspot nudges to 90°', () => {
  const mx = 400, my = 350, cw = 300, ch = 150
  const r = resolveCalloutGeom(mx, my, cw, ch, { elbowMode: 'orthogonal' }, null, { cardX: 300, cardY: 300 }, VP(1200, 900, cw, ch))
  assert.ok(panelHotspotClear(mx, my, r.cardX, r.cardY, cw, ch))
  near(r.meta.ang, 90)
})

test('hotspotInsidePanel detects interior point', () => {
  assert.ok(hotspotInsidePanel(150, 250, 100, 200, 100, 100))
  assert.ok(!hotspotInsidePanel(50, 50, 100, 200, 100, 100))
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

test('property probe: 60000 layouts (seed=42) have valid geometry or straight fallback', () => {
  const s = probeLeaderLayouts(42, 20000)
  assert.equal(s.nan, 0)
  assert.equal(s.badAngle, 0)
  assert.equal(s.zeroSeg, 0)
  assert.equal(s.badDir, 0)
  assert.equal(s.overlap, 0)
  assert.equal(s.badStraight, 0)
})

test('craft index shells point to player.view.html only', () => {
  for (const dir of ['craft-001', 'craft-002', 'craft-003', 'craft-004']) {
    const html = fs.readFileSync(path.join(ROOT, dir, 'index.html'), 'utf8')
    assert.ok(html.includes(`player.view.html?ex=${dir}`))
    assert.ok(!html.includes('player.html'))
    assert.match(html, /params\.delete\('mode'\)/)
  }
})

test('batch: leg1-lock mode enables lgap and laxis only', () => {
  const lgap = { id: 'lgap', leaders: ['elbow'], modes: ['leg1-lock'] }
  const ltail = { id: 'ltail', leaders: ['elbow'], modes: ['leg2-lock'] }
  const laxis = { id: 'laxis', leaders: ['elbow'], modes: ['orthogonal', 'leg1-lock'] }
  assert.ok(batchFieldApplies(lgap, 'leg1-lock', 'elbow'))
  assert.ok(!batchFieldApplies(lgap, 'orthogonal', 'elbow'))
  assert.ok(batchFieldApplies(laxis, 'leg1-lock', 'elbow'))
  assert.ok(batchFieldModeOff(ltail, 'leg1-lock', 'elbow'))
})

test('batch: straight leader disables elbow-only fields including elbowMode', () => {
  const lmode = { id: 'lmode', path: 'panel.elbowMode', leaders: ['elbow'] }
  const laxis = { id: 'laxis', leaders: ['elbow'], modes: ['orthogonal', 'leg1-lock'] }
  const lgap = { id: 'lgap', leaders: ['elbow'], modes: ['leg1-lock'] }
  assert.ok(!batchFieldApplies(lmode, 'orthogonal', 'straight'))
  assert.ok(!batchFieldApplies(laxis, 'orthogonal', 'straight'))
  assert.ok(!batchFieldApplies(lgap, 'leg1-lock', 'straight'))
  assert.ok(batchFieldApplies(lmode, 'leg1-lock', 'elbow'))
  assert.ok(batchFieldModeOff(lmode, 'orthogonal', 'straight'))
  assert.ok(!batchFieldModeOff(lmode, 'orthogonal', 'elbow'))
})

test('batch: straight leader still allows non-elbow panel fields', () => {
  const pstyle = { id: 'pstyle', path: 'panel.style' }
  const leader = { id: 'leader', path: 'panel.leader' }
  assert.ok(batchFieldApplies(pstyle, 'orthogonal', 'straight'))
  assert.ok(batchFieldApplies(leader, 'orthogonal', 'straight'))
})

test('batch: collectBatchOps skips modeOff fields', () => {
  const FIELDS = {
    a: { id: 'a', path: 'panel.style', type: 'text' },
    b: { id: 'b', path: 'panel.leaderGap', type: 'range', leaders: ['elbow'], modes: ['leg1-lock'] },
  }
  const ops = collectBatchOps(FIELDS, {
    enabled: id => id === 'a' || id === 'b',
    modeOff: id => id === 'b',
    value: f => f.id === 'a' ? 'glass' : 48,
    schemeOps: () => [],
  })
  assert.equal(ops.length, 1)
  assert.equal(ops[0].path, 'panel.style')
})

test('batch: collectBatchOps excludes panel.elbowMode when leader straight', () => {
  const lmode = { id: 'lmode', path: 'panel.elbowMode', type: 'select', leaders: ['elbow'] }
  const leader = { id: 'leader', path: 'panel.leader', type: 'select' }
  const FIELDS = { lmode, leader }
  const ops = collectBatchOps(FIELDS, {
    enabled: () => true,
    modeOff: id => id === 'lmode',
    applies: f => batchFieldApplies(f, 'orthogonal', 'straight'),
    value: f => (f.id === 'lmode' ? 'leg1-lock' : 'straight'),
    schemeOps: () => [],
  })
  assert.ok(!ops.some(o => o.path === 'panel.elbowMode'))
  assert.equal(ops.length, 1)
  assert.equal(ops[0].path, 'panel.leader')
})

function hsList(ids) {
  return ids.map(id => (id == null ? {} : { id }))
}

function hsIds(list) {
  return list.map(h => h.id)
}

test('hotspot id: duplicate h1,h1,h2 migrates to h1,h3,h2', () => {
  const list = hsList(['h1', 'h1', 'h2'])
  ensureHotspotIds(list)
  assert.deepEqual(hsIds(list), ['h1', 'h3', 'h2'])
})

test('hotspot id: missing then h1 becomes h2,h1', () => {
  const list = hsList(['', 'h1'])
  ensureHotspotIds(list)
  assert.deepEqual(hsIds(list), ['h2', 'h1'])
})

test('hotspot id: nextHotspotId skips reserved existing ids', () => {
  const list = hsList(['h1', 'h3', 'h100'])
  assert.equal(nextHotspotId(list), 'h2')
})

test('hotspot id: reordering unique ids does not rewrite them', () => {
  const list = hsList(['h2', 'h1', 'h3'])
  ensureHotspotIds(list)
  assert.deepEqual(hsIds(list), ['h2', 'h1', 'h3'])
})

test('hotspot id: migration is idempotent', () => {
  const list = hsList(['h1', 'h1', 'h2'])
  ensureHotspotIds(list)
  assert.deepEqual(ensureHotspotIds(list), [])
  assert.deepEqual(hsIds(list), ['h1', 'h3', 'h2'])
})

test('hotspot id: non-string ids are replaced not stringified', () => {
  const list = [{ id: 1 }, { id: true }, { id: { source: 'cms-42' } }]
  const changes = ensureHotspotIds(list)
  assert.deepEqual(hsIds(list), ['h1', 'h2', 'h3'])
  assert.ok(changes.some(c => c.from === '(invalid type: number)'))
  assert.ok(changes.some(c => c.from === '(invalid type: boolean)'))
  assert.ok(changes.some(c => c.from === '(invalid type: object)'))
})

test('hotspot id: two object ids get distinct hN not [object Object]', () => {
  const list = [{ id: {} }, { id: { x: 1 } }]
  ensureHotspotIds(list)
  assert.deepEqual(hsIds(list), ['h1', 'h2'])
})

test('hotspot id: string numeric id stays valid', () => {
  assert.equal(normalizeHotspotId('1'), '1')
  const list = [{ id: '1' }]
  assert.deepEqual(ensureHotspotIds(list), [])
  assert.deepEqual(hsIds(list), ['1'])
})

test('hotspot id: audit reports invalid types before migration', () => {
  const list = [{ id: 1 }, { id: 'h1' }]
  const audit = auditHotspotIds(list)
  assert.equal(audit.invalid.length, 1)
  assert.equal(audit.invalid[0].issue, 'invalid:number')
  assert.equal(hotspotIdIssueLabel(audit.invalid[0].issue), '(invalid type: number)')
})

test('hotspot id: bootstrap preserves pre-migration audit and changes', () => {
  const list = [{ id: 1 }, { id: true }, { id: 'h1' }]
  const { audit, changes } = bootstrapHotspotIds(list)
  assert.equal(audit.invalid.length, 2)
  assert.ok(changes.length >= 2)
  assert.deepEqual(list.map(h => h.id), ['h2', 'h3', 'h1'])
  assert.ok(hotspotBootAuditHadIssues(audit, changes))
  assert.ok(formatHotspotIdChanges(changes).includes('(invalid type: number)'))
})

test('hotspot id: mergeHotspotIdChanges dedupes boot and save groups', () => {
  const boot = [{ index: 0, from: '(invalid type: number)', to: 'h1' }]
  const save = [{ index: 0, from: '(invalid type: number)', to: 'h1' }, { index: 3, from: '(missing)', to: 'h4' }]
  assert.equal(mergeHotspotIdChanges(boot, save).length, 2)
})

test('hotspot id: audit summary includes invalid dupes and missing together', () => {
  const list = [{ id: 1 }, { id: 'h1' }, { id: 'h1' }, { id: '' }]
  const audit = auditHotspotIds(list)
  assert.equal(audit.invalid.length, 1)
  assert.deepEqual(audit.dupes, ['h1'])
  assert.equal(audit.missing, 1)
  const parts = hotspotAuditSummaryParts(audit)
  assert.equal(parts.length, 3)
  assert.ok(parts.some(p => p.startsWith('热点 id 类型非法')))
  assert.ok(parts.some(p => p.startsWith('热点 id 重复')))
  assert.ok(parts.some(p => p.startsWith('热点缺 id')))
})

test('static deps: HTML module imports resolve to files', () => {
  const r = spawnSync(process.execPath, ['check-static-deps.mjs'], { cwd: ROOT, encoding: 'utf8' })
  assert.equal(r.status, 0, (r.stderr || r.stdout || 'check-static-deps failed').trim())
})

test('build-viewer: player.view.html is byte-identical to generator output', () => {
  const r = spawnSync(process.execPath, ['build-viewer.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' })
  assert.equal(r.status, 0, (r.stderr || r.stdout || 'build-viewer --check failed').trim())
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
  const view = fs.readFileSync(path.join(ROOT, 'player.view.html'), 'utf8')
  assert.match(view, /const editMode = false \/\* viewer-only \*\//)
  assert.doesNotMatch(view, /buildEditor\(\)/)
})

test('viewer output omits editor hotspot boot diagnostics', () => {
  const view = buildViewerSrc()
  assert.match(view, /import \{ ensureHotspotIds \} from '\.\/hotspot-id\.mjs'/)
  assert.doesNotMatch(view, /bootstrapHotspotIds/)
  assert.doesNotMatch(view, /hotspotIdBootAudit/)
  assert.doesNotMatch(view, /hotspotIdBootChanges/)
  assert.doesNotMatch(view, /formatHotspotIdChanges/)
  assert.doesNotMatch(view, /mergeHotspotIdChanges/)
  assert.doesNotMatch(view, /hotspotBootAuditHadIssues/)
  assert.doesNotMatch(view, /nextHotspotId/)
  assert.match(view, /ensureHotspotIds\(cfg\.hotspots \|\| \[\]\)/)
})

test('editor preset row uses dedicated label/actions classes', () => {
  const html = fs.readFileSync(path.join(ROOT, 'player.html'), 'utf8')
  assert.match(html, /\.ed-label \{ white-space:nowrap/)
  assert.match(html, /\.ed-preset-name \{[^}]*text-overflow:ellipsis/)
  assert.match(html, /class="ed-preset-name"/)
  assert.match(html, /class="ed-preset-actions"/)
  assert.doesNotMatch(html, /\.ed-row > span \{ white-space:nowrap/)
})

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
