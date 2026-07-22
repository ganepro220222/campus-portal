import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

async function waitForStudioReady(page) {
  await page.goto('/studio.html')
  await page.waitForSelector('#grid .card', { timeout: 30_000 })
  await page.waitForSelector('#bwrap .bf', { timeout: 15_000 })
}

async function openBatchPanel(page) {
  if (!(await page.locator('body.batch-open').count())) {
    await page.locator('#batchToggle').click()
    await expect(page.locator('body.batch-open')).toHaveCount(1)
  }
}

async function selectExhibits(page, dirs) {
  for (const dir of dirs) {
    const pick = page.locator(`.card[data-dir="${dir}"] .pick`)
    await pick.click()
    await expect(page.locator(`.card[data-dir="${dir}"].sel`)).toHaveCount(1)
  }
}

function loadCfg(dir) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, dir, 'config.json'), 'utf8'))
}

test.describe('studio.html', () => {
  test('boots with module deps and exhibit grid', async ({ page }) => {
    const pageErrors = []
    const reqFailed = []
    page.on('pageerror', e => pageErrors.push(e.message))
    page.on('requestfailed', r => reqFailed.push(r.url()))
    const batchPromise = page.waitForResponse(r => r.url().includes('studio-batch.mjs'), { timeout: 15_000 })
    await waitForStudioReady(page)
    const batchRes = await batchPromise
    expect(batchRes.status()).toBe(200)
    expect(pageErrors).toEqual([])
    expect(reqFailed.filter(u => u.includes('studio-batch'))).toEqual([])
    await expect(page.locator('#grid .card')).not.toHaveCount(0)
    await expect(page.locator('#s-count')).not.toHaveText('')
  })

  test('straight leader filters elbow fields from batch save', async ({ page }) => {
    const fixturePanel = {
      style: 'glass',
      leader: 'elbow',
      elbowMode: 'leg2-lock',
      leaderGap: 77,
      leaderTail: 63,
      leg1Axis: 'v',
      leg2Axis: 'h',
    }
    const cfg = loadCfg('craft-001')
    cfg.panel = { ...cfg.panel, ...fixturePanel }

    const saves = []
    await page.route('**/craft-001/config.json*', r => r.fulfill({ json: structuredClone(cfg) }))
    await page.route('**/studio-api/save', async route => {
      saves.push(route.request().postDataJSON())
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    })
    await waitForStudioReady(page)
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-001'])
    for (const id of ['lmode', 'lgap', 'ltail', 'laxis', 'l2axis', 'leader']) {
      await page.locator(`#en-${id}`).check()
    }
    // 扰动 UI：若 straight 后仍写入这些值，说明失效字段未被正确跳过
    await page.locator('#v-lmode').selectOption('orthogonal')
    await page.locator('#v-lgap').fill('320')
    await page.locator('#v-ltail').fill('320')
    await page.locator('#v-laxis').selectOption('h')
    await page.locator('#v-l2axis').selectOption('auto')
    await page.locator('#v-leader').selectOption('straight')
    for (const id of ['lmode', 'lgap', 'ltail', 'laxis', 'l2axis']) {
      await expect(page.locator(`#row-${id}`)).toHaveAttribute('data-mode-off', '1')
      await expect(page.locator(`#row-${id}`)).toHaveClass(/dis/)
    }
    await page.locator('#bapply').click()
    await page.waitForFunction(() => document.querySelector('#blog')?.textContent?.includes('完成'), null, { timeout: 15_000 })
    expect(saves).toHaveLength(1)
    const panel = saves[0].config.panel
    expect(panel.leader).toBe('straight')
    expect(panel.elbowMode).toBe('leg2-lock')
    expect(panel.leaderGap).toBe(77)
    expect(panel.leaderTail).toBe(63)
    expect(panel.leg1Axis).toBe('v')
    expect(panel.leg2Axis).toBe('h')
    expect(panel.style).toBe('glass')
  })

  test('batch updates only selected paths per exhibit', async ({ page }) => {
    const cfg001 = loadCfg('craft-001')
    const cfg002 = loadCfg('craft-002')
    cfg001.panel = { ...cfg001.panel, style: 'solid' }
    cfg002.panel = { ...cfg002.panel, style: 'ribbon' }
    const titleA = cfg001.i18n.zh.title
    const titleB = cfg002.i18n.zh.title
    await page.route('**/craft-001/config.json*', r => r.fulfill({ json: structuredClone(cfg001) }))
    await page.route('**/craft-002/config.json*', r => r.fulfill({ json: structuredClone(cfg002) }))
    const saves = []
    await page.route('**/studio-api/save', async route => {
      saves.push(route.request().postDataJSON())
      await route.fulfill({ json: { ok: true } })
    })
    await waitForStudioReady(page)
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-001', 'craft-002'])
    await page.locator('#en-hcolor').check()
    await page.locator('#v-hcolor').fill('#ff5500')
    await page.locator('#bapply').click()
    await page.waitForFunction(() => document.querySelector('#blog')?.textContent?.includes('完成'), null, { timeout: 20_000 })
    expect(saves).toHaveLength(2)
    const byEx = Object.fromEntries(saves.map(s => [s.ex, s.config]))
    expect(byEx['craft-001'].hotspotStyle.color).toBe('#ff5500')
    expect(byEx['craft-002'].hotspotStyle.color).toBe('#ff5500')
    expect(byEx['craft-001'].panel.style).toBe('solid')
    expect(byEx['craft-002'].panel.style).toBe('ribbon')
    expect(byEx['craft-001'].i18n.zh.title).toBe(titleA)
    expect(byEx['craft-002'].i18n.zh.title).toBe(titleB)
  })

  test('single save failure does not block other exhibits', async ({ page }) => {
    await page.route('**/studio-api/save', async route => {
      const body = route.request().postDataJSON()
      if (body.ex === 'craft-001') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ ok: false, error: 'mock fail' }) })
      } else {
        await route.fulfill({ json: { ok: true } })
      }
    })
    await waitForStudioReady(page)
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-001', 'craft-002'])
    await page.locator('#en-hcolor').check()
    await page.locator('#bapply').click()
    await page.waitForFunction(() => {
      const t = document.querySelector('#blog')?.textContent || ''
      return t.includes('完成') && t.includes('失败 1')
    }, null, { timeout: 20_000 })
    const log = await page.locator('#blog').textContent()
    expect(log).toMatch(/✗ craft-001/)
    expect(log).toMatch(/✓ craft-002/)
    await expect(page.locator('#bapply')).toBeEnabled()
  })
})
