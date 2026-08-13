import { test, expect } from '@playwright/test'
import {
  gotoPlayer, reloadPlayer, openFirstHotspot, openFirstHotspotNoWait, closeHotspotIfOpen,
  calloutSnapshot, dragState, editCalloutUiState, parseLeaderPoints, segmentCount,
  gotoViewerReady, releaseWebGL, injectCfg, waitForPlayerReady,
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
  await releaseWebGL(page)
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
    await expect.poll(async () => page.evaluate(() => window.__SY_TEST__?.startKneeDragTest()), { timeout: 5_000 }).toBe(true)
    expect(await dragState(page)).toEqual({ kneeDrag: true, panelDrag: false })
    expect(await page.evaluate(() => window.__SY_TEST__?.nudgeKneeDragTest(30, 0))).toBe(true)
    await page.evaluate(() => window.__SY_TEST__?.settleLeaderAnim())
    const midKnee = await page.evaluate(() => window.__SY_TEST__?.leaderKneeSnapshot())
    expect(midKnee).toBeTruthy()
    await page.evaluate(() => {
      document.getElementById('hs-svg')?.dispatchEvent(
        new PointerEvent('lostpointercapture', { bubbles: true, pointerId: 1 }))
    })
    expect(await dragState(page)).toEqual({ kneeDrag: false, panelDrag: false })
    expect(await page.evaluate(() => window.__SY_TEST__?.nudgeKneeDragTest(50, 40))).toBe(false)
    await page.evaluate(() => window.__SY_TEST__?.settleLeaderAnim())
    const afterKnee = await page.evaluate(() => window.__SY_TEST__?.leaderKneeSnapshot())
    expect(afterKnee[0]).toBeCloseTo(midKnee[0], 1)
    expect(afterKnee[1]).toBeCloseTo(midKnee[1], 1)
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
    await page.waitForFunction(() => document.getElementById('card')?.classList.contains('show'), null, { timeout: 5_000 })
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

  test('editor validate report retains boot-time invalid hotspot id diagnostics', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, {
      viewport: { width: 900, height: 700 },
      hotspots: [
        { id: 1, position: [0, 1, 0], i18n: { zh: { title: 'A', content: 'a' } } },
        { id: true, position: [0.2, 1, 0], i18n: { zh: { title: 'B', content: 'b' } } },
        { id: 'h1', position: [0.4, 1, 0], i18n: { zh: { title: 'C', content: 'c' } } },
      ],
    })
    const report = await page.evaluate(() => window.__SY_TEST__.validateReportText())
    const diag = await page.evaluate(() => window.__SY_TEST__.hotspotIdBootDiagnostics())
    expect(report).toContain('加载时发现热点 id 类型非法')
    expect(report).toContain('加载时已自动修正')
    expect(report).toContain('热点 id 唯一（加载后已修正）')
    expect(diag.hadIssues).toBe(true)
    expect(diag.invalidCount).toBe(2)
    expect(diag.changeCount).toBeGreaterThan(0)
  })

  test('editor validate report shows duplicate and missing boot summaries together', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, {
      viewport: { width: 900, height: 700 },
      hotspots: [
        { id: 'h1', position: [0, 1, 0], i18n: { zh: { title: 'A', content: 'a' } } },
        { id: 'h1', position: [0.2, 1, 0], i18n: { zh: { title: 'B', content: 'b' } } },
        { id: null, position: [0.4, 1, 0], i18n: { zh: { title: 'C', content: 'c' } } },
      ],
    })
    const report = await page.evaluate(() => window.__SY_TEST__.validateReportText())
    expect(report).toContain('加载时发现热点 id 重复')
    expect(report).toContain('加载时发现热点缺 id')
  })
})

test.describe('editor preset row layout', () => {
  const LONG_PRESET = '夜间博物馆展柜暖色重点照明与低环境光展示方案'

  test('long preset name keeps actions inside editor', async () => {
    await reloadPlayer(page, {
      presets: [{
        id: 'long-preset',
        label: { zh: LONG_PRESET, en: 'Long preset name' },
        exposure: 1.05,
        envMapIntensity: 1.35,
        background: '#0f1118',
        showAsButton: true,
      }],
    })
    const presetSec = page.locator('#editor details').filter({ has: page.locator('summary', { hasText: '预设' }) })
    await presetSec.locator('summary').click()
    const actions = presetSec.locator('.ed-preset-actions').first()
    const checkbox = actions.locator('input[type=checkbox]')
    await expect(actions).toBeVisible()
    await expect(checkbox).toBeVisible()

    const layout = await page.evaluate(() => {
      const editor = document.getElementById('editor')
      const actionsEl = document.querySelector('.ed-preset-actions')
      const nameEl = document.querySelector('.ed-preset-name')
      if (!editor || !actionsEl || !nameEl) return null
      const eb = editor.getBoundingClientRect()
      const ab = actionsEl.getBoundingClientRect()
      const cs = getComputedStyle(nameEl)
      return {
        editorRight: eb.right,
        actionsRight: ab.right,
        actionsLeft: ab.left,
        textOverflow: cs.textOverflow,
        scrollOverflow: nameEl.scrollWidth > nameEl.clientWidth,
      }
    })
    expect(layout).toBeTruthy()
    expect(layout.actionsRight).toBeLessThanOrEqual(layout.editorRight + 1)
    expect(layout.actionsLeft).toBeGreaterThan(layout.editorRight - 280)
    expect(layout.textOverflow).toBe('ellipsis')
    expect(layout.scrollOverflow).toBe(true)

    await expect(checkbox).toBeChecked()
    await checkbox.click()
    await expect(checkbox).not.toBeChecked()
    await checkbox.click()
    await expect(checkbox).toBeChecked()
  })
})

test.describe('editor model URL load', () => {
  async function openEditorSection(page, title) {
    await page.evaluate(t => {
      for (const d of document.querySelectorAll('#editor details.ed-sec')) {
        const s = d.querySelector('summary')?.textContent || ''
        if (s.includes(t)) { d.open = true; break }
      }
    }, title)
  }

  test('failed URL load does not mutate cfg.assets.model', async () => {
    await closeHotspotIfOpen(page)
    await openEditorSection(page, '资产')
    const saved = await page.evaluate(() => window.__SY_TEST__.modelConfig())
    expect(saved).toBeTruthy()
    page.once('dialog', d => d.accept())
    await page.fill('#ed-url', 'assets/__missing_model_test__.glb')
    await page.click('#ed-url-load')
    await page.waitForFunction(() => !document.getElementById('ed-url-load')?.disabled, null, { timeout: 30_000 })
    expect(await page.evaluate(() => window.__SY_TEST__.modelConfig())).toBe(saved)
  })

  test('out-of-order model loads keep latest config and scene', async () => {
    await page.evaluate(() => window.__SY_TEST__.enableModelLoadMock())
    await page.evaluate(() => {
      window.__SY_TEST__.queueModelLoadFromEditor('mock://b', 'assets/model-b.glb', 'B')
      window.__SY_TEST__.queueModelLoadFromEditor('mock://c', 'assets/model-c.glb', 'C')
    })
    expect(await page.evaluate(() => window.__SY_TEST__.resolveModelLoadMock('C'))).toBe(true)
    await page.waitForTimeout(50)
    expect(await page.evaluate(() => window.__SY_TEST__.resolveModelLoadMock('B'))).toBe(true)
    await page.waitForTimeout(50)
    const st = await page.evaluate(() => ({
      cfg: window.__SY_TEST__.modelConfig(),
      tag: window.__SY_TEST__.modelSceneTag(),
    }))
    expect(st.cfg).toBe('assets/model-c.glb')
    expect(st.tag).toBe('C')
    await page.evaluate(() => window.__SY_TEST__.disableModelLoadMock())
    await reloadPlayer(page, { mode: 'edit' })
  })

  test('stale failed load does not overwrite newer successful model', async () => {
    await page.evaluate(() => window.__SY_TEST__.enableModelLoadMock())
    await page.evaluate(() => {
      window.__SY_TEST__.queueModelLoadFromEditor('mock://slow', 'assets/model-slow.glb', 'SLOW')
      window.__SY_TEST__.queueModelLoadFromEditor('mock://fast', 'assets/model-fast.glb', 'FAST')
    })
    expect(await page.evaluate(() => window.__SY_TEST__.resolveModelLoadMock('FAST'))).toBe(true)
    await page.waitForTimeout(50)
    expect(await page.evaluate(() => window.__SY_TEST__.rejectModelLoadMock('SLOW'))).toBe(true)
    await page.waitForTimeout(50)
    const st = await page.evaluate(() => ({
      cfg: window.__SY_TEST__.modelConfig(),
      tag: window.__SY_TEST__.modelSceneTag(),
    }))
    expect(st.cfg).toBe('assets/model-fast.glb')
    expect(st.tag).toBe('FAST')
    await page.evaluate(() => window.__SY_TEST__.disableModelLoadMock())
    await reloadPlayer(page, { mode: 'edit' })
  })

  test('failed panorama URL does not mutate cfg.assets.panorama', async () => {
    await openEditorSection(page, '环境 IBL')
    const saved = await page.evaluate(() => window.__SY_TEST__.panoramaConfig())
    expect(saved).toBeTruthy()
    await page.fill('#ed-pano', 'assets/__missing_pano_test__.jpg')
    await page.click('#ed-pano-load')
    await page.waitForFunction(() => !document.getElementById('ed-pano-load')?.disabled, null, { timeout: 30_000 })
    expect(await page.evaluate(() => window.__SY_TEST__.panoramaConfig())).toBe(saved)
  })

  test('failed local preview keeps modelPreviewOnly false', async () => {
    await openEditorSection(page, '资产')
    expect(await page.evaluate(() => window.__SY_TEST__.modelPreviewOnly())).toBe(false)
    await page.evaluate(() => {
      window.__SY_TEST__.enableModelLoadMock()
      window.__SY_TEST__.queueModelLoadFromEditor('blob:local-fail', null, 'LOCAL_FAIL')
    })
    await page.evaluate(() => window.__SY_TEST__.rejectModelLoadMock('LOCAL_FAIL'))
    await page.waitForTimeout(50)
    expect(await page.evaluate(() => window.__SY_TEST__.modelPreviewOnly())).toBe(false)
    await page.evaluate(() => window.__SY_TEST__.disableModelLoadMock())
  })

  test('duplicate panorama URL shares inflight promise until settle', async () => {
    await openEditorSection(page, '环境 IBL')
    const saved = await page.evaluate(() => window.__SY_TEST__.panoramaConfig())
    const probe = await page.evaluate(async () => {
      window.__SY_TEST__.enablePanoramaLoadMock()
      const p1 = window.__SY_TEST__.panoramaLoadForTest('assets/poster.jpg', { commitUrl: 'assets/poster.jpg' })
      const p2 = window.__SY_TEST__.panoramaLoadForTest('assets/poster.jpg', { commitUrl: 'assets/poster.jpg' })
      return { same: p1 === p2, inflight: window.__SY_TEST__.panoramaInflightUrl() }
    })
    expect(probe.same).toBe(true)
    expect(probe.inflight).toBeTruthy()
    const rejected = await page.evaluate(async () => {
      window.__SY_TEST__.rejectPanoramaLoadMock()
      await new Promise(r => setTimeout(r, 30))
      return window.__SY_TEST__.panoramaConfig()
    })
    expect(rejected).toBe(saved)
    await page.evaluate(() => window.__SY_TEST__.disablePanoramaLoadMock())
  })

  test('relative model URL loads via exhibit asset() prefix', async () => {
    await openEditorSection(page, '资产')
    const seen = []
    await page.route('**/craft-001/assets/model.glb', route => {
      seen.push(route.request().url())
      route.continue()
    })
    await page.fill('#ed-url', 'assets/model.glb')
    await page.click('#ed-url-load')
    await page.waitForFunction(() => !document.getElementById('ed-url-load')?.disabled, null, { timeout: 30_000 })
    expect(seen.some(u => /craft-001\/assets\/model\.glb/.test(u))).toBe(true)
    expect(await page.evaluate(() => window.__SY_TEST__.modelConfig())).toBe('assets/model.glb')
    await page.unroute('**/craft-001/assets/model.glb')
  })

  test('save blocked while local model preview is active', async () => {
    await openEditorSection(page, '资产')
    await page.evaluate(() => {
      window.__SY_TEST__.enableModelLoadMock()
      window.__SY_TEST__.queueModelLoadFromEditor('blob:local-ok', null, 'LOCAL_OK')
    })
    await page.evaluate(() => window.__SY_TEST__.resolveModelLoadMock('LOCAL_OK'))
    await page.waitForTimeout(50)
    expect(await page.evaluate(() => window.__SY_TEST__.modelPreviewOnly())).toBe(true)
    const issues = await page.evaluate(() => window.__SY_TEST__.preSaveIssues())
    expect(issues.errs.some(e => e.includes('本地模型预览'))).toBe(true)
    await page.evaluate(() => window.__SY_TEST__.disableModelLoadMock())
  })

  test('stale model load resolves without applying config', async () => {
    const result = await page.evaluate(async () => {
      window.__SY_TEST__.enableModelLoadMock()
      const pB = window.__SY_TEST__.reloadModelForTest('mock://b', { commitModelPath: 'assets/model-b.glb', loadTag: 'B' })
      const pC = window.__SY_TEST__.reloadModelForTest('mock://c', { commitModelPath: 'assets/model-c.glb', loadTag: 'C' })
      window.__SY_TEST__.resolveModelLoadMock('C')
      await new Promise(r => setTimeout(r, 30))
      window.__SY_TEST__.resolveModelLoadMock('B')
      const [rB, rC] = await Promise.all([pB, pC])
      return { b: rB, c: rC, cfg: window.__SY_TEST__.modelConfig() }
    })
    expect(result.b?.stale).toBe(true)
    expect(result.c?.stale).toBe(false)
    expect(result.cfg).toBe('assets/model-c.glb')
    await page.evaluate(() => window.__SY_TEST__.disableModelLoadMock())
    await reloadPlayer(page, { mode: 'edit' })
  })

  test('craft-001 English copy is not legacy placeholder content', async () => {
    await page.evaluate(() => window.__SY_TEST__.setLangForTest('en'))
    const title = await page.evaluate(() => window.__SY_TEST__.displayTitle())
    expect(title).not.toMatch(/Peony|Enamel Porcelain/i)
    expect(title.length).toBeGreaterThan(3)
    const hs = await page.evaluate(() => {
      const h = (window.__CFG__ || {}).hotspots?.[0]?.i18n?.en
      return { title: h?.title || '', content: h?.content || '' }
    })
    expect(hs.title).not.toMatch(/^New$/i)
    expect(hs.content).not.toMatch(/\(todo\)/i)
    await page.evaluate(() => window.__SY_TEST__.setLangForTest('zh'))
  })
})

test.describe('strict WebKit startup', () => {
  test('WeChat UA defers panorama until model ready', async ({ browser }) => {
    const p = await browser.newPage()
    await p.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', {
        configurable: true,
        get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.42',
      })
    })
    await injectCfg(p)
    await p.setViewportSize({ width: 390, height: 844 })
    await p.goto('/player.html?ex=craft-001&mode=edit', { waitUntil: 'domcontentloaded' })
    await waitForPlayerReady(p)
    const flags = await p.evaluate(() => ({
      strict: window.__SY_TEST__.strictWebKitHost(),
      defer: window.__SY_TEST__.deferPanoramaIBL(),
    }))
    expect(flags.strict).toBe(true)
    expect(flags.defer).toBe(true)
    const st = await p.evaluate(() => window.__SY_TEST__.lightState())
    expect(st.hasEnvMap).toBe(true)
    await releaseWebGL(p)
    await p.close()
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

test.describe('语音播放器 折叠', () => {
  const audioFixture = [{ id: 'a1', src: 'assets/audio.mp3', label: '讲解 1' }]
  const withAudio = (opts = {}) => ({ ...opts, audio: opts.audio ?? audioFixture })

  const st = () => page.evaluate(() => {
    const a = document.getElementById('audio'), r = a.getBoundingClientRect()
    return {
      mini: a.classList.contains('mini'),
      playing: a.classList.contains('playing'),
      w: Math.round(r.width),
      icon: document.getElementById('au-play').textContent,
      aria: document.getElementById('au-play').getAttribute('aria-label'),
      midVisible: getComputedStyle(document.querySelector('.au-mid')).display !== 'none',
    }
  })

  test('桌面默认展开，手机默认收起（auto）', async () => {
    await reloadPlayer(page, withAudio({ viewport: { width: 1100, height: 800 } }))
    await page.waitForSelector('#audio:not([hidden])')
    expect((await st()).mini).toBe(false)

    await reloadPlayer(page, withAudio({ viewport: { width: 390, height: 800 } }))
    await page.waitForSelector('#audio:not([hidden])')
    const m = await st()
    expect(m.mini).toBe(true)
    expect(m.midVisible).toBe(false)
    expect(m.w).toBeLessThan(70)          // 只剩一颗圆钮，不再压住器物
  })

  test('ui.audioCollapsed 显式取值覆盖 auto', async () => {
    await reloadPlayer(page, withAudio({ viewport: { width: 390, height: 800 }, ui: { audioCollapsed: false } }))
    await page.waitForSelector('#audio:not([hidden])')
    expect((await st()).mini).toBe(false)          // 手机上也强制展开

    await reloadPlayer(page, withAudio({ viewport: { width: 1100, height: 800 }, ui: { audioCollapsed: true } }))
    await page.waitForSelector('#audio:not([hidden])')
    expect((await st()).mini).toBe(true)           // 桌面上也强制收起
  })

  test('折叠态点圆钮＝展开，不直接播放（图标也不能是 ▶）', async () => {
    await reloadPlayer(page, withAudio({ viewport: { width: 390, height: 800 } }))
    await page.waitForSelector('#audio:not([hidden])')
    const before = await st()
    expect(before.mini).toBe(true)
    expect(before.icon).not.toBe('▶')             // 折叠时点它不是播放，就不能画成播放
    expect(before.aria).toContain('展开')

    await page.locator('#au-play').click()
    expect((await st()).mini).toBe(false)
    expect(await page.evaluate(() => document.getElementById('au-el').paused)).toBe(true)  // 没有偷偷出声
  })

  test('展开态可收起；播放中收起仍能看出「正在播放」', async () => {
    await reloadPlayer(page, withAudio({ viewport: { width: 1100, height: 800 } }))
    await page.waitForSelector('#audio:not([hidden])')
    await page.evaluate(() => { const el = document.getElementById('au-el'); el.dispatchEvent(new Event('play')) })
    expect((await st()).icon).toBe('❚❚')
    await page.locator('#au-collapse').click()
    const m = await st()
    expect(m.mini).toBe(true)
    expect(m.playing).toBe(true)                  // 圆钮上有描金环
    expect(m.aria).toContain('正在播放')
  })

  test('热点绑定的语音自动播放时，播放器自动展开', async () => {
    const hs = [{ id: 'h1', position: [0, 0.2, 0.6], audio: 'a1', i18n: { zh: { title: '甲', body: '乙' } } }]
    await reloadPlayer(page, withAudio({ viewport: { width: 390, height: 800 }, hotspots: hs }))
    await page.waitForSelector('#audio:not([hidden])')
    expect((await st()).mini).toBe(true)
    await openFirstHotspot(page)
    await expect.poll(async () => (await st()).mini).toBe(false)
  })
})

/* 手机窄屏 HUD：320px 上「自动旋转」四个字曾被压成一字一行，图标与文字还各占一行。
   用 Range.getClientRects() 数真实行数 —— 只看元素高度分不清「两行文字」和「图标在上文字在下」。 */
test.describe('HUD 按钮 窄屏排版', () => {
  const btnLines = () => page.evaluate(() => {
    const lines = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getClientRects().length }
    return [...document.querySelectorAll('#actions .btn, #presets .preset')].map(el => {
      const tx = el.querySelector('.tx') || el
      const b = el.getBoundingClientRect()
      return { t: tx.textContent.trim(), lines: lines(tx), w: Math.round(b.width), right: b.right }
    })
  })

  for (const width of [320, 360, 414]) {
    test(`${width}px：按钮文字一律不折行，且不超出视口`, async () => {
      await reloadPlayer(page, { viewport: { width, height: 780 } })
      await page.waitForSelector('#actions .btn')
      const btns = await btnLines()
      expect(btns.length).toBeGreaterThan(0)
      for (const b of btns) {
        expect(b.lines, `「${b.t}」被折成 ${b.lines} 行`).toBe(1)
        expect(b.right, `「${b.t}」超出视口右边`).toBeLessThanOrEqual(width + 1)
      }
      // 整条工具栏不许把页面撑出横向滚动条
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
    })
  }

  test('≤400px 改为「图标在上、文字在下」；宽屏仍是横排', async () => {
    const dir = () => page.evaluate(() => getComputedStyle(document.querySelector('#actions .btn')).flexDirection)
    await reloadPlayer(page, { viewport: { width: 360, height: 780 } })
    await page.waitForSelector('#actions .btn')
    expect(await dir()).toBe('column')
    await page.setViewportSize({ width: 414, height: 780 })
    expect(await dir()).toBe('row')
  })
})

/* 「· 可拖拽」提示与描边样式的短横曾抢同一个 ::after：描边下提示会继承那条规则的
   absolute + 32×2px，被裁成半行掉到标题底下（用户截图报的就是这个）。 */
test.describe('面板样式 × 编辑态拖拽提示', () => {
  const hint = () => page.evaluate(() => {
    const t = document.getElementById('card-title')
    const cs = getComputedStyle(t, '::after')
    const r = t.getBoundingClientRect()
    // 提示是 ::after 的 content，量不到自己的盒子，改用「标题整体是否被撑到两行」判断
    const range = document.createRange(); range.selectNodeContents(t)
    return { content: cs.content, position: cs.position, width: cs.width, height: cs.height,
      titleLines: range.getClientRects().length, titleH: Math.round(r.height) }
  })

  for (const style of PANEL_STYLES) {
    test(`${style}：提示完整成行，不被样式装饰的尺寸截断`, async () => {
      await closeHotspotIfOpen(page)
      await reloadPlayer(page, { viewport: { width: 1200, height: 800 }, panel: { style } })
      await openFirstHotspot(page)
      await page.waitForFunction(() => document.body.classList.contains('edit-callout'), null, { timeout: 10_000 })
      const h = await hint()
      expect(h.content).toContain('可拖拽')
      expect(h.position).toBe('static')          // 一旦是 absolute 就是被那条短横规则串了
      expect(h.width).not.toBe('32px')
      expect(h.height).not.toBe('2px')
      expect(h.titleLines).toBe(1)               // 提示跟标题同一行，没有掉下去
    })
  }

  test('描边样式的标题短横仍在（改挂 ::before 后没丢）', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, { viewport: { width: 1200, height: 800 }, panel: { style: 'outline' } })
    await openFirstHotspot(page)
    const bar = await page.evaluate(() => {
      const cs = getComputedStyle(document.getElementById('card-title'), '::before')
      return { position: cs.position, width: cs.width, height: cs.height, bg: cs.backgroundColor }
    })
    expect(bar.position).toBe('absolute')
    expect(bar.width).toBe('32px')
    expect(bar.height).toBe('2px')
    expect(bar.bg).not.toBe('rgba(0, 0, 0, 0)')
  })
})

/* HUD 图标改成内联 SVG：字符图标来自不同回退字体，墨迹基线差 1–2.5px，横看一排是歪的 */
test.describe('HUD 图标对齐', () => {
  for (const width of [360, 900]) {
    test(`${width}px：四个图标墨迹垂直居中完全一致`, async () => {
      await reloadPlayer(page, { viewport: { width, height: 780 } })
      await page.waitForSelector('#actions .btn svg')
      const centers = await page.evaluate(() => [...document.querySelectorAll('#actions .btn')].map(btn => {
        const svg = btn.querySelector('svg'), br = btn.getBoundingClientRect(), sr = svg.getBoundingClientRect()
        let y0 = 1e9, y1 = -1e9
        for (const el of svg.querySelectorAll('path,circle')) {
          const bb = el.getBBox(), sw = el.getAttribute('stroke') === 'none' ? 0 : 1.8
          y0 = Math.min(y0, bb.y - sw / 2); y1 = Math.max(y1, bb.y + bb.height + sw / 2)
        }
        return sr.top - br.top + (y0 + y1) / 2 * (sr.height / 24)
      }))
      expect(centers).toHaveLength(4)
      expect(Math.max(...centers) - Math.min(...centers)).toBeLessThan(0.5)
    })
  }

  test('图标是 SVG 而不是字符（缺字的机器会显示豆腐块）', async () => {
    await reloadPlayer(page, { viewport: { width: 900, height: 700 } })
    await expect(page.locator('#actions .btn .ic svg')).toHaveCount(4)
    const txt = await page.$$eval('#actions .btn .ic', els => els.map(e => e.textContent.trim()).join(''))
    expect(txt).toBe('')
  })
})

/* 全屏按钮：① 进了全屏按钮一直不高亮（syncBtns 压根没管它，Esc 退出后也没人回收状态）；
   ② iPhone 的 Safari / 微信内置浏览器没有元素级全屏 API，老写法 `req && req()` 让
   按钮静静地点不动——合伙人手机上「点全屏没反应」就是这个。 */
test.describe('全屏按钮', () => {
  const fsBtn = '#actions .btn[data-k=full]'
  const st = () => page.evaluate(sel => {
    const f = document.querySelector(sel)
    return { exists: !!f, on: !!f?.classList.contains('on'), aria: f?.getAttribute('aria-pressed'),
      real: !!document.fullscreenElement }
  }, fsBtn)

  test('进出全屏时按钮的选中态跟着走（含从外部退出）', async () => {
    await reloadPlayer(page, withAudio({ viewport: { width: 1100, height: 800 } }))
    await expect(page.locator(fsBtn)).toHaveCount(1)
    expect(await st()).toMatchObject({ on: false, aria: 'false', real: false })

    await page.locator(fsBtn).click()
    await expect.poll(async () => (await st()).real).toBe(true)
    expect(await st()).toMatchObject({ on: true, aria: 'true' })

    // 不点按钮、从外部退出（等价于按 Esc / 系统手势）：状态也必须回收
    await page.evaluate(() => document.exitFullscreen())
    await expect.poll(async () => (await st()).real).toBe(false)
    expect(await st()).toMatchObject({ on: false, aria: 'false' })

    // 再点一次按钮退出，同样要复位
    await page.locator(fsBtn).click()
    await expect.poll(async () => (await st()).real).toBe(true)
    await page.locator(fsBtn).click()
    await expect.poll(async () => (await st()).real).toBe(false)
    expect(await st()).toMatchObject({ on: false, aria: 'false' })
  })

  test('浏览器没有全屏 API（iPhone Safari）时不放这颗按钮，其余按钮照常', async ({ browser }) => {
    const pg = await browser.newPage()
    const errs = []
    pg.on('pageerror', e => errs.push(e.message))
    await pg.addInitScript(() => {
      delete Element.prototype.requestFullscreen
      delete Element.prototype.webkitRequestFullscreen
      delete Document.prototype.exitFullscreen
      delete Document.prototype.webkitExitFullscreen
      Object.defineProperty(document, 'fullscreenEnabled', { get: () => undefined, configurable: true })
    })
    await gotoPlayer(pg, { viewport: { width: 390, height: 800 } })
    await expect(pg.locator(fsBtn)).toHaveCount(0)
    expect(await pg.$$eval('#actions .btn', els => els.map(e => e.dataset.k))).toEqual(['rotate', 'hot', 'reset'])
    expect(errs).toEqual([])
    await releaseWebGL(pg)
    await pg.close()
  })

  test('iframe 里 fullscreenEnabled=false（宿主没给权限）时同样不放按钮', async ({ browser }) => {
    const pg = await browser.newPage()
    await pg.addInitScript(() => {
      Object.defineProperty(document, 'fullscreenEnabled', { get: () => false, configurable: true })
    })
    await gotoPlayer(pg, { viewport: { width: 900, height: 700 } })
    await expect(pg.locator(fsBtn)).toHaveCount(0)
    await releaseWebGL(pg)
    await pg.close()
  })
})
