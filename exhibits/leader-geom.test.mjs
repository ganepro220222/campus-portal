import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import {
  resolveOrthogonal, leg1LockedKnee, leg2LockedKnee, interiorAngle,
  isRightAngle, packCalloutPos, unpackCalloutPos, ORTH_MIN_SEG,
  resolveCalloutGeom, migratePanelLeader, LEG2_AUTO_TAIL,
  nudgePanelFromHotspot, hotspotInsidePanel, panelHotspotCollision, panelHotspotClear,
  layoutPanelFromHotspot, probeLeaderLayouts, hotspotClearance,
  anchorOnPanelEdge, getOrthPreferFirst, setOrthPreferFirst, clearOrthPreferFirst,
} from './leader-geom.js'
import { batchFieldApplies, batchFieldModeOff, collectBatchOps,
  BATCH_SAFE_CAMERA_PATHS, isBatchSafeCameraPath } from './studio-batch.mjs'
import { inferBatchEnvEffect } from './studio-batch-env.mjs'
import { ensureHotspotIds, nextHotspotId, auditHotspotIds, hotspotIdIssueLabel, normalizeHotspotId, bootstrapHotspotIds, mergeHotspotIdChanges, hotspotBootAuditHadIssues, formatHotspotIdChanges, hotspotAuditSummaryParts } from './hotspot-id.mjs'
import { buildViewerSrc, buildProductionViewer, syncUploadModules, syncUploadExhibits, syncUploadAssets,
  initUploadVendor, validateViewerSemantics, checkHtmlImports, checkUploadRuntimeDeps, verifyUploadAssets,
  collectModuleGraph, patchExhibitIndexTitle, exhibitTitleFromCfg, runUploadPreflight, deployUploadPack,
  prepareUploadStaging, promoteUploadStaging, uploadSiblingStagingPath, uploadSiblingBackupPath,
  orphanUploadExhibits, pruneUploadExhibits, listUploadExhibits, listSourceCraftDirs, auditSourceExhibits, validateSourceExhibitConfig, buildExhibitIndexHtml, UPLOAD_JS_COPIES, VIEWER_BUNDLE_FILE } from './build-viewer.mjs'
import { configTimeoutMs, modelIdleTimeoutMs, createModelLoadTimers } from './player-persist.mjs'
import { anglesToPosition, positionToAngles } from './light-rig.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

function writeBundledUploadViewer(uploadDir) {
  const { html, bundlePath } = buildProductionViewer(buildViewerSrc())
  fs.writeFileSync(path.join(uploadDir, 'player.view.html'), html, 'utf8')
  fs.copyFileSync(bundlePath, path.join(uploadDir, VIEWER_BUNDLE_FILE))
  return html
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

let pass = 0, fail = 0
const _tests = []
function test(name, fn) { _tests.push({ name, fn }) }
async function runTests() {
  console.log('leader-geom tests')
  for (const { name, fn } of _tests) {
    try {
      await fn()
      pass++
      console.log('  ok', name)
    } catch (e) {
      fail++
      console.error(' FAIL', name, e.message)
    }
  }
  console.log(`\n${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
}
function near(a, b, eps = 0.01) { assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b}`) }

const VP = (maxX, maxY, cw = 280, ch = 150) => ({ minX: 8, minY: 66, maxX, maxY: maxY - ch - 24 })

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
    const indexPath = path.join(ROOT, dir, 'index.html')
    if (!fs.existsSync(indexPath)) continue
    const html = fs.readFileSync(indexPath, 'utf8')
    assert.ok(html.includes(`player.view.html?ex=${dir}`))
    assert.ok(!html.includes('player.html'))
    assert.match(html, /params\.delete\('mode'\)/)
  }
})

/* 批量的相机组只收「比例/角度」类字段。绝对长度（最近/最远距离、旋转轴偏移、默认距离）
   与器物自身尺寸死绑，一刷就会把小件的取景夹死，必须留在单件编辑器里。
   下面这条直接读 studio.html 源码，防的是「以后有人顺手往注册表里加一个 camera.minDistance」。 */
test('batch: studio.html 的相机字段只允许与器物尺度无关的那几个', () => {
  const src = fs.readFileSync(path.join(ROOT, 'studio.html'), 'utf8')
  const groups = src.slice(src.indexOf('const GROUPS = ['), src.indexOf('const groupFields'))
  const paths = [...groups.matchAll(/path\s*:\s*'(camera\.[\w.]+)'/g)].map(m => m[1])
  const expandOpsPaths = [...groups.matchAll(/path\s*:\s*'(camera\.[\w.]+)'\s*,\s*value/g)].map(m => m[1])
  const all = [...new Set([...paths, ...expandOpsPaths])]
  assert.ok(all.length > 0, 'studio.html 里没抠到任何 camera.* 字段，正则可能失效了')
  for (const p of all) {
    assert.ok(isBatchSafeCameraPath(p), `camera 字段 ${p} 不该出现在批量注册表里`)
  }
  // 反向：白名单里的三项确实都已经接进去了，别让这条测试变成永远为真的空转
  for (const p of BATCH_SAFE_CAMERA_PATHS) {
    assert.ok(all.includes(p), `白名单里的 ${p} 还没接进批量注册表`)
  }
})

test('batch: isBatchSafeCameraPath 只管 camera.*，绝对长度一律拒收', () => {
  assert.ok(isBatchSafeCameraPath('camera.portraitFill'))
  assert.ok(isBatchSafeCameraPath('camera.fov'))
  assert.ok(isBatchSafeCameraPath('camera.autoRotateSpeed'))
  assert.ok(!isBatchSafeCameraPath('camera.minDistance'))
  assert.ok(!isBatchSafeCameraPath('camera.maxDistance'))
  assert.ok(!isBatchSafeCameraPath('camera.distance'))
  assert.ok(!isBatchSafeCameraPath('camera.pivot'))
  // 非相机字段不归这条约束管
  assert.ok(isBatchSafeCameraPath('panel.style'))
  assert.ok(isBatchSafeCameraPath(''))
  assert.ok(isBatchSafeCameraPath(undefined))
})

test('batch: 关闭竖屏取景是 action，展开成 portraitFill=0', () => {
  const off = {
    id: 'pfilloff', type: 'action',
    expandOps() { return [{ path: 'camera.portraitFill', value: 0 }] },
  }
  const ops = collectBatchOps({ off }, {
    enabled: () => true, modeOff: () => false, value: () => 0, schemeOps: () => [],
  })
  assert.deepEqual(ops, [{ path: 'camera.portraitFill', value: 0 }])
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

test('batch: angle 字段写成 position 数组，且方位角与仰角必须成对写入', () => {
  const pos = { id: 'l-key-pos', path: 'lights.key.position', type: 'angle', az: -30, el: 35, radius: 10 }
  const ops = collectBatchOps({ pos }, {
    enabled: () => true,
    modeOff: () => false,
    value: () => { throw new Error('angle 字段不该走 value()') },
    schemeOps: () => [],
    anglePosition: f => anglesToPosition(f.az, f.el, f.radius),
  })
  assert.equal(ops.length, 1)
  assert.equal(ops[0].path, 'lights.key.position')
  assert.ok(Array.isArray(ops[0].value) && ops[0].value.length === 3)
  // 反解回角度必须还是原来那一对
  const back = positionToAngles(ops[0].value)
  assert.ok(Math.abs(back.azimuth - (-30)) < 0.2, `方位角 ${back.azimuth}`)
  assert.ok(Math.abs(back.elevation - 35) < 0.2, `仰角 ${back.elevation}`)
})

test('batch: 未勾选的 angle 字段不产生 op', () => {
  const pos = { id: 'l-key-pos', path: 'lights.key.position', type: 'angle', az: 0, el: 45, radius: 10 }
  const ops = collectBatchOps({ pos }, {
    enabled: () => false, modeOff: () => false, value: () => null, schemeOps: () => [],
    anglePosition: () => [1, 2, 3],
  })
  assert.deepEqual(ops, [])
})

test('batch: anglePosition 返回空值时跳过（不写坏 config）', () => {
  const pos = { id: 'l-key-pos', path: 'lights.key.position', type: 'angle', az: 0, el: 45, radius: 10 }
  const ops = collectBatchOps({ pos }, {
    enabled: () => true, modeOff: () => false, value: () => null, schemeOps: () => [],
    anglePosition: () => null,
  })
  assert.deepEqual(ops, [])
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

test('batch: pano expandOps 同时写入 assets.panorama 与 environment.mode', () => {
  const pano = {
    id: 'pano', path: 'assets.panorama', type: 'text',
    expandOps(v) {
      const s = String(v ?? '').trim()
      if (!s) return []
      return [{ path: 'assets.panorama', value: v }, { path: 'environment.mode', value: 'panorama' }]
    },
  }
  const ops = collectBatchOps({ pano }, {
    enabled: () => true, modeOff: () => false, value: () => '../shared/bg.jpg', schemeOps: () => [],
  })
  assert.equal(ops.length, 2)
  assert.deepEqual(ops.find(o => o.path === 'assets.panorama'), { path: 'assets.panorama', value: '../shared/bg.jpg' })
  assert.deepEqual(ops.find(o => o.path === 'environment.mode'), { path: 'environment.mode', value: 'panorama' })
})

test('batch: panoClear action 勾选即清除全景并改 preset mode', () => {
  const panoClear = {
    id: 'panoClear', type: 'action',
    expandOps() {
      return [{ path: 'assets.panorama', value: '' }, { path: 'environment.mode', value: 'preset' }]
    },
  }
  const ops = collectBatchOps({ panoClear }, {
    enabled: () => true, modeOff: () => false, schemeOps: () => [],
  })
  assert.equal(ops.length, 2)
  assert.deepEqual(ops.find(o => o.path === 'assets.panorama'), { path: 'assets.panorama', value: '' })
  assert.deepEqual(ops.find(o => o.path === 'environment.mode'), { path: 'environment.mode', value: 'preset' })
})

test('batch: pano 与 panoClear 同时启用时以后者为准', () => {
  const pano = {
    id: 'pano', type: 'text',
    expandOps(v) {
      const s = String(v ?? '').trim()
      if (!s) return []
      return [{ path: 'assets.panorama', value: v }, { path: 'environment.mode', value: 'panorama' }]
    },
  }
  const panoClear = {
    id: 'panoClear', type: 'action',
    expandOps() {
      return [{ path: 'assets.panorama', value: '' }, { path: 'environment.mode', value: 'preset' }]
    },
  }
  const ops = collectBatchOps({ pano, panoClear }, {
    enabled: () => true, modeOff: () => false,
    value: f => (f.id === 'pano' ? '../shared/a.jpg' : undefined),
    schemeOps: () => [],
  })
  assert.deepEqual(inferBatchEnvEffect(ops), { kind: 'preset', preset: 'room', cleared: true })
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
  assert.match(view, /src="\.\/player\.bundle\.js"/)
  const bundle = fs.readFileSync(path.join(ROOT, VIEWER_BUNDLE_FILE), 'utf8')
  assert.match(bundle, /\beditMode = false\b/)
  assert.doesNotMatch(bundle, /buildEditor\(\)/)
})

test('viewer output omits editor hotspot boot diagnostics', () => {
  const view = buildViewerSrc()
  const sem = validateViewerSemantics(view)
  assert.equal(sem.ok, true, sem.reason || 'viewer semantics failed')
  assert.match(view, /import \{ ensureHotspotIds \} from '\.\/hotspot-id\.mjs'/)
  assert.match(view, /ensureHotspotIds\(cfg\.hotspots \|\| \[\]\)/)
})

test('production viewer is bundled without import map', () => {
  const { html } = buildProductionViewer(buildViewerSrc())
  assert.doesNotMatch(html, /<script type="importmap">/)
  assert.match(html, /src="\.\/player\.bundle\.js"/)
  const bundle = fs.readFileSync(path.join(ROOT, VIEWER_BUNDLE_FILE), 'utf8')
  assert.ok(bundle.includes('ensureHotspotIds'), 'bundle must include viewer boot logic')
})

test('upload pack includes player.bundle.js and resolves viewer deps', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    initUploadVendor(uploadDir)
    writeBundledUploadViewer(uploadDir)
    const uploadHtmlPath = path.join(uploadDir, 'player.view.html')
    const missing = checkHtmlImports(uploadHtmlPath)
    assert.deepEqual(missing, [], `missing upload imports: ${missing.join(', ')}`)
    assert.ok(fs.existsSync(path.join(uploadDir, VIEWER_BUNDLE_FILE)), 'player.bundle.js must be in upload pack')
    const runtimeMissing = checkUploadRuntimeDeps(uploadDir, uploadHtmlPath)
    assert.deepEqual(runtimeMissing, [], `missing runtime deps: ${runtimeMissing.join(', ')}`)
    const synced = syncUploadExhibits(uploadDir)
    assert.ok(synced.includes('craft-001/config.json'), 'craft-001/config.json must sync on --upload')
    syncUploadAssets(uploadDir)
    const assets = verifyUploadAssets(uploadDir)
    assert.equal(assets.ok, true, assets.errors.join('; '))
    const cfg = JSON.parse(fs.readFileSync(path.join(uploadDir, 'craft-001/config.json'), 'utf8'))
    assert.equal(cfg.i18n.en.title, JSON.parse(fs.readFileSync(path.join(ROOT, 'craft-001/config.json'), 'utf8')).i18n.en.title)
    const idx = fs.readFileSync(path.join(uploadDir, 'craft-001/index.html'), 'utf8')
    assert.match(idx, new RegExp(escapeRegex(cfg.i18n.zh.title)))
    assert.match(idx, /player\.view\.html\?ex=craft-001/)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('--upload fails asset verify when model missing', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    syncUploadExhibits(uploadDir)
    const assets = verifyUploadAssets(uploadDir)
    assert.equal(assets.ok, false)
    assert.ok(assets.errors.some(e => e.includes('missing model')))
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('--upload detects stale model vs source', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    syncUploadExhibits(uploadDir)
    const dst = path.join(uploadDir, 'craft-001/assets/model.glb')
    fs.mkdirSync(path.dirname(dst), { recursive: true })
    fs.writeFileSync(dst, 'stale-model-bytes')
    const assets = verifyUploadAssets(uploadDir)
    assert.equal(assets.ok, false)
    assert.ok(assets.errors.some(e => e.includes('stale model')))
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('verifyUploadAssets detects same-length model changed in middle', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    syncUploadExhibits(uploadDir)
    syncUploadAssets(uploadDir)
    const src = path.join(ROOT, 'craft-001/assets/model.glb')
    const dst = path.join(uploadDir, 'craft-001/assets/model.glb')
    const buf = fs.readFileSync(src)
    const mid = Math.floor(buf.length / 2)
    buf[mid] ^= 0xff
    fs.writeFileSync(dst, buf)
    const assets = verifyUploadAssets(uploadDir)
    assert.equal(assets.ok, false)
    assert.ok(assets.errors.some(e => e.includes('stale model')))
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('first deploy preflight passes when modules synced inside preflight', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    initUploadVendor(uploadDir)
    syncUploadAssets(uploadDir)
    const { html: uploadHtml, bundlePath } = buildProductionViewer(buildViewerSrc())
    fs.copyFileSync(bundlePath, path.join(uploadDir, VIEWER_BUNDLE_FILE))
    const pre = runUploadPreflight(uploadDir, uploadHtml, { uploadAssets: false })
    assert.equal(pre.ok, true, pre.stage || JSON.stringify(pre.missing))
    assert.equal(fs.existsSync(path.join(uploadDir, 'player.view.html')), false)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('runUploadPreflight failure does not require prior viewer write', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    syncUploadExhibits(uploadDir)
    initUploadVendor(uploadDir)
    syncUploadAssets(uploadDir)
    const cfgPath = path.join(uploadDir, 'craft-001/config.json')
    const oldCfg = fs.readFileSync(cfgPath, 'utf8')
    const modelPath = path.join(uploadDir, 'craft-001/assets/model.glb')
    assert.ok(fs.existsSync(modelPath), 'fixture model must exist before delete')
    fs.unlinkSync(modelPath)
    const { html: uploadHtml, bundlePath } = buildProductionViewer(buildViewerSrc())
    fs.copyFileSync(bundlePath, path.join(uploadDir, VIEWER_BUNDLE_FILE))
    const pre = runUploadPreflight(uploadDir, uploadHtml, { uploadAssets: false })
    assert.equal(pre.ok, false)
    assert.equal(pre.stage, 'assets')
    assert.equal(fs.readFileSync(cfgPath, 'utf8'), oldCfg)
    assert.equal(fs.existsSync(path.join(uploadDir, 'player.view.html')), false)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('deployUploadPack failure leaves live module bytes unchanged', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    syncUploadExhibits(uploadDir)
    initUploadVendor(uploadDir)
    syncUploadAssets(uploadDir)
    syncUploadModules(uploadDir)
    const modPath = path.join(uploadDir, 'hotspot-id.js')
    const sentinel = '/* LIVE-SENTINEL-KEEP */'
    fs.writeFileSync(modPath, sentinel, 'utf8')
    fs.unlinkSync(path.join(uploadDir, 'craft-001/assets/model.glb'))
    const { html: uploadHtml, bundlePath } = buildProductionViewer(buildViewerSrc())
    const dep = deployUploadPack(uploadDir, uploadHtml, { uploadAssets: false })
    assert.equal(dep.ok, false)
    assert.equal(dep.stage, 'assets')
    assert.equal(fs.readFileSync(modPath, 'utf8'), sentinel)
    assert.equal(fs.existsSync(path.join(uploadDir, 'player.view.html')), false)
    assert.equal(fs.existsSync(uploadSiblingStagingPath(uploadDir)), false)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('prepareUploadStaging uses sibling dir outside live upload', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    fs.mkdirSync(uploadDir, { recursive: true })
    fs.writeFileSync(path.join(uploadDir, 'marker.txt'), 'live', 'utf8')
    const staging = prepareUploadStaging(uploadDir)
    assert.equal(staging, uploadSiblingStagingPath(uploadDir))
    assert.ok(!staging.startsWith(uploadDir + path.sep), 'staging must not be nested inside live upload')
    assert.equal(fs.readFileSync(path.join(staging, 'marker.txt'), 'utf8'), 'live')
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('promoteUploadStaging swaps staging into live atomically', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    fs.mkdirSync(uploadDir, { recursive: true })
    fs.writeFileSync(path.join(uploadDir, 'hotspot-id.js'), '/* LIVE-OLD */', 'utf8')
    const staging = prepareUploadStaging(uploadDir)
    fs.writeFileSync(path.join(staging, 'hotspot-id.js'), '/* STAGING-NEW */', 'utf8')
    fs.writeFileSync(path.join(staging, 'player.view.html'), '<!-- new viewer -->', 'utf8')
    promoteUploadStaging(staging, uploadDir)
    assert.equal(fs.readFileSync(path.join(uploadDir, 'hotspot-id.js'), 'utf8'), '/* STAGING-NEW */')
    assert.equal(fs.readFileSync(path.join(uploadDir, 'player.view.html'), 'utf8'), '<!-- new viewer -->')
    assert.equal(fs.existsSync(staging), false)
    assert.equal(fs.existsSync(uploadSiblingBackupPath(uploadDir)), false)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('promoteUploadStaging failure rolls back live and preserves staging', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    fs.mkdirSync(uploadDir, { recursive: true })
    fs.writeFileSync(path.join(uploadDir, 'hotspot-id.js'), '/* LIVE-OLD */', 'utf8')
    const staging = prepareUploadStaging(uploadDir)
    fs.writeFileSync(path.join(staging, 'hotspot-id.js'), '/* STAGING-NEW */', 'utf8')
    let renames = 0
    let thrown
    try {
      promoteUploadStaging(staging, uploadDir, {
        renameSync(from, to) {
          renames++
          if (renames === 2) throw new Error('injected rename failure')
          fs.renameSync(from, to)
        },
      })
    } catch (e) {
      thrown = e
    }
    assert.ok(thrown, 'expected promotion error')
    assert.match(thrown.message, /promotion failed/)
    assert.equal(thrown.recovery?.rolledBack, true)
    assert.equal(fs.readFileSync(path.join(uploadDir, 'hotspot-id.js'), 'utf8'), '/* LIVE-OLD */')
    assert.equal(fs.readFileSync(path.join(thrown.recovery.stagingDir, 'hotspot-id.js'), 'utf8'), '/* STAGING-NEW */')
    assert.equal(fs.existsSync(uploadSiblingBackupPath(uploadDir)), false)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('deployUploadPack promotion failure preserves verified staging for retry', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    syncUploadExhibits(uploadDir)
    initUploadVendor(uploadDir)
    syncUploadAssets(uploadDir)
    syncUploadModules(uploadDir)
    const modPath = path.join(uploadDir, 'hotspot-id.js')
    fs.writeFileSync(modPath, '/* LIVE-OLD */', 'utf8')
    const { html: uploadHtml, bundlePath } = buildProductionViewer(buildViewerSrc())
    let renames = 0
    let thrown
    try {
      deployUploadPack(uploadDir, uploadHtml, {
        uploadAssets: false,
        hooks: {
          renameSync(from, to) {
            renames++
            if (renames === 2) throw new Error('injected deploy rename failure')
            fs.renameSync(from, to)
          },
        },
      })
    } catch (e) {
      thrown = e
    }
    assert.ok(thrown, 'expected deploy promotion error')
    assert.equal(fs.readFileSync(modPath, 'utf8'), '/* LIVE-OLD */')
    assert.ok(thrown.recovery?.stagingDir)
    assert.ok(fs.existsSync(path.join(thrown.recovery.stagingDir, 'player.view.html')))
    const stagingHtml = fs.readFileSync(path.join(thrown.recovery.stagingDir, 'player.view.html'), 'utf8')
    assert.match(stagingHtml, /src="\.\/player\.bundle\.js"/)
    assert.ok(fs.existsSync(path.join(thrown.recovery.stagingDir, VIEWER_BUNDLE_FILE)))
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('auditSourceExhibits rejects missing config.json', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const root = path.join(tmp, 'exhibits')
    fs.mkdirSync(path.join(root, 'craft-nocfg'), { recursive: true })
    const audit = auditSourceExhibits(root)
    assert.equal(audit.ok, false)
    assert.ok(audit.errors.some(e => e === 'craft-nocfg/config.json: missing'))
    assert.deepEqual(audit.craftDirs, ['craft-nocfg'])
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('orphanUploadExhibits keeps upload when source craft dir still exists', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const root = path.join(tmp, 'exhibits')
    const uploadDir = path.join(tmp, 'upload')
    fs.mkdirSync(path.join(root, 'craft-005'), { recursive: true })
    fs.mkdirSync(path.join(uploadDir, 'craft-005'), { recursive: true })
    fs.writeFileSync(path.join(uploadDir, 'craft-005/config.json'), '{"assets":{"model":"assets/model.glb"}}', 'utf8')
    assert.deepEqual(orphanUploadExhibits(uploadDir, listSourceCraftDirs(root)), [])
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('auditSourceExhibits rejects missing index.html', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const root = path.join(tmp, 'exhibits')
    fs.mkdirSync(path.join(root, 'craft-noidx'), { recursive: true })
    fs.writeFileSync(path.join(root, 'craft-noidx/config.json'), '{"assets":{"model":"assets/model.glb"}}', 'utf8')
    const audit = auditSourceExhibits(root)
    assert.equal(audit.ok, false)
    assert.ok(audit.errors.some(e => e === 'craft-noidx/index.html: missing'))
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('--upload-assets alone exits with usage error', () => {
  const r = spawnSync(process.execPath, ['build-viewer.mjs', '--upload-assets'], { cwd: ROOT, encoding: 'utf8' })
  assert.notEqual(r.status, 0)
  assert.match(`${r.stderr}\n${r.stdout}`, /--upload-assets requires --upload/)
})

test('buildExhibitIndexHtml uses config title and exhibit id', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'craft-001/config.json'), 'utf8'))
  const html = buildExhibitIndexHtml('craft-001', cfg)
  assert.match(html, /player\.view\.html\?ex=craft-001/)
  assert.match(html, new RegExp(`<title>${escapeRegex(cfg.i18n.zh.title)} · 立体鉴赏</title>`))
  assert.match(html, /params\.delete\('mode'\)/)
})

test('syncUploadExhibits replaces stale upload index from template', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'upload')
    const audit = auditSourceExhibits(ROOT)
    const exhibit = audit.exhibits.find(e => e.name === 'craft-001')
    assert.ok(exhibit)
    fs.mkdirSync(path.join(uploadDir, 'craft-001'), { recursive: true })
    fs.writeFileSync(path.join(uploadDir, 'craft-001/index.html'), '<script>location.replace("../player.view.html?ex=craft-WRONG")</script>', 'utf8')
    syncUploadExhibits(uploadDir, [exhibit])
    const idx = fs.readFileSync(path.join(uploadDir, 'craft-001/index.html'), 'utf8')
    assert.match(idx, /player\.view\.html\?ex=craft-001/)
    assert.doesNotMatch(idx, /craft-WRONG/)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('auditSourceExhibits rejects invalid JSON', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const root = path.join(tmp, 'exhibits')
    fs.mkdirSync(path.join(root, 'craft-bad'), { recursive: true })
    fs.writeFileSync(path.join(root, 'craft-bad/config.json'), '{ bad json')
    const audit = auditSourceExhibits(root)
    assert.equal(audit.ok, false)
    assert.ok(audit.errors.some(e => e.includes('craft-bad/config.json')))
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('auditSourceExhibits rejects JSON array and missing assets.model', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const root = path.join(tmp, 'exhibits')
    fs.mkdirSync(path.join(root, 'craft-arr'), { recursive: true })
    fs.mkdirSync(path.join(root, 'craft-nomodel'), { recursive: true })
    fs.writeFileSync(path.join(root, 'craft-arr/config.json'), '[]')
    fs.writeFileSync(path.join(root, 'craft-nomodel/config.json'), '{"assets":{}}')
    const audit = auditSourceExhibits(root)
    assert.equal(audit.ok, false)
    assert.ok(audit.errors.some(e => e.includes('craft-arr/config.json') && e.includes('JSON object')))
    assert.ok(audit.errors.some(e => e.includes('craft-nomodel/config.json') && e.includes('assets.model')))
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('deployUploadPack rejects corrupt source config without changing live', () => {
  const cfgPath = path.join(ROOT, 'craft-001/config.json')
  const backup = fs.readFileSync(cfgPath, 'utf8')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    syncUploadExhibits(uploadDir)
    initUploadVendor(uploadDir)
    syncUploadAssets(uploadDir)
    syncUploadModules(uploadDir)
    const modPath = path.join(uploadDir, 'hotspot-id.js')
    const sentinel = '/* LIVE-SENTINEL-CFG */'
    fs.writeFileSync(modPath, sentinel, 'utf8')
    fs.writeFileSync(cfgPath, '{ broken json')
    const { html: uploadHtml, bundlePath } = buildProductionViewer(buildViewerSrc())
    const dep = deployUploadPack(uploadDir, uploadHtml, { uploadAssets: false })
    assert.equal(dep.ok, false)
    assert.equal(dep.stage, 'source')
    assert.ok(dep.errors.some(e => e.includes('craft-001/config.json')))
    assert.equal(fs.readFileSync(modPath, 'utf8'), sentinel)
    assert.equal(fs.existsSync(path.join(uploadDir, 'player.view.html')), false)
  } finally {
    fs.writeFileSync(cfgPath, backup)
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('deployUploadPack rejects missing source index without changing live', () => {
  const craftDir = path.join(ROOT, 'craft-005')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    fs.mkdirSync(craftDir, { recursive: true })
    fs.copyFileSync(path.join(ROOT, 'craft-001/config.json'), path.join(craftDir, 'config.json'))
    const uploadDir = path.join(tmp, 'exhibits-upload')
    syncUploadExhibits(uploadDir)
    initUploadVendor(uploadDir)
    syncUploadAssets(uploadDir)
    syncUploadModules(uploadDir)
    const modPath = path.join(uploadDir, 'hotspot-id.js')
    const sentinel = '/* LIVE-SENTINEL-MISSING-IDX */'
    fs.writeFileSync(modPath, sentinel, 'utf8')
    const { html: uploadHtml, bundlePath } = buildProductionViewer(buildViewerSrc())
    const dep = deployUploadPack(uploadDir, uploadHtml, { uploadAssets: false })
    assert.equal(dep.ok, false)
    assert.equal(dep.stage, 'source')
    assert.ok(dep.errors.some(e => e.includes('craft-005/index.html: missing')))
    assert.equal(fs.readFileSync(modPath, 'utf8'), sentinel)
    assert.ok(fs.existsSync(path.join(uploadDir, 'craft-001/index.html')))
  } finally {
    fs.rmSync(craftDir, { recursive: true, force: true })
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('deployUploadPack rejects missing source config with prune without changing live', () => {
  const craftDir = path.join(ROOT, 'craft-005')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    fs.mkdirSync(craftDir, { recursive: true })
    const uploadDir = path.join(tmp, 'exhibits-upload')
    syncUploadExhibits(uploadDir)
    initUploadVendor(uploadDir)
    syncUploadAssets(uploadDir)
    syncUploadModules(uploadDir)
    fs.mkdirSync(path.join(uploadDir, 'craft-005'), { recursive: true })
    fs.copyFileSync(path.join(ROOT, 'craft-001/config.json'), path.join(uploadDir, 'craft-005/config.json'))
    fs.copyFileSync(path.join(ROOT, 'craft-001/index.html'), path.join(uploadDir, 'craft-005/index.html'))
    const modPath = path.join(uploadDir, 'hotspot-id.js')
    const sentinel = '/* LIVE-SENTINEL-MISSING-CFG */'
    fs.writeFileSync(modPath, sentinel, 'utf8')
    const { html: uploadHtml, bundlePath } = buildProductionViewer(buildViewerSrc())
    const dep = deployUploadPack(uploadDir, uploadHtml, { uploadAssets: false, uploadPrune: true })
    assert.equal(dep.ok, false)
    assert.equal(dep.stage, 'source')
    assert.ok(dep.errors.some(e => e.includes('craft-005/config.json: missing')))
    assert.equal(fs.readFileSync(modPath, 'utf8'), sentinel)
    assert.ok(fs.existsSync(path.join(uploadDir, 'craft-005/config.json')))
    assert.equal(fs.existsSync(path.join(uploadDir, 'player.view.html')), false)
    const stagingParent = path.dirname(uploadDir)
    const stagingDirs = fs.readdirSync(stagingParent).filter(n => /\.staging-\d+$/.test(n))
    assert.equal(stagingDirs.length, 0, 'staging must not remain after source audit failure')
  } finally {
    fs.rmSync(craftDir, { recursive: true, force: true })
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('deployUploadPack without prune keeps orphaned craft dirs', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    syncUploadExhibits(uploadDir)
    initUploadVendor(uploadDir)
    syncUploadAssets(uploadDir)
    syncUploadModules(uploadDir)
    const ghostDir = path.join(uploadDir, 'craft-999')
    fs.mkdirSync(ghostDir, { recursive: true })
    fs.writeFileSync(path.join(ghostDir, 'config.json'), '{"assets":{}}', 'utf8')
    const { html: uploadHtml, bundlePath } = buildProductionViewer(buildViewerSrc())
    const dep = deployUploadPack(uploadDir, uploadHtml, { uploadAssets: false, uploadPrune: false })
    assert.equal(dep.ok, true)
    assert.ok(fs.existsSync(path.join(uploadDir, 'craft-999/config.json')))
    assert.deepEqual(dep.orphanExhibits, ['craft-999'])
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('deployUploadPack with uploadPrune removes orphaned craft dirs', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    syncUploadExhibits(uploadDir)
    initUploadVendor(uploadDir)
    syncUploadAssets(uploadDir)
    syncUploadModules(uploadDir)
    const ghostDir = path.join(uploadDir, 'craft-999')
    fs.mkdirSync(ghostDir, { recursive: true })
    fs.writeFileSync(path.join(ghostDir, 'config.json'), '{"assets":{}}', 'utf8')
    const { html: uploadHtml, bundlePath } = buildProductionViewer(buildViewerSrc())
    const dep = deployUploadPack(uploadDir, uploadHtml, { uploadAssets: false, uploadPrune: true })
    assert.equal(dep.ok, true)
    assert.equal(fs.existsSync(path.join(uploadDir, 'craft-999')), false)
    assert.deepEqual(dep.pruned, ['craft-999'])
    assert.deepEqual(orphanUploadExhibits(uploadDir), [])
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('promoteUploadStaging backup cleanup failure still succeeds', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    fs.mkdirSync(uploadDir, { recursive: true })
    fs.writeFileSync(path.join(uploadDir, 'marker.txt'), 'live', 'utf8')
    const staging = prepareUploadStaging(uploadDir)
    fs.writeFileSync(path.join(staging, 'marker.txt'), 'new', 'utf8')
    const out = promoteUploadStaging(staging, uploadDir, {
      rmSync() { throw new Error('injected backup rm failure') },
    })
    assert.equal(out.ok, true)
    assert.equal(fs.readFileSync(path.join(uploadDir, 'marker.txt'), 'utf8'), 'new')
    assert.ok(out.cleanupWarning)
    assert.ok(fs.existsSync(out.backupPreserved))
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('createModelLoadTimers idle resets on progress', async () => {
  let idleFires = 0
  const timers = createModelLoadTimers({
    idleMs: 80,
    totalMs: 5000,
    onIdle: () => { idleFires++ },
  })
  timers.start()
  for (let i = 1; i <= 5; i++) {
    timers.progress(i * 100, 500)
    await sleep(50)
  }
  timers.clear()
  assert.equal(idleFires, 0, 'progress bumps should prevent idle timeout')
})

test('createModelLoadTimers fires idle when stalled', async () => {
  let idleFires = 0
  const timers = createModelLoadTimers({
    idleMs: 40,
    totalMs: 5000,
    onIdle: () => { idleFires++ },
  })
  timers.start()
  timers.progress(100, 1000)
  await sleep(100)
  timers.clear()
  assert.equal(idleFires, 1)
})

test('createModelLoadTimers does not idle before first progress', async () => {
  let idleFires = 0
  const timers = createModelLoadTimers({
    idleMs: 40,
    totalMs: 5000,
    onIdle: () => { idleFires++ },
  })
  timers.start()
  await sleep(100)
  timers.clear()
  assert.equal(idleFires, 0)
})

test('createModelLoadTimers clears idle after download complete', async () => {
  let idleFires = 0
  const timers = createModelLoadTimers({
    idleMs: 40,
    totalMs: 5000,
    onIdle: () => { idleFires++ },
    onDownloadComplete: () => {},
  })
  timers.start()
  timers.progress(500, 1000)
  timers.progress(1000, 1000)
  assert.equal(timers.isDownloadComplete(), true)
  await sleep(100)
  timers.clear()
  assert.equal(idleFires, 0, 'idle must not fire during decode after download complete')
})

test('createModelLoadTimers skips idle when Content-Length unknown', async () => {
  let idleFires = 0
  const timers = createModelLoadTimers({
    idleMs: 40,
    totalMs: 5000,
    onIdle: () => { idleFires++ },
  })
  timers.start()
  timers.progress(1000, 0)
  timers.progress(5000, 0)
  assert.equal(timers.isLengthUnknown(), true)
  await sleep(100)
  timers.clear()
  assert.equal(idleFires, 0, 'unknown total must not use download idle timer')
})

test('createModelLoadTimers total still fires after download complete', async () => {
  let totalFires = 0
  const timers = createModelLoadTimers({
    idleMs: 5000,
    totalMs: 60,
    onTotal: () => { totalFires++ },
  })
  timers.start()
  timers.progress(100, 100)
  await sleep(100)
  timers.clear()
  assert.equal(totalFires, 1)
})

test('configTimeoutMs falls back to bootTimeoutMs', () => {
  assert.equal(configTimeoutMs(null, { bootTimeoutMs: 9000 }, null), 9000)
  assert.equal(configTimeoutMs({ performance: { configTimeoutMs: 3000 } }, { bootTimeoutMs: 9000 }, null), 3000)
})

test('modelIdleTimeoutMs defaults to 20s', () => {
  assert.equal(modelIdleTimeoutMs(null, null, null), 20000)
})

test('collectModuleGraph fails when player.bundle.js missing', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-orbit-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    initUploadVendor(uploadDir)
    const { html } = buildProductionViewer(buildViewerSrc())
    fs.writeFileSync(path.join(uploadDir, 'player.view.html'), html, 'utf8')
    const missing = collectModuleGraph(path.join(uploadDir, 'player.view.html'), uploadDir)
    assert.deepEqual(missing, [VIEWER_BUNDLE_FILE])
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('--upload runtime deps fail without vendor', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sy-upload-'))
  try {
    const uploadDir = path.join(tmp, 'exhibits-upload')
    fs.mkdirSync(uploadDir, { recursive: true })
    for (const [srcName, dstName] of UPLOAD_JS_COPIES) {
      fs.copyFileSync(path.join(ROOT, srcName), path.join(uploadDir, dstName))
    }
    const { html: uploadHtml, bundlePath } = buildProductionViewer(buildViewerSrc())
    fs.writeFileSync(path.join(uploadDir, 'player.view.html'), uploadHtml, 'utf8')
    fs.copyFileSync(bundlePath, path.join(uploadDir, VIEWER_BUNDLE_FILE))
    const runtimeMissing = checkUploadRuntimeDeps(uploadDir, path.join(uploadDir, 'player.view.html'))
    assert.ok(runtimeMissing.some(m => m.includes('vendor/three.module.js')))
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('patchExhibitIndexTitle uses config zh title', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'craft-001/config.json'), 'utf8'))
  const srcIdx = fs.readFileSync(path.join(ROOT, 'craft-001/index.html'), 'utf8')
  const out = patchExhibitIndexTitle(srcIdx, exhibitTitleFromCfg(cfg))
  assert.match(out, new RegExp(`<title>${escapeRegex(cfg.i18n.zh.title)} · 立体鉴赏</title>`))
})

test('viewer output imports boot timeouts from player-persist', () => {
  const view = buildViewerSrc()
  assert.match(view, /import \{[^}]+\} from '\.\/player-persist\.mjs'/)
  assert.match(view, /configFetchUrl, configTimeoutMs, modelIdleTimeoutMs, modelTotalTimeoutMs, panoramaRevealTimeoutMs, fitCameraDistance, portraitFillTarget, shouldAutoFitCamera, createModelLoadTimers/)
  assert.match(view, /strictWebKitPanoramaMaxWidth, DEFAULT_STRICT_WEBKIT_PANORAMA_MAX_WIDTH/)
  assert.doesNotMatch(view, /applyExposureToCfg/)
  assert.doesNotMatch(view, /configExportFilename/)
})

test('viewer output imports every light-rig symbol it uses', () => {
  const view = buildViewerSrc()
  const imp = view.match(/import \{([^}]+)\} from '\.\/light-rig\.mjs'/)
  assert.ok(imp, 'viewer must import light-rig.mjs')
  const imported = new Set(imp[1].split(',').map(s => s.trim()))
  const body = view.replace(/import \{[^}]+\} from '\.\/light-rig\.mjs'/, '')
  const rigSrc = fs.readFileSync(path.join(ROOT, 'light-rig.mjs'), 'utf8')
  const exported = [...rigSrc.matchAll(/^export (?:const|function) (\w+)/gm)].map(m => m[1])
  for (const sym of exported) {
    if (new RegExp(`\\b${sym}\\b`).test(body)) {
      assert.ok(imported.has(sym), `viewer uses ${sym} but import omits it`)
    }
  }
})

test('editor preset row uses dedicated label/actions classes', () => {
  const html = fs.readFileSync(path.join(ROOT, 'player.html'), 'utf8')
  assert.match(html, /\.ed-label \{ white-space:nowrap/)
  assert.match(html, /\.ed-preset-name \{[^}]*text-overflow:ellipsis/)
  assert.match(html, /class="ed-preset-name"/)
  assert.match(html, /class="ed-preset-actions"/)
  assert.doesNotMatch(html, /\.ed-row > span \{ white-space:nowrap/)
})

runTests()
