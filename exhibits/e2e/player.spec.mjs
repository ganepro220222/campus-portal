import { test, expect } from '@playwright/test'
import {
  gotoPlayer, reloadPlayer, openFirstHotspot, openFirstHotspotNoWait, closeHotspotIfOpen,
  calloutSnapshot, dragState, editCalloutUiState, parseLeaderPoints, segmentCount,
  gotoViewerReady, releaseWebGL, injectCfg, waitForPlayerReady, waitForSceneSilhouette,
  viewerPendingEscapeSync,
} from './helpers.mjs'

const PANEL_STYLES = ['solid', 'glass', 'transparent', 'outline', 'ribbon', 'minimal']
const AUDIO_FIXTURE = [{ id: 'a1', src: 'assets/audio.mp3', label: '讲解 1' }]
const withAudio = (opts = {}) => ({ ...opts, audio: opts.audio ?? AUDIO_FIXTURE })

async function openEditorSection(page, title) {
  await page.evaluate(t => {
    for (const d of document.querySelectorAll('#editor details.ed-sec')) {
      const s = d.querySelector('summary')?.textContent || ''
      if (s.includes(t)) { d.open = true; break }
    }
  }, title)
}

test.describe('player editor serial', () => {
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
    await page.evaluate(() => window.__SY_TEST__.settleLeaderAnim())
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
    await page.evaluate(() => window.__SY_TEST__.settleLeaderAnim())
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
    await page.evaluate(() => window.__SY_TEST__.settleLeaderAnim())
    expect(segmentCount((await calloutSnapshot(page)).points)).toBe(2)
  })

  test('leg2-lock elbow', async () => {
    await closeHotspotIfOpen(page)
    await reloadPlayer(page, {
      panel: { leader: 'elbow', elbowMode: 'leg2-lock', leg2Axis: 'v', leaderTail: 40 },
    })
    await openFirstHotspot(page)
    await page.evaluate(() => window.__SY_TEST__.settleLeaderAnim())
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
    await openEditorSection(page, '预设')
    const actions = page.locator('.ed-preset-actions').first()
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
    await openFirstHotspot(page)
    const hs = await page.evaluate(() => ({
      title: document.getElementById('card-title')?.textContent?.trim() || '',
      content: document.getElementById('card-body')?.textContent?.trim() || '',
    }))
    expect(hs.title.length).toBeGreaterThan(3)
    expect(hs.content.length).toBeGreaterThan(20)
    expect(hs.title).not.toMatch(/^New$/i)
    expect(hs.content).not.toMatch(/\(todo\)/i)
    await closeHotspotIfOpen(page)
    await page.evaluate(() => window.__SY_TEST__.setLangForTest('zh'))
  })
})

}) // player editor serial

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

  test('panoDefer=0 overrides WeChat defer for A/B test A', async ({ browser }) => {
    const p = await browser.newPage()
    await p.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', {
        configurable: true,
        get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.42',
      })
    })
    await injectCfg(p)
    await p.setViewportSize({ width: 390, height: 844 })
    await p.goto('/player.html?ex=craft-001&panoDefer=0&syDiag=1', { waitUntil: 'domcontentloaded' })
    await waitForPlayerReady(p)
    const snap = await p.evaluate(() => window.__SY_TEST__.panoDiagSnapshot())
    expect(snap.flags.strictWebKit).toBe(true)
    expect(snap.flags.deferPanoramaIBL).toBe(false)
    expect(snap.log.some(e => e.tag === 'pano:kick')).toBe(true)
    expect(snap.log.some(e => e.tag === 'pano:defer-scheduled')).toBe(false)
    await releaseWebGL(p)
    await p.close()
  })

  test('WeChat UA downscales panorama to 2048 before PMREM by default', async ({ browser }) => {
    const p = await browser.newPage()
    await p.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', {
        configurable: true,
        get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.42',
      })
    })
    await injectCfg(p)
    await p.setViewportSize({ width: 390, height: 844 })
    await p.goto('/player.html?ex=craft-001&syDiag=1', { waitUntil: 'domcontentloaded' })
    await waitForPlayerReady(p)
    await p.waitForFunction(() => {
      const log = window.__SY_PANO_DIAG__ || []
      return log.some(e => e.tag === 'pano:pmrem-done')
    }, { timeout: 60_000 })
    const snap = await p.evaluate(() => window.__SY_TEST__.panoDiagSnapshot())
    expect(snap.flags.strictWebKit).toBe(true)
    expect(snap.flags.panoramaPmremMaxWidth).toBe(2048)
    const down = snap.log.find(e => e.tag === 'pano:downscaled')
    expect(down?.detail?.maxWidth).toBe(2048)
    expect(down?.detail?.w).toBe(2048)
    const done = snap.log.find(e => e.tag === 'pano:pmrem-done')
    expect(done?.detail?.w).toBe(2048)
    await releaseWebGL(p)
    await p.close()
  })

  for (const [name, ua] of [
    ['iOS Edge', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 EdgiOS/121.0.2277.99 Mobile/15E148 Safari/604.1'],
    ['iOS Chrome', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/121.0.6167.66 Mobile/15E148 Safari/604.1'],
  ]) {
    test(`${name} UA uses strict WebKit mobile path`, async ({ browser }) => {
      const p = await browser.newPage()
      await p.addInitScript(u => {
        Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => u })
      }, ua)
      await injectCfg(p)
      await p.setViewportSize({ width: 390, height: 844 })
      await p.goto('/player.html?ex=craft-001&syDiag=1', { waitUntil: 'domcontentloaded' })
      await waitForPlayerReady(p)
      const flags = await p.evaluate(() => ({
        strict: window.__SY_TEST__.strictWebKitHost(),
        defer: window.__SY_TEST__.deferPanoramaIBL(),
        maxW: window.__SY_TEST__.panoramaPmremMaxWidth(),
      }))
      expect(flags.strict).toBe(true)
      expect(flags.defer).toBe(true)
      expect(flags.maxW).toBe(2048)
      await releaseWebGL(p)
      await p.close()
    })
  }
})

/* 露出前等全景就绪这一腿，原来是唯一没有显式超时的启动腿：靠浏览器自己放弃请求。
   把全景请求挂起（服务端收下连接就是不回，弱网 / 门户认证下很常见）实测能卡满 120 秒
   仍停在「正在准备环境光照…」，既不报错也没有重试按钮。全景只影响环境光，到点该直接
   用兜底环境露出模型。iOS / 微信默认 deferPanoramaIBL，这条腿正是它们的必经之路。 */
test.describe('全景就绪超时', () => {
  const stallPanorama = page => page.route(
    u => /\.(jpg|jpeg|png|webp)$/i.test(decodeURIComponent(u.pathname)) && !/poster/i.test(decodeURIComponent(u.pathname)),
    () => { /* 永不 fulfill：模拟连接被握住不放 */ },
  )

  test('全景请求挂死时到点用兜底环境露出，不会永远停在加载页', async ({ browser }) => {
    const page = await browser.newPage()
    await page.addInitScript(() => {
      window.__SY_PLAYER = { panoramaRevealTimeoutMs: 1200, module: false, bootStarted: false, ready: false }
    })
    await stallPanorama(page)
    await page.goto('/player.html?ex=craft-001&syDiag=1', { waitUntil: 'domcontentloaded' })
    // 到点放行：模型露出、没有错误页
    await page.waitForFunction(() => window.__SY_PLAYER?.ready === true, null, { timeout: 60_000 })
    await expect(page.locator('#error')).toHaveAttribute('hidden', '')
    await expect(page.locator('#loading')).toHaveAttribute('hidden', '')
    await expect(page.locator('#hud')).not.toHaveAttribute('hidden', '')
    // 确实是走的超时分支，而不是全景意外加载成功了
    const tags = await page.evaluate(() => (window.__SY_PANO_DIAG__ || []).map(x => x.tag))
    expect(tags).toContain('pano:await-before-reveal')
    expect(tags).toContain('pano:await-timeout')
    expect(tags).not.toContain('pano:texture-loaded')
    await releaseWebGL(page)
    await page.close()
  })

  /* 上面那条跑的是 player.html。生产环境跑的是 player.view.html + esbuild bundle，
     而 build-viewer 会把 player-persist 的 import 重写成一份**白名单**——漏加名字时：
       · esbuild 不报错（自由标识符当全局变量处理）
       · build-viewer --check 不报错（比字节与语义，不求值）
       · 只跑 player.html 的 E2E 不报错
       · 运行时也不报错（外层 catch 把 ReferenceError 吞了，照常揭示）
     结果就是整个超时功能在生产版里静默失效。所以这条必须打生产 viewer。 */
  test('生产 viewer（bundle）里超时同样生效，不是只在 player.html 里管用', async ({ browser }) => {
    const page = await browser.newPage()
    const errs = []
    page.on('pageerror', e => errs.push(e.message))
    await page.addInitScript(() => {
      window.__SY_PLAYER = { panoramaRevealTimeoutMs: 1200, module: false, bootStarted: false, ready: false }
    })
    await stallPanorama(page)
    await page.goto('/player.view.html?ex=craft-001&syDiag=1', { waitUntil: 'domcontentloaded' })
    expect(await page.evaluate(() => !!document.querySelector('script[src="./player.bundle.js"]'))).toBe(true)
    await page.waitForFunction(() => window.__SY_PLAYER?.ready === true, null, { timeout: 60_000 })
    const tags = await page.evaluate(() => (window.__SY_PANO_DIAG__ || []).map(x => x.tag))
    // 走到超时分支才算数：只看「揭示了」会被外层 catch 的兜底揭示骗过去
    expect(tags).toContain('pano:await-before-reveal')
    expect(tags).toContain('pano:await-timeout')
    expect(errs).toEqual([])
    await releaseWebGL(page)
    await page.close()
  })

  test('超时先露出模型，迟到的全景仍最终生效', async ({ browser }) => {
    const page = await browser.newPage()
    let panoRequests = 0
    let holdModel = true
    let releasePano = false
    const panoCb = Date.now()
    await page.addInitScript(() => {
      window.__SY_PLAYER = { panoramaRevealTimeoutMs: 400, module: false, bootStarted: false, ready: false }
    })
    await injectCfg(page, {
      assets: {
        model: '../e2e/fixtures/two-material.gltf',
        panorama: `../e2e/fixtures/tiny-pano.jpg?cb=${panoCb}`,
      },
      environment: { mode: 'panorama' },
    })
    // 模型与全景都先挂住：prefetch 不能早于 await 完成；await 期间全景仍 pending 才会触发 400ms 超时。
    await page.route(/two-material\.gltf/i, async route => {
      while (holdModel) await new Promise(r => setTimeout(r, 25))
      return route.continue()
    })
    await page.route(
      u => /tiny-pano\.jpg/i.test(decodeURIComponent(u.pathname)),
      async route => {
        panoRequests++
        while (!releasePano) await new Promise(r => setTimeout(r, 25))
        await new Promise(r => setTimeout(r, 1200))
        return route.continue()
      },
    )
    // panoDefer=1：与 iOS/微信同路径，在模型就绪后再等全景；避免桌面端 boot 即 kick + 磁盘缓存导致全景先于 await 完成、测不到超时
    await page.goto('/player.html?ex=craft-001&syDiag=1&panoDefer=1', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(
      () => (window.__SY_PANO_DIAG__ || []).some(x => x.tag === 'pano:prefetch-start'),
      null,
      { timeout: 15_000 },
    )
    holdModel = false
    await page.waitForFunction(
      () => (window.__SY_PANO_DIAG__ || []).some(x => x.tag === 'pano:await-before-reveal'),
      null,
      { timeout: 60_000 },
    )
    releasePano = true
    await page.waitForFunction(() => window.__SY_PLAYER?.ready === true, null, { timeout: 60_000 })
    const tagsAfterReady = await page.evaluate(() => (window.__SY_PANO_DIAG__ || []).map(x => x.tag))
    expect(tagsAfterReady).toContain('pano:await-timeout')
    expect(panoRequests).toBe(1)
    await page.waitForFunction(
      () => (window.__SY_PANO_DIAG__ || []).some(x => x.tag === 'pano:texture-loaded'),
      null,
      { timeout: 15_000 },
    )
    expect(panoRequests).toBe(1)
    expect(await page.evaluate(() => window.__SY_TEST__.envSourceKind())).toBe('panorama')
    await releaseWebGL(page)
    await page.close()
  })

  test('消费预取全景后 envPanoPrefetch 已清空', async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/player.html?ex=craft-001&syDiag=1&panoDefer=1', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__SY_PLAYER?.ready === true, null, { timeout: 90_000 })
    const tags = await page.evaluate(() => (window.__SY_PANO_DIAG__ || []).map(x => x.tag))
    expect(tags).toContain('pano:prefetch-start')
    expect(await page.evaluate(() => window.__SY_TEST__.envPanoPrefetchCleared())).toBe(true)
    await releaseWebGL(page)
    await page.close()
  })

  test('全景正常时不触发超时分支（不能为了保命牺牲正常路径）', async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/player.html?ex=craft-001&syDiag=1', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__SY_PLAYER?.ready === true, null, { timeout: 90_000 })
    const tags = await page.evaluate(() => (window.__SY_PANO_DIAG__ || []).map(x => x.tag))
    expect(tags).toContain('pano:texture-loaded')
    expect(tags).not.toContain('pano:await-timeout')
    await releaseWebGL(page)
    await page.close()
  })
})

test.describe('boot timeout', () => {
  test('config fetch pending shows timeout error and retry button', async ({ browser }) => {
    const page = await browser.newPage()
    await page.addInitScript(() => {
      window.__SY_PLAYER = { bootTimeoutMs: 800, module: false, bootStarted: false, ready: false }
    })
    await page.route('**/craft-001/config.json*', () => {})
    await page.goto('/player.html?ex=craft-001', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#error:not([hidden])', { timeout: 5000 })
    await expect(page.locator('#err-text')).toContainText(/配置加载超时|配置或模型加载超时/)
    await expect(page.locator('#err-btn')).not.toHaveAttribute('hidden', '')
    expect(await page.evaluate(() => window.__SY_PLAYER?.ready)).toBe(false)
    await releaseWebGL(page)
    await page.close()
  })

  test('model load pending shows timeout error and retry button', async ({ browser }) => {
    const page = await browser.newPage()
    await page.addInitScript(() => {
      window.__SY_PLAYER = { configTimeoutMs: 800, modelIdleTimeoutMs: 800, modelTotalTimeoutMs: 30000, module: false, bootStarted: false, ready: false }
    })
    await injectCfg(page)
    await page.route('**/craft-001/assets/model.glb', () => {})
    await page.goto('/player.html?ex=craft-001', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__SY_TEST__?.modelLoadPhaseActive?.() === true, { timeout: 15000 })
    await page.evaluate(() => window.__SY_TEST__.simulateModelLoadProgress(100, 4000))
    await page.waitForSelector('#error:not([hidden])', { timeout: 5000 })
    await expect(page.locator('#err-text')).toContainText(/模型加载超时/)
    await expect(page.locator('#err-btn')).not.toHaveAttribute('hidden', '')
    expect(await page.evaluate(() => window.__SY_PLAYER?.ready)).toBe(false)
    await releaseWebGL(page)
    await page.close()
  })

  test('model progress resets idle timeout beyond config window', async ({ browser }) => {
    const page = await browser.newPage()
    await page.addInitScript(() => {
      window.__SY_PLAYER = { configTimeoutMs: 800, modelIdleTimeoutMs: 5000, modelTotalTimeoutMs: 30000, module: false, bootStarted: false, ready: false }
    })
    await injectCfg(page)
    await page.route('**/craft-001/assets/model.glb', () => {})
    await page.goto('/player.html?ex=craft-001', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__SY_TEST__?.modelLoadPhaseActive?.() === true, { timeout: 15000 })
    for (let i = 0; i < 4; i++) {
      await page.evaluate(n => window.__SY_TEST__.simulateModelLoadProgress(n * 1000, 4000), i + 1)
      await page.waitForTimeout(400)
    }
    expect(await page.evaluate(() => window.__SY_TEST__.modelDownloadComplete())).toBe(true)
    await page.waitForTimeout(1200)
    await expect(page.locator('#error')).toHaveAttribute('hidden', '')
    expect(await page.evaluate(() => window.__SY_PLAYER?.ready)).toBe(false)
    await releaseWebGL(page)
    await page.close()
  })

  test('unknown model length survives idle window during decode', async ({ browser }) => {
    const page = await browser.newPage()
    await page.addInitScript(() => {
      window.__SY_PLAYER = { configTimeoutMs: 800, modelIdleTimeoutMs: 800, modelTotalTimeoutMs: 30000, module: false, bootStarted: false, ready: false }
    })
    await injectCfg(page)
    await page.route('**/craft-001/assets/model.glb', () => {})
    await page.goto('/player.html?ex=craft-001', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__SY_TEST__?.modelLoadPhaseActive?.() === true, { timeout: 15000 })
    await page.evaluate(() => window.__SY_TEST__.simulateModelLoadProgress(1, 0))
    expect(await page.evaluate(() => window.__SY_TEST__.modelLengthUnknown())).toBe(true)
    for (let i = 1; i <= 4; i++) {
      await page.waitForTimeout(400)
      await page.evaluate(n => window.__SY_TEST__.simulateModelLoadProgress(n * 1000, 0), i)
    }
    await page.waitForTimeout(1200)
    await expect(page.locator('#error')).toHaveAttribute('hidden', '')
    await releaseWebGL(page)
    await page.close()
  })

  test('model completing after timeout does not become ready', async ({ browser }) => {
    let release
    const gate = new Promise(r => { release = r })
    const page = await browser.newPage()
    await page.addInitScript(() => {
      window.__SY_PLAYER = { configTimeoutMs: 800, modelIdleTimeoutMs: 800, modelTotalTimeoutMs: 30000, module: false, bootStarted: false, ready: false }
    })
    await injectCfg(page)
    await page.route('**/craft-001/assets/model.glb', async route => {
      await gate
      route.continue()
    })
    await page.goto('/player.html?ex=craft-001', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__SY_TEST__?.modelLoadPhaseActive?.() === true, { timeout: 15000 })
    await page.evaluate(() => window.__SY_TEST__.simulateModelLoadProgress(100, 4000))
    await page.waitForSelector('#error:not([hidden])', { timeout: 5000 })
    release()
    await page.waitForTimeout(1500)
    expect(await page.evaluate(() => window.__SY_PLAYER?.ready)).toBe(false)
    await releaseWebGL(page)
    await page.close()
  })

  test('config HTTP error is not overwritten by boot watchdog', async ({ browser }) => {
    const page = await browser.newPage()
    await page.addInitScript(() => {
      window.__SY_PLAYER = { bootTimeoutMs: 800, module: false, bootStarted: false, ready: false, failed: false }
    })
    await page.route('**/craft-001/config.json*', route => route.fulfill({ status: 404, body: 'missing' }))
    await page.goto('/player.html?ex=craft-001', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#error:not([hidden])', { timeout: 5000 })
    await expect(page.locator('#err-text')).toContainText(/HTTP 404/)
    await page.waitForTimeout(1200)
    await expect(page.locator('#err-text')).toContainText(/HTTP 404/)
    await expect(page.locator('#err-text')).not.toContainText(/加载超时/)
    await releaseWebGL(page)
    await page.close()
  })

  test('model load error is not overwritten by boot watchdog', async ({ browser }) => {
    const page = await browser.newPage()
    await page.addInitScript(() => {
      window.__SY_PLAYER = { bootTimeoutMs: 800, module: false, bootStarted: false, ready: false, failed: false }
    })
    await injectCfg(page)
    await page.route('**/craft-001/assets/model.glb', route => route.abort('failed'))
    await page.goto('/player.html?ex=craft-001', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#error:not([hidden])', { timeout: 15000 })
    await expect(page.locator('#err-text')).toContainText('模型加载失败')
    await page.waitForTimeout(1200)
    await expect(page.locator('#err-text')).toContainText('模型加载失败')
    await expect(page.locator('#err-text')).not.toContainText(/配置或模型加载超时/)
    await releaseWebGL(page)
    await page.close()
  })

  test('module load failure reload button works before ES module runs', async ({ browser }) => {
    const page = await browser.newPage()
    await page.addInitScript(() => {
      window.__SY_PLAYER = { bootTimeoutMs: 800, module: false, bootStarted: false, ready: false, failed: false }
    })
    await page.route('**/leader-geom.js', route => route.abort('failed'))
    await page.goto('/player.html?ex=craft-001', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('#error:not([hidden])', { timeout: 5000 })
    // 文案随 syPlayerBootFailureMessage 改过；这里只认「加载失败 + 可重试」这两件事
    await expect(page.locator('#err-text')).toContainText(/加载失败/)
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.locator('#err-btn').click(),
    ])
    await releaseWebGL(page)
    await page.close()
  })
})

test.describe('model load failure retry', () => {
  test('reload button refreshes page and second load succeeds', async ({ browser }) => {
    let attempts = 0
    const vpage = await browser.newPage()
    await vpage.route('**/craft-001/assets/model.glb', route => {
      attempts++
      if (attempts === 1) route.abort('failed')
      else route.continue()
    })
    await injectCfg(vpage)
    await vpage.goto('/player.html?ex=craft-001', { waitUntil: 'domcontentloaded' })
    await vpage.waitForSelector('#error:not([hidden])', { timeout: 90_000 })
    await expect(vpage.locator('#err-text')).toContainText('模型加载失败')
    await Promise.all([
      vpage.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      vpage.locator('#err-btn').click(),
    ])
    await waitForPlayerReady(vpage)
    expect(attempts).toBeGreaterThanOrEqual(2)
    await releaseWebGL(vpage)
    await vpage.close()
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

test.describe('player UI serial', () => {
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

test.describe('语音播放器 折叠', () => {
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
      await page.evaluate(() => window.__SY_TEST__.settleLeaderAnim())
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
      const centers = await page.evaluate(() => [...document.querySelectorAll('#actions .btn:not([hidden])')]
        .filter(btn => btn.dataset.k !== 'editPanel').map(btn => {
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
    await expect(page.locator('#actions .btn:not([data-k=editPanel]) .ic svg')).toHaveCount(4)
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

}) // player UI serial

/* 竖屏自动取景：手机上「模型偏大」的成因是竖屏水平视锥窄（aspect 0.49），
   实测默认取景下器物占屏高 77.8% 但占屏**宽 99.0%**，左右几乎顶满。
   按包围盒反解距离（model-viewer / Sketchfab 的通行做法）能对任意宽高比的展品都成立，
   100 件展品不需要逐件调参；横屏与桌面不接管，零回归。 */
test.describe('竖屏自动取景', () => {
  // 量器物在画布里的真实像素轮廓（编辑模式才有 preserveDrawingBuffer）
  const silhouette = pg => pg.evaluate(() => {
    const c = document.getElementById('scene')
    const g = c.getContext('webgl2') || c.getContext('webgl')
    const W = c.width, H = c.height
    const px = new Uint8Array(W * H * 4)
    g.readPixels(0, 0, W, H, g.RGBA, g.UNSIGNED_BYTE, px)
    let minY = H, maxY = -1, minX = W, maxX = -1
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      if ((px[i] + px[i + 1] + px[i + 2]) / 3 > 45) {
        if (y < minY) minY = y; if (y > maxY) maxY = y
        if (x < minX) minX = x; if (x > maxX) maxX = x
      }
    }
    return { h: (maxY - minY) / H, w: (maxX - minX) / W }
  })
  const portraitPlayerOpts = (viewport, camera) => ({
    mode: 'edit',
    viewport,
    camera,
    environment: { visibleBackground: false, mode: 'panorama' },
    assets: { panorama: '../e2e/fixtures/tiny-pano.jpg' },
  })

  /** 每例独立开页，避免与串行链共享 page */
  const measure = async (browser, viewport, camera) => {
    const pg = await browser.newPage()
    await gotoPlayer(pg, portraitPlayerOpts(viewport, camera))
    await waitForSceneSilhouette(pg)
    const s = await silhouette(pg)
    await releaseWebGL(pg)
    await pg.close()
    return s
  }

  test('竖屏：占屏比落到目标附近，且不再左右顶满', async ({ browser }) => {
    const s = await measure(browser, { width: 390, height: 800 }, {})
    // 绑定轴（竖屏是宽度）应贴近 0.78 目标；轮廓非矩形，留一档余量
    expect(Math.max(s.w, s.h)).toBeGreaterThan(0.68)
    expect(Math.max(s.w, s.h)).toBeLessThan(0.88)
    expect(s.w).toBeLessThan(0.9)        // 修复前是 0.99，几乎贴边
  })

  test('竖屏：config 里的 distance 不再决定取景（100 件展品无需逐件调）', async ({ browser }) => {
    const a = await measure(browser, { width: 390, height: 800 }, { distance: 4.4 })
    const b = await measure(browser, { width: 390, height: 800 }, { distance: 6.5 })
    expect(Math.abs(a.h - b.h)).toBeLessThan(0.02)
    expect(Math.abs(a.w - b.w)).toBeLessThan(0.02)
  })

  test('横屏与桌面完全不接管：仍由 config 的 distance 决定', async ({ browser }) => {
    const near = await measure(browser, { width: 1280, height: 800 }, { distance: 4.4 })
    const far = await measure(browser, { width: 1280, height: 800 }, { distance: 6.5 })
    expect(near.h).toBeGreaterThan(far.h + 0.15)   // 距离仍然说了算
  })

  test('portraitFill=0 可关掉自动取景，回到老行为', async ({ browser }) => {
    const auto = await measure(browser, { width: 390, height: 800 }, { distance: 6.5 })
    const off = await measure(browser, { width: 390, height: 800 }, { distance: 6.5, portraitFill: 0 })
    expect(off.h).toBeLessThan(auto.h - 0.05)      // 关掉后 6.5 的远距离重新生效
  })

  test('横竖屏切换保留用户方位角与 autoRotate，只调整距离', async ({ browser }) => {
    const pg = await browser.newPage()
    await gotoPlayer(pg, portraitPlayerOpts({ width: 390, height: 800 }, {}))
    await waitForSceneSilhouette(pg)
    const canvas = pg.locator('#scene')
    const box = await canvas.boundingBox()
    expect(box).toBeTruthy()
    await pg.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
    await pg.mouse.down()
    await pg.mouse.move(box.x + box.width * 0.5 + 90, box.y + box.height * 0.5, { steps: 12 })
    await pg.mouse.up()
    // 不等阻尼衰减：模拟用户拖完立刻转屏，此时 _sphericalDelta 通常仍非零
    await pg.evaluate(() => window.__SY_TEST__.simulatePendingDragInertia(0.05, 0))
    const before = await pg.evaluate(() => window.__SY_TEST__.cameraState())
    expect(before.autoRotate).toBe(false)
    const theta0 = before.theta
    const radiusPortrait = before.radius
    await pg.setViewportSize({ width: 800, height: 390 })
    await pg.waitForTimeout(150)
    const land = await pg.evaluate(() => ({
      delta: window.__SY_TEST__.controlsDelta(),
      cam: window.__SY_TEST__.cameraState(),
    }))
    expect(land.cam.autoRotate).toBe(false)
    expect(land.delta.theta).toBeCloseTo(0, 4)
    expect(land.delta.phi).toBeCloseTo(0, 4)
    expect(land.cam.theta).toBeCloseTo(theta0, 1)
    expect(land.cam.radius).not.toBeCloseTo(radiusPortrait, 1)
    await pg.evaluate(() => window.__SY_TEST__.runControlsUpdates(80))
    const afterDrift = await pg.evaluate(() => window.__SY_TEST__.cameraState())
    expect(afterDrift.theta).toBeCloseTo(land.cam.theta, 2)
    await pg.setViewportSize({ width: 390, height: 800 })
    await pg.waitForTimeout(150)
    const back = await pg.evaluate(() => window.__SY_TEST__.cameraState())
    expect(back.autoRotate).toBe(false)
    expect(back.theta).toBeCloseTo(theta0, 0)
    await releaseWebGL(pg)
    await pg.close()
  })

  test('refit 清除注入的拖曳惯性，后续 update 不再漂移方位角', async ({ browser }) => {
    const pg = await browser.newPage()
    await gotoPlayer(pg, portraitPlayerOpts({ width: 390, height: 800 }, {}))
    await waitForSceneSilhouette(pg)
    const snap = await pg.evaluate(() => {
      window.__SY_TEST__.simulatePendingDragInertia(0.05, 0.01)
      const injected = window.__SY_TEST__.controlsDelta()
      window.__SY_TEST__.refitOrientationForTest()
      const afterRefit = {
        delta: window.__SY_TEST__.controlsDelta(),
        theta: window.__SY_TEST__.cameraState().theta,
      }
      window.__SY_TEST__.runControlsUpdates(80)
      const afterUpdates = window.__SY_TEST__.cameraState().theta
      return { injected, afterRefit, afterUpdates }
    })
    expect(snap.injected.theta).toBeCloseTo(0.05, 4)
    expect(snap.injected.phi).toBeCloseTo(0.01, 4)
    expect(snap.afterRefit.delta.theta).toBeCloseTo(0, 5)
    expect(snap.afterRefit.delta.phi).toBeCloseTo(0, 5)
    expect(snap.afterUpdates).toBeCloseTo(snap.afterRefit.theta, 2)
    await releaseWebGL(pg)
    await pg.close()
  })

  test('旋转后关热点/重置仍保持当前方向适配的距离', async ({ browser }) => {
    const pg = await browser.newPage()
    await gotoPlayer(pg, portraitPlayerOpts({ width: 390, height: 800 }, {}))
    await waitForSceneSilhouette(pg)
    await pg.setViewportSize({ width: 800, height: 390 })
    await pg.waitForTimeout(150)
    const land = await pg.evaluate(() => window.__SY_TEST__.cameraState())
    await openFirstHotspot(pg)
    await pg.evaluate(() => window.__SY_TEST__.closeHotspot())
    await pg.waitForTimeout(800)
    const afterClose = await pg.evaluate(() => window.__SY_TEST__.cameraState())
    expect(afterClose.radius).toBeCloseTo(land.radius, 1)
    expect(afterClose.initialCamRadius).toBeCloseTo(land.initialCamRadius, 1)
    await pg.setViewportSize({ width: 390, height: 800 })
    await pg.waitForTimeout(150)
    const portrait = await pg.evaluate(() => window.__SY_TEST__.cameraState())
    await pg.locator('[data-k="reset"]').click()
    await pg.waitForTimeout(800)
    const afterReset = await pg.evaluate(() => window.__SY_TEST__.cameraState())
    expect(afterReset.radius).toBeCloseTo(portrait.radius, 1)
    expect(afterReset.initialCamRadius).toBeCloseTo(portrait.initialCamRadius, 1)
    await releaseWebGL(pg)
    await pg.close()
  })
})
