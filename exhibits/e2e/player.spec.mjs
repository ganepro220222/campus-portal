import { test, expect } from '@playwright/test'
import {
  gotoPlayer, reloadPlayer, openFirstHotspot, openFirstHotspotNoWait, closeHotspotIfOpen,
  calloutSnapshot, dragState, editCalloutUiState, parseLeaderPoints, segmentCount,
  gotoViewerReady,
  viewerPendingEscapeSync,
} from './helpers.mjs'

const PANEL_STYLES = ['solid', 'glass', 'transparent', 'outline', 'ribbon', 'minimal']

/** 3D 相关用例串行 + 复用同一 page，避免重复冷启动 */
test.describe.configure({ mode: 'serial', timeout: 180_000 })

let page

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  await gotoPlayer(page, { mode: 'edit' })
})

test.afterAll(async () => {
  await page?.close()
})

test.describe('viewport breakpoint 720px', () => {
  for (const w of [719, 720, 721]) {
    test(`width ${w}px leader visibility`, async () => {
      await closeHotspotIfOpen(page)
      await reloadPlayer(page, { viewport: { width: w, height: 700 } })
      await openFirstHotspot(page)
      const svgHidden = await page.evaluate(() => document.getElementById('hs-svg')?.hasAttribute('hidden'))
      if (w <= 720) expect(svgHidden).toBe(true)
      else expect(svgHidden).toBe(false)
    })
  }
})

test.describe('leader modes (desktop)', () => {
  test('orthogonal L-shape', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, {
      viewport: { width: 900, height: 700 },
      panel: { leader: 'elbow', elbowMode: 'orthogonal', leg1Axis: 'auto' },
    })
    await openFirstHotspot(page)
    const snap = await calloutSnapshot(page)
    expect(snap).toBeTruthy()
    expect(snap.svgHidden).toBe(false)
    expect(segmentCount(snap.points)).toBe(2)
    expect(parseLeaderPoints(snap.points).length).toBe(3)
  })

  test('straight line', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, { panel: { leader: 'straight' } })
    await openFirstHotspot(page)
    const snap = await calloutSnapshot(page)
    expect(segmentCount(snap.points)).toBe(1)
    await expect(page.locator('#hs-leader')).toHaveClass(/straight/)
  })

  test('leg1-lock elbow', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, {
      panel: { leader: 'elbow', elbowMode: 'leg1-lock', leg1Axis: 'h', leaderGap: 48 },
    })
    await openFirstHotspot(page)
    expect(segmentCount((await calloutSnapshot(page)).points)).toBe(2)
  })

  test('leg2-lock elbow', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, {
      panel: { leader: 'elbow', elbowMode: 'leg2-lock', leg2Axis: 'v', leaderTail: 40 },
    })
    await openFirstHotspot(page)
    expect(segmentCount((await calloutSnapshot(page)).points)).toBe(2)
  })
})

test.describe('edit drag state', () => {
  test('lostpointercapture ends knee drag', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, {
      panel: { leader: 'elbow', elbowMode: 'leg1-lock', leg1Axis: 'h', leaderGap: 48 },
    })
    await openFirstHotspot(page)
    const knee = await page.evaluate(() => {
      const pts = document.getElementById('hs-leader')?.getAttribute('points') || ''
      const parts = pts.trim().split(/\s+/)
      if (parts.length < 2) return null
      const [x, y] = parts[1].split(',').map(Number)
      return { x, y }
    })
    expect(knee).toBeTruthy()
    await page.mouse.move(knee.x, knee.y)
    await page.mouse.down()
    await expect.poll(async () => (await dragState(page)).kneeDrag, { timeout: 5_000 }).toBe(true)
    await page.mouse.move(knee.x + 30, knee.y)
    const mid = await calloutSnapshot(page)
    await page.evaluate(() => {
      document.getElementById('hs-svg')?.dispatchEvent(
        new PointerEvent('lostpointercapture', { bubbles: true, pointerId: 1 }))
    })
    await page.mouse.up()
    expect(await dragState(page)).toEqual({ kneeDrag: false, panelDrag: false })
    await page.mouse.move(knee.x + 80, knee.y + 40)
    await page.waitForTimeout(200)
    const midPts = parseLeaderPoints(mid.points)
    const afterPts = parseLeaderPoints((await calloutSnapshot(page)).points)
    expect(afterPts[1]?.x).toBeCloseTo(midPts[1]?.x ?? 0, 0)
    expect(afterPts[1]?.y).toBeCloseTo(midPts[1]?.y ?? 0, 0)
  })

  test('closeHotspot clears drag and reopen works', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page)
    await openFirstHotspot(page)
    const started = await page.evaluate(() => window.__SY_TEST__?.startPanelDragTest())
    expect(started).toBe(true)
    expect(await dragState(page)).toEqual({ kneeDrag: false, panelDrag: true })
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => !document.getElementById('card')?.classList.contains('show'), null, { timeout: 5_000 })
    expect(await dragState(page)).toEqual({ kneeDrag: false, panelDrag: false })
    await openFirstHotspot(page)
    expect((await calloutSnapshot(page)).cardShow).toBe(true)
  })

  test('closeHotspotIfOpen clears state without reload', async () => {
    await openFirstHotspot(page)
    expect((await calloutSnapshot(page)).cardShow).toBe(true)
    await closeHotspotIfOpen(page)
    expect(await page.evaluate(() => document.getElementById('card')?.classList.contains('show'))).toBe(false)
    expect(await page.evaluate(() => document.getElementById('hs-svg')?.hasAttribute('hidden'))).toBe(true)
    expect(await page.evaluate(() => document.querySelectorAll('.hs.active').length)).toBe(0)
    expect(await dragState(page)).toEqual({ kneeDrag: false, panelDrag: false })
  })

  test('rotate button clears panel drag and edit UI', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, { viewport: { width: 900, height: 700 } })
    await openFirstHotspot(page)
    expect(await page.evaluate(() => window.__SY_TEST__?.startPanelDragTest())).toBe(true)
    expect(await dragState(page)).toEqual({ kneeDrag: false, panelDrag: true })
    await page.locator('[data-k="rotate"]').click()
    await page.waitForFunction(() => !document.getElementById('card')?.classList.contains('show'), null, { timeout: 5_000 })
    expect(await dragState(page)).toEqual({ kneeDrag: false, panelDrag: false })
    expect(await editCalloutUiState(page)).toMatchObject({
      cardShow: false,
      svgHidden: true,
      kneeHidden: true,
      edMovable: false,
      editCallout: false,
      editCalloutKnee: false,
      activeHs: 0,
    })
    expect(await page.evaluate(() => window.__SY_TEST__?.isAutoRotating())).toBe(true)
    await openFirstHotspot(page)
    expect((await calloutSnapshot(page)).cardShow).toBe(true)
  })
})

test.describe('panel stability during model rotation', () => {
  test('card position changes smoothly while auto-rotating', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, {
      panel: { elbowMode: 'orthogonal' },
      camera: { autoRotate: true },
    })
    await openFirstHotspot(page)
    await page.evaluate(() => window.__SY_TEST__?.setAutoRotate(true))
    expect(await page.evaluate(() => window.__SY_TEST__?.isAutoRotating())).toBe(true)
    await page.waitForTimeout(400)
    const samples = []
    const dotSamples = []
    for (let i = 0; i < 6; i++) {
      const s = await calloutSnapshot(page)
      samples.push({ x: s.cardX, y: s.cardY })
      dotSamples.push(await page.evaluate(() => ({
        x: parseFloat(document.getElementById('hs-dot')?.getAttribute('cx') || '0'),
        y: parseFloat(document.getElementById('hs-dot')?.getAttribute('cy') || '0'),
      })))
      await page.waitForTimeout(300)
    }
    let maxJump = 0
    for (let i = 1; i < samples.length; i++) {
      maxJump = Math.max(maxJump, Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y))
    }
    let dotMove = 0
    for (let i = 1; i < dotSamples.length; i++) {
      dotMove = Math.max(dotMove, Math.hypot(dotSamples[i].x - dotSamples[i - 1].x, dotSamples[i].y - dotSamples[i - 1].y))
    }
    expect(maxJump).toBeLessThan(120)
    expect(dotMove).toBeGreaterThan(0.1)
  })
})

test.describe('card show timer race', () => {
  async function assertHotspotStaysClosed(page, { edit = true, waitMs = 300 } = {}) {
    await page.waitForTimeout(waitMs)
    expect(await page.evaluate(() => document.getElementById('card')?.classList.contains('show'))).toBe(false)
    expect(await page.evaluate(() => document.getElementById('hs-svg')?.hasAttribute('hidden'))).toBe(true)
    expect(await page.evaluate(() => document.querySelectorAll('.hs.active').length)).toBe(0)
    if (edit) {
      expect(await page.evaluate(() => window.__SY_TEST__?.isHotspotOpen?.() ?? false)).toBe(false)
      expect(await page.evaluate(() => window.__SY_TEST__?.isCardShowPending?.() ?? false)).toBe(false)
    }
  }

  test('desktop Escape before show delay does not flash card back', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, { viewport: { width: 900, height: 700 } })
    const r = await page.evaluate(() => window.__SY_TEST__.openPendingAndAct('escape'))
    expect(r.ok).toBe(true)
    expect(r.before).toEqual({ open: true, pending: true, show: false })
    await assertHotspotStaysClosed(page)
  })

  test('desktop rotate before show delay does not flash card back', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, { viewport: { width: 900, height: 700 } })
    const r = await page.evaluate(() => window.__SY_TEST__.openPendingAndAct('rotate'))
    expect(r.ok).toBe(true)
    expect(r.before.pending).toBe(true)
    await assertHotspotStaysClosed(page)
    expect(await page.evaluate(() => window.__SY_TEST__?.isAutoRotating())).toBe(true)
  })

  test('mobile Escape before show delay does not flash card back', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, { viewport: { width: 719, height: 700 } })
    const r = await page.evaluate(() => window.__SY_TEST__.openPendingAndAct('escape'))
    expect(r.ok).toBe(true)
    expect(r.before.pending).toBe(true)
    await assertHotspotStaysClosed(page, { waitMs: 150 })
  })

  test('desktop reset before show delay closes pending hotspot', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, { viewport: { width: 900, height: 700 } })
    const r = await page.evaluate(() => window.__SY_TEST__.openPendingAndAct('reset'))
    expect(r.ok).toBe(true)
    await assertHotspotStaysClosed(page)
  })

  test('desktop hide-hotspots before show delay closes pending hotspot', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, { viewport: { width: 900, height: 700 } })
    const r = await page.evaluate(() => window.__SY_TEST__.openPendingAndAct('hideHot'))
    expect(r.ok).toBe(true)
    await assertHotspotStaysClosed(page)
  })

  test('pending panel style preview matches each selection', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, { viewport: { width: 900, height: 700 } })
    for (const style of PANEL_STYLES) {
      const applied = await page.evaluate(s => window.__SY_TEST__.applyPanelStyleWhilePending(s), style)
      expect(applied.ok, applied.reason || '').toBe(true)
      expect(applied.pending).toBe(true)
      expect(applied.classes).toContain(`st-${style}`)
      for (const other of PANEL_STYLES.filter(x => x !== style)) {
        expect(applied.classes).not.toContain(`st-${other}`)
      }
      await page.waitForFunction(() => document.getElementById('card')?.classList.contains('show'), null, { timeout: 5_000 })
      const final = await page.evaluate(() => [...document.getElementById('card').classList])
      expect(final).toContain(`st-${style}`)
      await page.evaluate(() => window.__SY_TEST__.closeHotspot())
      await page.waitForFunction(() => !document.getElementById('card')?.classList.contains('show'))
    }
  })

  test('pending hotspot rebuild rebinds without stale card flash', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, { viewport: { width: 900, height: 700 } })
    const rebuilt = await page.evaluate(() => {
      if (!window.__SY_TEST__.openHotspotByIndex(0)) return { ok: false, reason: 'open-failed' }
      if (!window.__SY_TEST__.isCardShowPending()) return { ok: false, reason: 'not-pending' }
      return { ok: true, ...window.__SY_TEST__.rebuildHotspotsWhileOpen() }
    })
    expect(rebuilt.ok, rebuilt.reason || '').toBe(true)
    expect(rebuilt.wasPending).toBe(true)
    expect(rebuilt.open).toBe(true)
    expect(rebuilt.pending).toBe(true)
    expect(rebuilt.activeCount).toBe(1)
    expect(rebuilt.show).toBe(false)
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => document.getElementById('card')?.classList.contains('show'))).toBe(true)
    expect(await page.evaluate(() => document.querySelectorAll('.hs.active').length)).toBe(1)
  })

  test('pending delete rebuild keeps hotspot closed', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, { viewport: { width: 900, height: 700 } })
    const ok = await page.evaluate(() => {
      if (!window.__SY_TEST__.openHotspotByIndex(0)) return false
      if (!window.__SY_TEST__.isCardShowPending()) return false
      return window.__SY_TEST__.deleteHotspotByIndex(0)
    })
    expect(ok).toBe(true)
    await assertHotspotStaysClosed(page)
  })

  test('delete non-tail hotspot then add keeps unique ids and rebinds on rebuild', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, { viewport: { width: 900, height: 700 } })
    const result = await page.evaluate(() => {
      window.__SY_TEST__.setupHotspotsForIdTest()
      window.__SY_TEST__.deleteHotspotByIndex(0)
      const afterAdd = window.__SY_TEST__.addHotspotForIdTest('新H3')
      const ids = afterAdd.map(h => h.id)
      if (new Set(ids).size !== ids.length) return { ok: false, reason: 'duplicate-ids', ids }
      const newHs = afterAdd.find(h => h.title === '新H3')
      if (!newHs || !window.__SY_TEST__.openHotspotById(newHs.id)) return { ok: false, reason: 'open-failed', ids }
      const beforeRebuild = window.__SY_TEST__.activeHotspotSnapshot()
      window.__SY_TEST__.triggerHotspotStyleRebuild()
      const afterRebuild = window.__SY_TEST__.activeHotspotSnapshot()
      return {
        ok: true, ids, beforeRebuild, afterRebuild,
        activeCount: document.querySelectorAll('.hs.active').length,
      }
    })
    expect(result.ok, result.reason || '').toBe(true)
    expect(result.beforeRebuild.title).toBe('新H3')
    expect(result.afterRebuild.title).toBe('新H3')
    expect(result.afterRebuild.id).toBe(result.beforeRebuild.id)
    expect(result.afterRebuild.cardTitle).toBe('新H3')
    expect(result.activeCount).toBe(1)
  })

  test('duplicate id config rebinds opened hotspot not first match', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, { viewport: { width: 900, height: 700 } })
    const result = await page.evaluate(() => {
      window.__SY_TEST__.setupHotspotsForIdTest()
      window.__SY_TEST__.simulateDuplicateIdHotspot()
      if (!window.__SY_TEST__.openHotspotByTitle('新H3-dup')) return { ok: false, reason: 'open-failed' }
      const before = window.__SY_TEST__.activeHotspotSnapshot()
      window.__SY_TEST__.triggerHotspotStyleRebuild()
      const after = window.__SY_TEST__.activeHotspotSnapshot()
      return { ok: true, before, after, activeCount: document.querySelectorAll('.hs.active').length }
    })
    expect(result.ok, result.reason || '').toBe(true)
    expect(result.before.title).toBe('新H3-dup')
    expect(result.after.title).toBe('新H3-dup')
    expect(result.after.cardTitle).toBe('新H3-dup')
    expect(result.activeCount).toBe(1)
  })

  test('legacy hotspot without id rebinds by data reference on rebuild', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, { viewport: { width: 900, height: 700 } })
    const result = await page.evaluate(() => {
      window.__SY_TEST__.setupLegacyNoIdHotspot()
      if (!window.__SY_TEST__.openHotspotByIndex(0)) return { ok: false, reason: 'open-failed' }
      const before = window.__SY_TEST__.activeHotspotSnapshot()
      window.__SY_TEST__.triggerHotspotStyleRebuild()
      const after = window.__SY_TEST__.activeHotspotSnapshot()
      return { ok: true, before, after, activeCount: document.querySelectorAll('.hs.active').length }
    })
    expect(result.ok, result.reason || '').toBe(true)
    expect(result.before.title).toBe('Legacy')
    expect(result.after.title).toBe('Legacy')
    expect(result.after.cardTitle).toBe('Legacy')
    expect(result.activeCount).toBe(1)
  })
})

test.describe('viewer rotate button', () => {
  test('closes open hotspot without edit drag hooks', async ({ browser }) => {
    const vpage = await browser.newPage()
    await gotoViewerReady(vpage, { viewport: { width: 900, height: 700 } })
    await openFirstHotspot(vpage)
    expect((await calloutSnapshot(vpage))?.cardShow).toBe(true)
    await vpage.locator('[data-k="rotate"]').click()
    await vpage.waitForFunction(() => !document.getElementById('card')?.classList.contains('show'), null, { timeout: 5_000 })
    expect(await vpage.evaluate(() => document.getElementById('hs-svg')?.hasAttribute('hidden'))).toBe(true)
    expect(await vpage.evaluate(() => document.querySelectorAll('.hs.active').length)).toBe(0)
    expect(await vpage.evaluate(() => document.querySelector('[data-k="rotate"]')?.classList.contains('on'))).toBe(true)
    await vpage.close()
  })

  test('closes hotspot opened during show delay (race)', async ({ browser }) => {
    const vpage = await browser.newPage()
    await gotoViewerReady(vpage, { viewport: { width: 900, height: 700 } })
    const r = await viewerPendingEscapeSync(vpage)
    expect(r.ok).toBe(true)
    await vpage.waitForTimeout(300)
    expect(await vpage.evaluate(() => document.getElementById('card')?.classList.contains('show'))).toBe(false)
    expect(await vpage.evaluate(() => document.getElementById('hs-svg')?.hasAttribute('hidden'))).toBe(true)
    expect(await vpage.evaluate(() => document.querySelectorAll('.hs.active').length)).toBe(0)
    await vpage.close()
  })
})
