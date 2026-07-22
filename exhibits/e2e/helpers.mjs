import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

let _baseCfg
export function baseCfg() {
  if (!_baseCfg) {
    _baseCfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'craft-001/config.json'), 'utf8'))
  }
  return structuredClone(_baseCfg)
}

function playerUrl({ ex = 'craft-001', mode, view = false } = {}) {
  const file = view ? 'player.view.html' : 'player.html'
  const q = new URLSearchParams({ ex })
  if (mode) q.set('mode', mode)
  return `/${file}?${q}`
}

/** 确定性 hidden-overlap：热点落在面板内边距锚点（pad=8）上，且 panelOverlap */
export const HIDDEN_OVERLAP_GEOM = {
  mx: 16, my: 74, cw: 100, ch: 80, cardX: 200, cardY: 200,
  panel: { elbowMode: 'orthogonal' },
  vp: { minX: 8, minY: 66, maxX: 8, maxY: 66, relaxedMaxX: 8 },
}

/** 注入 __CFG__（每次导航前 addInitScript，reload 前再调一次即可换配置） */
export async function injectCfg(page, { panel = {}, camera = {}, hotspots } = {}) {
  const cfg = baseCfg()
  cfg.panel = { ...cfg.panel, ...panel }
  cfg.camera = { ...cfg.camera, autoRotate: false, ...camera }
  if (hotspots) cfg.hotspots = hotspots
  await page.addInitScript(data => { window.__CFG__ = data }, cfg)
  return cfg
}

/** 等待模型加载完成 */
export async function waitForPlayerReady(page) {
  await page.waitForFunction(() => {
    const loading = document.getElementById('loading')
    const topbar = document.getElementById('topbar')
    return loading?.hasAttribute('hidden') && topbar && !topbar.hasAttribute('hidden')
  }, null, { timeout: 90_000 })
}

/** 打开页面但不等 3D 模型（几何/壳页快测） */
export async function gotoPlayerLight(page, opts = {}) {
  await injectCfg(page, opts)
  if (opts.viewport) await page.setViewportSize(opts.viewport)
  await page.goto(playerUrl(opts), { waitUntil: 'domcontentloaded' })
}

/** 注入 __CFG__ 并打开仅观看版（完整加载） */
export async function gotoViewerReady(page, opts = {}) {
  await injectCfg(page, opts)
  if (opts.viewport) await page.setViewportSize(opts.viewport)
  await page.goto(playerUrl({ ...opts, view: true, mode: opts.mode ?? undefined }))
  await waitForPlayerReady(page)
}

/** 调用生产 renderLeaderElement（edit 模式 TEST-HOOKS） */
export async function renderHiddenOverlapInPlayer(page) {
  const result = await page.evaluate(() => window.__SY_TEST__?.renderHiddenOverlapCallout?.())
  if (!result?.ok) throw new Error('renderHiddenOverlapCallout failed: ' + (result?.reason || 'missing hook'))
  return result
}

/** 注入 __CFG__ 并打开播放器（完整加载） */
export async function gotoPlayer(page, opts = {}) {
  await injectCfg(page, opts)
  if (opts.viewport) await page.setViewportSize(opts.viewport)
  await page.goto(playerUrl(opts))
  await waitForPlayerReady(page)
}

/** 运行中换 panel/camera 并重载 */
export async function reloadPlayer(page, opts = {}) {
  await injectCfg(page, opts)
  if (opts.viewport) await page.setViewportSize(opts.viewport)
  await page.reload()
  await waitForPlayerReady(page)
}

/** 打开第一个热点 */
export async function openFirstHotspot(page) {
  await page.waitForSelector('#hs-layer .hs', { timeout: 45_000 })
  const ok = await page.evaluate(() => {
    if (window.__SY_TEST__?.openHotspotByIndex) return window.__SY_TEST__.openHotspotByIndex(0)
    const el = document.querySelector('#hs-layer .hs')
    if (!el) return false
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    return true
  })
  if (!ok) throw new Error('failed to open hotspot')
  await page.waitForFunction(() => document.getElementById('card')?.classList.contains('show'), null, { timeout: 15_000 })
  await page.waitForTimeout(350)
}

/** 打开第一个热点但不等待 card.show（用于竞态 E2E） */
export async function openFirstHotspotNoWait(page) {
  await page.waitForSelector('#hs-layer .hs', { timeout: 45_000 })
  const ok = await page.evaluate(() => {
    if (window.__SY_TEST__?.openHotspotByIndex) return window.__SY_TEST__.openHotspotByIndex(0)
    const el = document.querySelector('#hs-layer .hs')
    if (!el) return false
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    return true
  })
  if (!ok) throw new Error('failed to open hotspot')
}

/** 观看版：同一页面任务内打开 pending 热点并同步 Esc（避免协议往返吃掉 delay） */
export async function viewerPendingEscapeSync(page) {
  return page.evaluate(() => {
    const el = document.querySelector('#hs-layer .hs')
    if (!el) return { ok: false, reason: 'no-hs' }
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    const card = document.getElementById('card')
    const pending = !card.classList.contains('show') && document.querySelectorAll('.hs.active').length > 0
    if (!pending) return { ok: false, reason: 'not-pending', show: card.classList.contains('show') }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    return { ok: true }
  })
}

export async function closeHotspotIfOpen(page) {
  if (await page.locator('#card.show').count() === 0) return
  // 编辑模式下窄屏时 #editor 会挡住 #card-close 的点击；优先 Esc / TEST-HOOK
  await page.evaluate(() => {
    if (window.__SY_TEST__?.closeHotspot) {
      window.__SY_TEST__.closeHotspot()
      return
    }
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  })
  await page.waitForFunction(() => !document.getElementById('card')?.classList.contains('show'), null, { timeout: 10_000 })
  await page.waitForFunction(() => document.getElementById('hs-svg')?.hasAttribute('hidden'), null, { timeout: 5_000 })
}

/** DOM 快照（不依赖 edit 模式 TEST-HOOKS） */
export async function calloutSnapshot(page) {
  return page.evaluate(() => {
    const card = document.getElementById('card')
    if (!card?.classList.contains('show')) return null
    return {
      cardX: parseFloat(card.style.left) || 0,
      cardY: parseFloat(card.style.top) || 0,
      points: document.getElementById('hs-leader')?.getAttribute('points') || '',
      svgHidden: document.getElementById('hs-svg')?.hasAttribute('hidden'),
      cardShow: card.classList.contains('show'),
    }
  })
}

export async function dragState(page) {
  return page.evaluate(() => window.__SY_TEST__?.dragState?.() ?? { kneeDrag: false, panelDrag: false })
}

export async function editCalloutUiState(page) {
  return page.evaluate(() => ({
    cardShow: document.getElementById('card')?.classList.contains('show'),
    svgHidden: document.getElementById('hs-svg')?.hasAttribute('hidden'),
    kneeHidden: document.getElementById('hs-knee')?.hasAttribute('hidden'),
    edMovable: document.getElementById('card')?.classList.contains('ed-movable'),
    editCallout: document.body.classList.contains('edit-callout'),
    editCalloutKnee: document.body.classList.contains('edit-callout-knee'),
    activeHs: document.querySelectorAll('.hs.active').length,
  }))
}

/** 在页面内调用 leader-geom.js */
export async function resolveGeom(page, args) {
  return page.evaluate(async (a) => {
    const LG = await import('./leader-geom.js')
    return LG.resolveCalloutGeom(a.mx, a.my, a.cw, a.ch, a.panel, {}, { cardX: a.cardX, cardY: a.cardY }, a.vp)
  }, args)
}

export function parseLeaderPoints(points) {
  if (!points) return []
  return points.trim().split(/\s+/).map(p => {
    const [x, y] = p.split(',').map(Number)
    return { x, y }
  })
}

export function segmentCount(points) {
  return Math.max(0, parseLeaderPoints(points).length - 1)
}
