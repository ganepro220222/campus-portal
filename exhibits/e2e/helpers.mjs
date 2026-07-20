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

/** 注入 __CFG__（每次导航前 addInitScript，reload 前再调一次即可换配置） */
export async function injectCfg(page, { panel = {}, camera = {} } = {}) {
  const cfg = baseCfg()
  cfg.panel = { ...cfg.panel, ...panel }
  cfg.camera = { ...cfg.camera, autoRotate: false, ...camera }
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

export async function closeHotspotIfOpen(page) {
  await page.evaluate(() => {
    const card = document.getElementById('card')
    if (card?.classList.contains('show') && typeof closeHotspot === 'function') closeHotspot()
  })
  await page.waitForTimeout(200)
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
