import { test, expect } from '@playwright/test'
import {
  gotoPlayerLight, gotoViewerReady, resolveGeom, renderHiddenOverlapInPlayer,
  HIDDEN_OVERLAP_GEOM, openFirstHotspot, calloutSnapshot, segmentCount,
} from './helpers.mjs'

const CRAFTS = ['craft-001', 'craft-002', 'craft-003', 'craft-004']

test.describe('public entry (fast)', () => {
  for (const dir of CRAFTS) {
    test(`${dir}/ redirects to player.view.html without mode`, async ({ page }) => {
      await page.goto(`/${dir}/`, { waitUntil: 'commit' })
      await page.waitForURL(/player\.view\.html\?ex=/, { timeout: 10_000 })
      expect(page.url()).toContain(`player.view.html?ex=${dir}`)
      expect(page.url()).not.toContain('mode=edit')
      expect(page.url()).not.toContain('player.html')
    })
  }

  test('player.view.html?mode=edit boots viewer and hides editor', async ({ page }) => {
    await gotoViewerReady(page, { mode: 'edit', viewport: { width: 900, height: 700 } })

    await expect(page.locator('#loading')).toHaveAttribute('hidden', '')
    await expect(page.locator('#error')).toHaveAttribute('hidden', '')
    await expect(page.locator('#topbar')).not.toHaveAttribute('hidden', '')
    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(page.locator('#hs-layer .hs')).not.toHaveCount(0)
    await expect(page.locator('#editor')).toHaveCount(0)
    await expect(page.locator('#ed-badge')).toHaveCount(0)

    const flags = await page.evaluate(() => ({
      editMode: /const editMode = false \/\* viewer-only \*\//.test(document.documentElement.innerHTML),
      testHook: window.__SY_TEST__ == null,
    }))
    expect(flags.editMode).toBe(true)
    expect(flags.testHook).toBe(true)

    await openFirstHotspot(page)
    const snap = await calloutSnapshot(page)
    expect(snap?.cardShow).toBe(true)
    expect(snap?.svgHidden).toBe(false)
    expect(segmentCount(snap?.points || '')).toBeGreaterThan(0)
  })
})

test.describe('geometry fallback (in-browser, no 3D)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPlayerLight(page)
  })

  test('panel-overlap straight fallback has positive length', async ({ page }) => {
    const r = await resolveGeom(page, {
      mx: 50, my: 80, cw: 500, ch: 400, cardX: 200, cardY: 200,
      panel: { elbowMode: 'orthogonal' },
      vp: { minX: 8, minY: 66, maxX: 8, maxY: 66, relaxedMaxX: 8 },
    })
    expect(r.meta.leaderFallback).toBe('panel-overlap')
    expect(r.meta.l1).toBeGreaterThan(4)
    expect(r.pts.length).toBe(2)
    const dx = r.pts[1][0] - r.pts[0][0], dy = r.pts[1][1] - r.pts[0][1]
    expect(Math.hypot(dx, dy)).toBeGreaterThan(4)
  })

  test('hidden-overlap when edge anchor degenerates', async ({ page }) => {
    const r = await resolveGeom(page, HIDDEN_OVERLAP_GEOM)
    expect(r.meta.leaderFallback).toBe('hidden-overlap')
    expect(r.meta.leaderHidden).toBe(true)
    expect(r.pts.length).toBe(1)
    expect(r.meta.l1).toBe(0)
  })

  test('hidden-overlap clears #hs-leader via production renderLeaderElement', async ({ page }) => {
    await gotoPlayerLight(page, { mode: 'edit', viewport: { width: 900, height: 700 } })
    const dom = await renderHiddenOverlapInPlayer(page)
    expect(dom.leaderFallback).toBe('hidden-overlap')
    expect(dom.leaderHidden).toBe(true)
    expect(dom.points).toBe('')
    await expect(page.locator('#hs-leader')).toHaveAttribute('points', '')
  })
})
