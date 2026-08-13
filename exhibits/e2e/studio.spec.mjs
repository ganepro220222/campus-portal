import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

async function waitForStudioReady(page) {
  await page.goto('/studio.html')
  await page.waitForSelector('#grid .card', { timeout: 30_000 })
  await page.waitForSelector('#bwrap .bf', { state: 'attached', timeout: 15_000 })
}

async function gotoStudioWithListStub(page, capabilities) {
  const listRes = await page.request.get('studio-api/list')
  expect(listRes.ok()).toBeTruthy()
  const base = await listRes.json()
  const body = { exhibits: base.exhibits || [] }
  if (capabilities !== undefined) body.capabilities = capabilities
  const bodyJson = JSON.stringify(body)

  await page.addInitScript(jsonBody => {
    const stub = JSON.parse(jsonBody)
    const origFetch = window.fetch.bind(window)
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input))
      if (url.includes('studio-api/list')) {
        return Promise.resolve(new Response(JSON.stringify(stub), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      return origFetch(input, init)
    }
  }, bodyJson)

  await page.goto('/studio.html')
  await page.waitForSelector('#grid .card', { timeout: 30_000 })
  await expect.poll(async () => page.evaluate(async () => {
    const r = await fetch('studio-api/list', { cache: 'no-cache' })
    const d = await r.json()
    return d.capabilities?.create === true
  })).toBe(capabilities?.create === true)
}

/** 用构造的展品列表打开工作台（真实 craft-00x 四件都很齐全，测不出筛选） */
async function gotoStudioWithExhibits(page, exhibits, { checkPano = null, panoramas = [], panoVerifyTimeoutMs = null } = {}) {
  const bodyJson = JSON.stringify({ exhibits, capabilities: { create: true, save: true, batch: true }, panoramas })
  const checkPanoJson = JSON.stringify(checkPano)
  await page.addInitScript(({ json, checkPanoRules, panoVerifyTimeoutMs: tmo }) => {
    if (typeof tmo === 'number') window.__batchPanoVerifyTimeoutMs = tmo
    const stub = JSON.parse(json)
    const rules = checkPanoRules ? JSON.parse(checkPanoRules) : null
    window.__panoCheckWaiters = window.__panoCheckWaiters || {}
    window.deferPanoCheck = path => {
      if (!window.__panoCheckWaiters[path]) {
        window.__panoCheckWaiters[path] = new Promise(resolve => { window.__panoCheckWaiters[path + ':resolve'] = resolve })
      }
    }
    window.releasePanoCheck = (path, availability) => {
      const resolve = window.__panoCheckWaiters[path + ':resolve']
      if (resolve) resolve(availability)
    }
    const origFetch = window.fetch.bind(window)
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input))
      if (url.includes('studio-api/list')) {
        return Promise.resolve(new Response(JSON.stringify(stub), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      }
      if (url.includes('studio-api/check-panorama')) {
        const u = new URL(url, location.origin)
        const p = u.searchParams.get('path') || ''
        const respond = availability => Promise.resolve(new Response(JSON.stringify({ availability, exists: availability === true }), {
          status: 200, headers: { 'Content-Type': 'application/json' },
        }))
        if (window.__panoCheckWaiters[p]) {
          return new Promise((resolve, reject) => {
            const onAbort = () => reject(new DOMException('The operation was aborted.', 'AbortError'))
            const signal = init?.signal
            if (signal?.aborted) { onAbort(); return }
            signal?.addEventListener('abort', onAbort, { once: true })
            window.__panoCheckWaiters[p].then(value => {
              signal?.removeEventListener('abort', onAbort)
              resolve(respond(value ?? false))
            }, err => {
              signal?.removeEventListener('abort', onAbort)
              reject(err)
            })
          })
        }
        let availability = 'unknown'
        if (rules && Object.prototype.hasOwnProperty.call(rules, p)) availability = rules[p]
        else if (/missing|不存在/i.test(p)) availability = false
        else if (/^https?:\/\//i.test(p)) availability = 'unknown'
        else if (p.startsWith('/')) availability = 'unknown'
        else if (p.startsWith('../')) availability = true
        return respond(availability)
      }
      return origFetch(input, init)
    }
  }, { json: bodyJson, checkPanoRules: checkPanoJson, panoVerifyTimeoutMs })
  await page.goto('/studio.html')
  await page.waitForSelector('#grid .card', { timeout: 30_000 })
  await expect(page.locator('#grid .card')).toHaveCount(exhibits.length)
}

const domOrder = page => page.$$eval('#grid .card', els => els.map(e => e.dataset.dir))
const visibleOrder = page => page.$$eval('#grid .card:not([hidden])', els => els.map(e => e.dataset.dir))

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

  test('默认按目录序号升序，方向按钮翻转顺序且刷新后保持', async ({ page }) => {
    await waitForStudioReady(page)
    const asc = await domOrder(page)
    expect(asc).toEqual([...asc].sort())            // craft-001 … craft-004
    await expect(page.locator('#sortDir')).toHaveText('↑ 升序')

    await page.locator('#sortDir').click()
    await expect(page.locator('#sortDir')).toHaveText('↓ 降序')
    expect(await domOrder(page)).toEqual([...asc].reverse())

    await page.reload()
    await page.waitForSelector('#grid .card')
    await expect(page.locator('#sortDir')).toHaveText('↓ 降序')
    expect(await domOrder(page)).toEqual([...asc].reverse())
  })

  test('排序不重建卡片：重排后批量选中状态保留', async ({ page }) => {
    await waitForStudioReady(page)
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-002'])
    await page.locator('#sortDir').click()
    await expect(page.locator('.card[data-dir="craft-002"].sel')).toHaveCount(1)
    await expect(page.locator('#selN')).toHaveText('已选 1 件')
    await page.locator('#sortSel').selectOption('title')
    await expect(page.locator('.card[data-dir="craft-002"].sel')).toHaveCount(1)
  })

  test('筛选：待完善 / 缺模型 各自命中，计数与实际显示一致', async ({ page }) => {
    const pageErrors = []
    page.on('pageerror', e => pageErrors.push(e.message))
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-101', title: '齐全件', hotspots: 2, hasPano: true, usesPanorama: true, envMode: 'panorama', hasModel: true, panorama: 'assets/sunset.jpg', poster: 'craft-101/assets/poster.jpg', mtime: 300 },
      { dir: 'craft-102', title: '缺模型件', hotspots: 0, hasPano: false, hasModel: false, envPreset: 'gallery', poster: '', mtime: 100 },
      { dir: 'craft-103', title: '无全景件', hotspots: 1, hasPano: false, hasModel: true, envPreset: 'gallery', poster: 'craft-103/assets/poster.jpg', mtime: 200 },
    ])

    const chip = label => page.locator(`#filters .chip`, { hasText: label })
    await expect(chip('待完善')).toContainText('2')
    await expect(chip('缺模型')).toContainText('1')
    expect(await visibleOrder(page)).toEqual(['craft-101', 'craft-102', 'craft-103'])

    await chip('待完善').click()
    expect(await visibleOrder(page)).toEqual(['craft-102', 'craft-103'])
    await expect(page.locator('#s-count')).toContainText('显示 2 / 共 3 件')

    await chip('缺模型').click()
    expect(await visibleOrder(page)).toEqual(['craft-102'])

    await chip('全部').click()
    expect(await visibleOrder(page)).toHaveLength(3)
    await expect(page.locator('#s-count')).toContainText('3 件展品')
    expect(pageErrors).toEqual([])
  })

  test('筛选与搜索叠加；无结果时给出可理解的空态', async ({ page }) => {
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-101', title: '青瓷瓶', hotspots: 2, hasPano: true, usesPanorama: true, envMode: 'panorama', hasModel: true, panorama: 'assets/sunset.jpg', poster: 'p.jpg', mtime: 300 },
      { dir: 'craft-102', title: '木雕摆件', hotspots: 0, hasPano: false, hasModel: true, envPreset: 'gallery', poster: 'p.jpg', mtime: 100 },
    ])
    await page.fill('#search', '木雕')
    expect(await visibleOrder(page)).toEqual(['craft-102'])
    await page.locator('#filters .chip', { hasText: '无全景' }).click()
    expect(await visibleOrder(page)).toEqual(['craft-102'])
    await page.fill('#search', '青瓷')
    expect(await visibleOrder(page)).toEqual([])
    await expect(page.locator('#empty')).toBeVisible()
    await expect(page.locator('#empty')).toContainText('青瓷')
    await expect(page.locator('#empty')).toContainText('无全景')
  })

  test('按最后编辑排序，并在卡片上标出背景环境', async ({ page }) => {
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-101', title: '乙器', hotspots: 1, hasPano: true, usesPanorama: true, envMode: 'panorama', hasModel: true, panorama: 'assets/sunset.jpg', poster: 'p.jpg', mtime: 100 },
      { dir: 'craft-102', title: '甲器', hotspots: 1, hasPano: true, usesPanorama: true, envMode: 'panorama', hasModel: true, panorama: 'pano/sunset.jpg', poster: 'p.jpg', mtime: 300 },
      { dir: 'craft-103', title: '丙器', hotspots: 1, hasPano: false, hasModel: true, envPreset: 'gallery', poster: 'p.jpg', mtime: 200 },
    ])
    await expect(page.locator('.card[data-dir="craft-101"] .badge.env')).toHaveText('全景 · sunset.jpg')
    await expect(page.locator('.card[data-dir="craft-102"] .badge.env')).toHaveText('全景 · sunset.jpg')
    await expect(page.locator('.card[data-dir="craft-103"] .badge.env')).toHaveText('无全景 · 博物馆暖阁')

    await page.locator('#sortSel').selectOption('mtime')
    await expect(page.locator('#sortDir')).toHaveText('↓ 降序')   // 时间类默认从新到旧
    expect(await domOrder(page)).toEqual(['craft-102', 'craft-103', 'craft-101'])
  })

  test('按背景环境排序：同内容（同指纹）的展品挨在一起，同名不同图的不合并', async ({ page }) => {
    // 「同背景」的判据是服务端给的内容指纹，不是文件名——各展品自带的
    // assets/panorama.jpg 名字一样但往往是不同的图，不能靠名字归组。
    const SAME = '86f9f80fbcad3d86', OTHER = '0123456789abcdef'
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-101', title: '甲', hotspots: 1, hasPano: true, usesPanorama: true, envMode: 'panorama', hasModel: true, panorama: 'assets/panorama.jpg', panoramaHash: SAME, poster: 'p.jpg', mtime: 100 },
      { dir: 'craft-102', title: '乙', hotspots: 1, hasPano: true, usesPanorama: true, envMode: 'panorama', hasModel: true, panorama: 'assets/panorama.jpg', panoramaHash: OTHER, poster: 'p.jpg', mtime: 200 },
      { dir: 'craft-103', title: '丙', hotspots: 1, hasPano: true, usesPanorama: true, envMode: 'panorama', hasModel: true, panorama: 'bg/dawn.jpg', panoramaHash: SAME, poster: 'p.jpg', mtime: 300 },
    ])
    await page.locator('#sortSel').selectOption('env')
    const byEnv = await domOrder(page)
    // 101 与 103 路径不同但内容相同 → 必须相邻；102 路径与 101 相同但内容不同 → 不得夹在中间
    expect(Math.abs(byEnv.indexOf('craft-103') - byEnv.indexOf('craft-101'))).toBe(1)
    expect(Math.abs(byEnv.indexOf('craft-102') - byEnv.indexOf('craft-101'))).not.toBe(1)
  })

  test('批量面板：环境预设对已配全景图的展品不生效，按选择实时说明', async ({ page }) => {
    const pageErrors = []
    page.on('pageerror', e => pageErrors.push(e.message))
    await waitForStudioReady(page)
    await expect(page.locator('#grid .card')).not.toHaveCount(0)
    await page.click('#batchToggle')
    await expect(page.locator('#hint-epreset')).toBeEmpty()   // 未选时不该吓人
    await page.click('#selAll')
    const hint = page.locator('#hint-epreset')
    await expect(hint).toContainText('都在用全景')   // 文案随 batchPresetHint 改过，断言跟着走
    await expect(hint).toContainText('环境预设对它们不会生效')
    await expect(hint).toHaveClass(/warn/)
    await page.click('#selNone')
    await expect(hint).toBeEmpty()
    expect(pageErrors).toEqual([])
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

  test('全景图候选下拉：列出扫到的 2:1 图，选中即填入路径并自动勾选', async ({ page }) => {
    await waitForStudioReady(page)
    await openBatchPanel(page)
    const opts = await page.$$eval('#pick-pano option', els => els.map(o => o.value))
    expect(opts[0]).toBe('')                                   // 第一项是「手动输入」
    expect(opts.length).toBeGreaterThan(1)
    // 写进 config 的值必须是 ../ 开头：相对展品目录、部署到任何子路径都成立
    for (const v of opts.slice(1)) expect(v.startsWith('../')).toBe(true)

    expect(await page.isChecked('#en-pano')).toBe(false)
    await page.selectOption('#pick-pano', opts[1])
    expect(await page.inputValue('#v-pano')).toBe(opts[1])
    expect(await page.isChecked('#en-pano')).toBe(true)        // 选了图＝要改这一项
  })

  test('全景图候选：选中后应用，写进各展品 config 的就是这条相对路径', async ({ page }) => {
    const cfg = loadCfg('craft-001')
    await page.route('**/craft-001/config.json*', r => r.fulfill({ json: structuredClone(cfg) }))
    const saves = []
    await page.route('**/studio-api/save', async route => {
      saves.push(route.request().postDataJSON())
      await route.fulfill({ json: { ok: true } })
    })
    await waitForStudioReady(page)
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-001'])
    const opts = await page.$$eval('#pick-pano option', els => els.map(o => o.value))
    await page.selectOption('#pick-pano', opts[1])
    await page.locator('#bapply').click()
    await page.waitForFunction(() => document.querySelector('#blog')?.textContent?.includes('完成'), null, { timeout: 20_000 })
    expect(saves).toHaveLength(1)
    expect(saves[0].config.assets.panorama).toBe(opts[1])
    expect(saves[0].config.environment.mode).toBe('panorama')
  })

  test('批量清除全景：写空路径并改回 preset mode', async ({ page }) => {
    const cfg = loadCfg('craft-001')
    cfg.environment = { ...(cfg.environment || {}), mode: 'panorama' }
    cfg.assets = { ...(cfg.assets || {}), panorama: '../共享背景/8.jpg' }
    await page.route('**/craft-001/config.json*', r => r.fulfill({ json: structuredClone(cfg) }))
    const saves = []
    await page.route('**/studio-api/save', async route => {
      saves.push(route.request().postDataJSON())
      await route.fulfill({ json: { ok: true } })
    })
    await waitForStudioReady(page)
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-001'])
    await expect(page.locator('#row-panoClear input[type=checkbox]')).toHaveCount(1)
    await expect(page.locator('#v-panoClear')).toHaveCount(0)
    await page.locator('#en-panoClear').check()
    await page.locator('#bapply').click()
    await page.waitForFunction(() => document.querySelector('#blog')?.textContent?.includes('完成'), null, { timeout: 20_000 })
    expect(saves).toHaveLength(1)
    expect(saves[0].config.assets.panorama).toBe('')
    expect(saves[0].config.environment.mode).toBe('preset')
  })

  test('批量全景与清除互斥：选候选后启用清除会取消全景项', async ({ page }) => {
    await waitForStudioReady(page)
    await openBatchPanel(page)
    const opts = await page.$$eval('#pick-pano option', els => els.map(o => o.value))
    await page.selectOption('#pick-pano', opts[1])
    await expect(page.locator('#en-pano')).toBeChecked()
    await page.locator('#en-panoClear').check()
    await expect(page.locator('#en-pano')).not.toBeChecked()
    await expect(page.locator('#en-panoClear')).toBeChecked()
  })

  test('批量显示环境背景：room 展品且目标为 true 时给出提示', async ({ page }) => {
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-201', title: '房间A', hotspots: 0, hasPano: false, hasModel: true, envPreset: 'room', envMode: 'preset', mtime: 100 },
      { dir: 'craft-202', title: '房间B', hotspots: 0, hasPano: false, hasModel: true, envPreset: 'room', envMode: 'preset', mtime: 200 },
    ])
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-201', 'craft-202'])
    await page.locator('#en-bgvis').check()
    await page.locator('#v-bgvis').check()
    await expect(page.locator('#hint-bgvis')).toHaveClass(/warn/)
    await expect(page.locator('#hint-bgvis')).toContainText('2 件')
    await expect(page.locator('#hint-bgvis')).toContainText('不支持可见环境背景')
  })

  test('批量隐藏环境背景：room 展品目标为 false 时不警告', async ({ page }) => {
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-201', title: '房间A', hotspots: 0, hasPano: false, hasModel: true, envPreset: 'room', envMode: 'preset', mtime: 100 },
    ])
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-201'])
    await page.locator('#en-bgvis').check()
    await expect(page.locator('#v-bgvis')).not.toBeChecked()
    await expect(page.locator('#hint-bgvis')).not.toHaveClass(/warn/)
    await expect(page.locator('#hint-bgvis')).toHaveText('')
  })

  test('批量显示环境背景：room 与 gallery 混合且目标为 true 时部分提示', async ({ page }) => {
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-211', title: '房间', hotspots: 0, hasPano: false, hasModel: true, envPreset: 'room', envMode: 'preset', mtime: 100 },
      { dir: 'craft-212', title: '博物馆', hotspots: 0, hasPano: false, hasModel: true, envPreset: 'gallery', envMode: 'preset', mtime: 200 },
    ])
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-211', 'craft-212'])
    await page.locator('#en-bgvis').check()
    await page.locator('#v-bgvis').check()
    await expect(page.locator('#hint-bgvis')).toHaveClass(/warn/)
    await expect(page.locator('#hint-bgvis')).toContainText('2 件中有 1 件不支持')
    await expect(page.locator('#hint-bgvis')).toContainText('只会对其余 1 件生效')
  })

  test('手工输入全景路径：未验证时不误报 bgvis，验证后按结果提示', async ({ page }) => {
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-221', title: '房间', hotspots: 0, hasPano: false, hasModel: true, envPreset: 'room', envMode: 'preset', mtime: 100 },
    ], { checkPano: { '../共享背景/展厅.jpg': true, '../共享背景/缺失.jpg': false } })
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-221'])
    await page.locator('#en-bgvis').check()
    await page.locator('#v-bgvis').check()
    await expect(page.locator('#hint-bgvis')).toHaveClass(/warn/)
    await page.locator('#en-pano').check()
    await page.locator('#v-pano').fill('https://cdn.example.com/hall.jpg')
    await expect.poll(async () => page.locator('#hint-pano').textContent()).toMatch(/尚未验证/)
    await expect(page.locator('#hint-bgvis')).not.toHaveClass(/warn/)
    await page.locator('#v-pano').fill('../共享背景/缺失.jpg')
    await expect.poll(async () => page.locator('#hint-pano').textContent()).toMatch(/未找到/)
    await expect(page.locator('#hint-bgvis')).toHaveClass(/warn/)
    await expect(page.locator('#hint-epreset')).not.toHaveClass(/warn/)
    await page.locator('#v-pano').fill('../共享背景/展厅.jpg')
    await expect.poll(async () => page.locator('#hint-pano').textContent()).toBe('')
    await expect.poll(async () => (await page.locator('#hint-bgvis').getAttribute('class') || '').includes('warn')).toBe(false)
    await page.locator('#v-pano').fill('')
    await expect(page.locator('#hint-bgvis')).toHaveClass(/warn/)
  })

  test('慢速路径验证不会覆盖候选选择结果', async ({ page }) => {
    const missingPath = '../共享背景/缺失.jpg'
    const goodPath = '../共享背景/展厅.jpg'
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-222', title: '房间', hotspots: 0, hasPano: false, hasModel: true, envPreset: 'room', envMode: 'preset', mtime: 100 },
    ], {
      checkPano: { [missingPath]: false, [goodPath]: true },
      panoramas: [{ path: '共享背景/展厅.jpg', source: 'public', width: 4096, height: 2048 }],
    })
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-222'])
    await page.evaluate(p => { window.deferPanoCheck(p) }, missingPath)
    await page.locator('#en-pano').check()
    await page.locator('#v-pano').fill(missingPath)
    await page.waitForTimeout(250)
    await page.locator('#pick-pano').selectOption({ value: goodPath })
    await expect(page.locator('#hint-pano')).toHaveText('')
    await expect(page.locator('#v-pano')).toHaveValue(goodPath)
    await page.evaluate(p => window.releasePanoCheck(p, false), missingPath)
    await page.waitForTimeout(100)
    await expect(page.locator('#hint-pano')).toHaveText('')
    await expect(page.locator('#v-pano')).toHaveValue(goodPath)
  })

  test('缺失路径：立即应用会等待验证，取消 confirm 时不保存', async ({ page }) => {
    const missingPath = '../共享背景/缺失.jpg'
    let saveCount = 0
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-223', title: '房间', hotspots: 0, hasPano: false, hasModel: true, envPreset: 'room', envMode: 'preset', mtime: 100 },
    ], { checkPano: { [missingPath]: false } })
    await page.route('**/studio-api/save', async route => {
      saveCount++
      await route.fulfill({ json: { ok: true } })
    })
    await page.route(`**/craft-223/config.json*`, route => route.fulfill({
      json: { i18n: { zh: { title: '房间' } }, environment: { mode: 'preset', preset: 'room' }, assets: {} },
    }))
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-223'])
    await page.locator('#en-pano').check()
    await page.locator('#v-pano').fill(missingPath)
    const dialogSeen = page.waitForEvent('dialog')
    await page.locator('#bapply').click()
    const dialog = await dialogSeen
    expect(dialog.message()).toMatch(/未找到/)
    await dialog.dismiss()
    await expect.poll(() => saveCount, { timeout: 3000 }).toBe(0)
  })

  test('验证 pending 时应用会等待，取消 confirm 时不保存', async ({ page }) => {
    const missingPath = '../共享背景/缺失.jpg'
    let saveCount = 0
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-224', title: '房间', hotspots: 0, hasPano: false, hasModel: true, envPreset: 'room', envMode: 'preset', mtime: 100 },
    ], { checkPano: { [missingPath]: false } })
    await page.route('**/studio-api/save', async route => {
      saveCount++
      await route.fulfill({ json: { ok: true } })
    })
    await page.route(`**/craft-224/config.json*`, route => route.fulfill({
      json: { i18n: { zh: { title: '房间' } }, environment: { mode: 'preset', preset: 'room' }, assets: {} },
    }))
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-224'])
    await page.evaluate(p => { window.deferPanoCheck(p) }, missingPath)
    await page.locator('#en-pano').check()
    await page.locator('#v-pano').fill(missingPath)
    const dialogSeen = page.waitForEvent('dialog')
    const clickPromise = page.locator('#bapply').click()
    await page.waitForTimeout(100)
    await page.evaluate(p => window.releasePanoCheck(p, false), missingPath)
    const dialog = await dialogSeen
    expect(dialog.message()).toMatch(/未找到/)
    await dialog.dismiss()
    await clickPromise
    await expect.poll(() => saveCount, { timeout: 3000 }).toBe(0)
  })

  test('验证期间修改全景路径时不保存并提示重新应用', async ({ page }) => {
    const pathA = '../共享背景/缺失.jpg'
    const pathB = '../共享背景/展厅.jpg'
    let saveCount = 0
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-226', title: '房间', hotspots: 0, hasPano: false, hasModel: true, envPreset: 'room', envMode: 'preset', mtime: 100 },
    ], { checkPano: { [pathA]: false, [pathB]: true } })
    await page.route('**/studio-api/save', async route => {
      saveCount++
      await route.fulfill({ json: { ok: true } })
    })
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-226'])
    await page.evaluate(p => { window.deferPanoCheck(p) }, pathA)
    await page.locator('#en-pano').check()
    await page.locator('#v-pano').fill(pathA)
    const clickPromise = page.locator('#bapply').click()
    await page.waitForTimeout(50)
    await page.locator('#v-pano').fill(pathB)
    await page.evaluate(p => window.releasePanoCheck(p, false), pathA)
    await clickPromise
    await expect(page.locator('#blog')).toContainText('验证期间发生变化')
    await expect.poll(() => saveCount, { timeout: 3000 }).toBe(0)
  })

  test('check-panorama 永久 pending 时验证超时、按钮恢复、取消 confirm 不保存', async ({ page }) => {
    const hangPath = '../共享背景/挂起.jpg'
    let saveCount = 0
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-227', title: '房间', hotspots: 0, hasPano: false, hasModel: true, envPreset: 'room', envMode: 'preset', mtime: 100 },
    ], { panoVerifyTimeoutMs: 400 })
    await page.route('**/studio-api/save', async route => {
      saveCount++
      await route.fulfill({ json: { ok: true } })
    })
    await page.route(`**/craft-227/config.json*`, route => route.fulfill({
      json: { i18n: { zh: { title: '房间' } }, environment: { mode: 'preset', preset: 'room' }, assets: {} },
    }))
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-227'])
    await page.evaluate(p => { window.deferPanoCheck(p) }, hangPath)
    await page.locator('#en-pano').check()
    await page.locator('#v-pano').fill(hangPath)
    const dialogSeen = page.waitForEvent('dialog', { timeout: 5000 })
    const clickPromise = page.locator('#bapply').click()
    await expect(page.locator('#blog')).toContainText('正在验证全景路径', { timeout: 1000 })
    await expect(page.locator('#bapply')).toHaveText('正在验证…')
    const dialog = await dialogSeen
    expect(dialog.message()).toMatch(/无法完全验证/)
    await dialog.dismiss()
    await clickPromise
    await expect(page.locator('#bapply')).toBeEnabled()
    await expect(page.locator('#bapply')).toContainText('应用到')
    await expect.poll(() => saveCount, { timeout: 3000 }).toBe(0)
  })

  test('/ 开头路径：验证为 unknown 并提示子路径部署风险', async ({ page }) => {
    const rootPath = '/共享背景/展厅.jpg'
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-225', title: '房间', hotspots: 0, hasPano: false, hasModel: true, envPreset: 'room', envMode: 'preset', mtime: 100 },
    ])
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-225'])
    await page.locator('#en-pano').check()
    await page.locator('#v-pano').fill(rootPath)
    // locator.textContent() 返回的是 Promise，直接塞给 expect 会拿到对象而不是字符串
    // （报错原文：received value must be a string）。用自动重试的 toHaveText 一步到位。
    await expect(page.locator('#hint-pano')).toHaveText(/子路径部署/)
    await expect(page.locator('#hint-pano')).toHaveText(/404/)
  })

  test('仅改环境预设：全景展品提示 preset 当前不生效', async ({ page }) => {
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-331', title: '全景', hotspots: 0, hasPano: true, usesPanorama: true, envMode: 'panorama', envPreset: 'room', panorama: 'assets/p.jpg', hasModel: true, mtime: 100 },
    ])
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-331'])
    await page.locator('#en-epreset').check()
    await expect(page.locator('#hint-epreset')).toHaveClass(/warn/)
    await expect(page.locator('#hint-epreset')).toContainText('不会生效')
  })

  test('清除全景+环境预设：preset 提示不误报', async ({ page }) => {
    await gotoStudioWithExhibits(page, [
      { dir: 'craft-332', title: '全景', hotspots: 0, hasPano: true, usesPanorama: true, envMode: 'panorama', envPreset: 'room', panorama: 'assets/p.jpg', hasModel: true, mtime: 100 },
    ])
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-332'])
    await page.locator('#en-epreset').check()
    await page.selectOption('#v-epreset', 'gallery')
    await expect(page.locator('#hint-epreset')).toHaveClass(/warn/)
    await page.locator('#en-panoClear').check()
    await expect(page.locator('#hint-epreset')).not.toHaveClass(/warn/)
    await expect(page.locator('#hint-epreset')).toHaveText('')
  })

  test('连续批量：room→gallery 保存后第二次 bgvis 不误报', async ({ page }) => {
    let exhibit = {
      dir: 'craft-301', title: '测试器', hotspots: 0, hasPano: false, usesPanorama: false,
      envMode: 'preset', envPreset: 'room', hasModel: true, mtime: 100,
    }
    let cfg = {
      i18n: { zh: { title: '测试器' } },
      environment: { mode: 'preset', preset: 'room' },
      assets: {},
    }
    await page.route('**/studio-api/list*', route => route.fulfill({
      json: { exhibits: [{ ...exhibit }], capabilities: { create: true, save: true, batch: true }, panoramas: [] },
    }))
    await page.route('**/craft-301/config.json*', route => route.fulfill({ json: structuredClone(cfg) }))
    await page.route('**/studio-api/save', async route => {
      const body = route.request().postDataJSON()
      cfg = body.config
      exhibit = {
        ...exhibit,
        envPreset: cfg.environment?.preset || 'room',
        envMode: cfg.environment?.mode || 'preset',
        usesPanorama: cfg.environment?.mode === 'panorama' && !!String(cfg.assets?.panorama ?? '').trim(),
        hasPano: !!String(cfg.assets?.panorama ?? '').trim(),
      }
      await route.fulfill({ json: { ok: true } })
    })
    await page.goto('/studio.html')
    await page.waitForSelector('#grid .card', { timeout: 30_000 })
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-301'])
    await page.locator('#en-epreset').check()
    await page.selectOption('#v-epreset', 'gallery')
    await page.locator('#bapply').click()
    await page.waitForFunction(() => document.querySelector('#blog')?.textContent?.includes('完成'), null, { timeout: 20_000 })
    await expect(page.locator('.card[data-dir="craft-301"] .badge.env')).toContainText('博物馆暖阁')
    await page.locator('#en-epreset').uncheck()
    await page.locator('#en-bgvis').check()
    await page.locator('#v-bgvis').check()
    await expect(page.locator('#hint-bgvis')).not.toHaveClass(/warn/)
  })

  test('连续批量：清除全景后第二次 bgvis 基于 room 状态警告', async ({ page }) => {
    let exhibit = {
      dir: 'craft-302', title: '全景件', hotspots: 0, hasPano: true, usesPanorama: true,
      envMode: 'panorama', envPreset: 'room', panorama: 'assets/p.jpg', hasModel: true, mtime: 100,
    }
    let cfg = {
      i18n: { zh: { title: '全景件' } },
      environment: { mode: 'panorama', preset: 'room' },
      assets: { panorama: 'assets/p.jpg' },
    }
    await page.route('**/studio-api/list*', route => route.fulfill({
      json: { exhibits: [{ ...exhibit }], capabilities: { create: true, save: true, batch: true }, panoramas: [] },
    }))
    await page.route('**/craft-302/config.json*', route => route.fulfill({ json: structuredClone(cfg) }))
    await page.route('**/studio-api/save', async route => {
      const body = route.request().postDataJSON()
      cfg = body.config
      const pano = String(cfg.assets?.panorama ?? '').trim()
      exhibit = {
        ...exhibit,
        envPreset: cfg.environment?.preset || 'room',
        envMode: cfg.environment?.mode || 'preset',
        panorama: pano,
        usesPanorama: cfg.environment?.mode === 'panorama' && !!pano,
        hasPano: !!pano,
      }
      await route.fulfill({ json: { ok: true } })
    })
    await page.goto('/studio.html')
    await page.waitForSelector('#grid .card', { timeout: 30_000 })
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-302'])
    await page.locator('#en-panoClear').check()
    await page.locator('#bapply').click()
    await page.waitForFunction(() => document.querySelector('#blog')?.textContent?.includes('完成'), null, { timeout: 20_000 })
    await expect(page.locator('.card[data-dir="craft-302"] .badge.env')).toContainText('内置房间')
    await page.locator('#en-panoClear').uncheck()
    await page.locator('#en-bgvis').check()
    await page.locator('#v-bgvis').check()
    await expect(page.locator('#hint-bgvis')).toHaveClass(/warn/)
    await expect(page.locator('#hint-bgvis')).toContainText('不支持可见环境背景')
  })

  test('批量五光源：写入 lights.*，方位角/仰角合成 position，未勾选的灯一律不碰', async ({ page }) => {
    const cfg = loadCfg('craft-001')
    // 出厂 config 可能已有 enabled；本测只验证「未勾启用时不新写 enabled」
    for (const k of ['key', 'fill', 'rim', 'ambient', 'bounce']) {
      if (cfg.lights?.[k]) delete cfg.lights[k].enabled
    }
    await page.route('**/craft-001/config.json*', r => r.fulfill({ json: structuredClone(cfg) }))
    const saves = []
    await page.route('**/studio-api/save', async route => {
      saves.push(route.request().postDataJSON())
      await route.fulfill({ json: { ok: true } })
    })
    await waitForStudioReady(page)
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-001'])

    // 只勾主光的「强度」和「方位」，以及整组的「跟随相机」
    await page.evaluate(() => {
      for (const id of ['en-l-key-i', 'en-l-key-pos', 'en-lfollow']) document.getElementById(id).click()
      const set = (id, v) => { const el = document.getElementById(id); el.value = String(v); el.dispatchEvent(new Event('input', { bubbles: true })) }
      set('v-l-key-i', 2.2)
      set('v-l-key-pos-az', -30)
      set('v-l-key-pos-el', 35)
      document.getElementById('v-lfollow').checked = true
    })
    await page.locator('#bapply').click()
    await page.waitForFunction(() => document.querySelector('#blog')?.textContent?.includes('完成'), null, { timeout: 20_000 })

    expect(saves).toHaveLength(1)
    const L = saves[0].config.lights
    expect(L.key.intensity).toBeCloseTo(2.2, 5)
    expect(L.followCamera).toBe(true)
    // 位置由两个角度合成；反解回来必须是原来那一对
    expect(Array.isArray(L.key.position)).toBe(true)
    const [x, y, z] = L.key.position
    const r = Math.hypot(x, y, z)
    expect(Math.asin(y / r) * 180 / Math.PI).toBeCloseTo(35, 1)
    expect(Math.atan2(x, z) * 180 / Math.PI).toBeCloseTo(-30, 1)
    // 没勾的字段一律保持原值
    expect(L.key.color).toBe(cfg.lights.key.color)
    expect(L.fill).toEqual(cfg.lights.fill)
    expect(L.rim).toEqual(cfg.lights.rim)
    expect('enabled' in L.key).toBe(false)          // 没勾「启用」就不该写 enabled
  })

  test('批量灯光：地面反射光默认值保持「缺省即关闭」，不因批量而被打开', async ({ page }) => {
    await waitForStudioReady(page)
    await openBatchPanel(page)
    // bounce 是可选灯，其「启用」默认值必须是 false；其余四盏默认 true
    const defs = await page.evaluate(() => ({
      bounce: document.getElementById('v-l-bounce-on').checked,
      key: document.getElementById('v-l-key-on').checked,
      ambient: document.getElementById('v-l-ambient-on').checked,
    }))
    expect(defs.bounce).toBe(false)
    expect(defs.key).toBe(true)
    expect(defs.ambient).toBe(true)
  })

  test('批量灯光：环境光没有方位角/仰角（点光源没有方向）', async ({ page }) => {
    await waitForStudioReady(page)
    await openBatchPanel(page)
    await expect(page.locator('#v-l-ambient-pos-az')).toHaveCount(0)
    for (const k of ['key', 'fill', 'rim', 'bounce']) {
      await expect(page.locator(`#v-l-${k}-pos-az`)).toHaveCount(1)
      await expect(page.locator(`#v-l-${k}-pos-el`)).toHaveCount(1)
    }
  })

  /* 老坑：flex item 的自动最小尺寸是 min-content，方位那两根滑条不显式 min-width:0
     就会把整块顶出卡片外（实测右溢 110px）。窄屏更容易触发，所以三档宽度都验。 */
  for (const width of [900, 1280, 1600]) {
    test(`${width}px：批量面板里没有任何控件溢出所在卡片（方位滑条老坑）`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await waitForStudioReady(page)
      await openBatchPanel(page)
      await page.evaluate(() => document.querySelectorAll('details.bsub').forEach(d => { d.open = true }))
      const over = await page.evaluate(() => [...document.querySelectorAll('#bwrap *')].filter(el => {
        const par = el.parentElement
        if (!par) return false
        const r = el.getBoundingClientRect(), pr = par.getBoundingClientRect()
        if (!r.width || !r.height) return false
        if (getComputedStyle(par).overflow !== 'visible') return false   // 可滚动容器允许内容更宽
        return r.right > pr.right + 1.5 || r.left < pr.left - 1.5
      }).map(el => {
        const r = el.getBoundingClientRect(), pr = el.parentElement.getBoundingClientRect()
        return `${el.tagName.toLowerCase()}.${(el.className || '').toString().trim().split(/\s+/).join('.')} 溢出 ${Math.round(Math.max(r.right - pr.right, pr.left - r.left))}px`
      }))
      expect(over).toEqual([])
    })
  }

  test('批量面板：方位两根滑条各占一整行，且都在卡片内', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 })
    await waitForStudioReady(page)
    await openBatchPanel(page)
    await page.evaluate(() => document.querySelectorAll('details.bsub').forEach(d => { d.open = true }))
    const geo = await page.evaluate(() => {
      const card = document.querySelector('#row-l-key-pos').closest('.bgroup')
      const cr = card.getBoundingClientRect()
      const rows = ['az', 'el'].map(ax => document.getElementById('v-l-key-pos-' + ax).closest('.bang').getBoundingClientRect())
      return { cardRight: cr.right, rows: rows.map(r => ({ right: r.right, top: Math.round(r.top) })) }
    })
    for (const r of geo.rows) expect(r.right).toBeLessThanOrEqual(geo.cardRight + 1)
    expect(geo.rows[0].top).not.toBe(geo.rows[1].top)     // 各占一行，不是并排挤在一起
  })

  /* 全景候选下拉与手输框并排时各剩 126px，选项名和路径都只露半截。
     `.bpick` 那条被后面更具体的 `.bf .ctl select` 用 flex:1 盖掉了，所以选择器要写得更具体。 */
  /* 下拉留在控件列（跟别的行左右对齐），手输框另起一行占满卡片。
     踩过的坑：`.bf input[type=text]` 里的属性选择器算一级特异性，
     `.bwide` 光一个类名压不住它的 flex:1，输入框会缩回控件列跟下拉挤成一排。 */
  test('全景贴图：下拉在控件列、手输框独占一整行', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 })
    await waitForStudioReady(page)
    await openBatchPanel(page)
    const g = await page.evaluate(() => {
      const r = el => { const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), bottom: b.bottom } }
      const card = document.getElementById('row-pano').closest('.bgroup')
      const cr = card.getBoundingClientRect(), cs = getComputedStyle(card)
      return { pick: r(document.getElementById('pick-pano')), input: r(document.getElementById('v-pano')),
        otherSel: r(document.getElementById('v-epreset')),          // 同卡片里别的行的下拉
        cardLeft: cr.left + parseFloat(cs.paddingLeft), cardRight: cr.right - parseFloat(cs.paddingRight),
        inputFlexBasis: getComputedStyle(document.getElementById('v-pano')).flexBasis }
    })
    expect(g.pick.x).toBe(g.otherSel.x)                     // 下拉与其他行的下拉左对齐
    expect(g.input.y).toBeGreaterThan(g.pick.y + 10)        // 输入框在下一行，不是并排
    expect(g.inputFlexBasis).toBe('100%')                   // 属性选择器没把它压回控件列
    expect(g.input.x).toBeLessThanOrEqual(Math.round(g.cardLeft) + 1)     // 从卡片内缘起
    expect(g.input.x + g.input.w).toBeGreaterThanOrEqual(Math.round(g.cardRight) - 1)   // 一直铺到内缘
    expect(g.input.w).toBeGreaterThan(g.pick.w * 1.8)       // 路径框明显比下拉宽
  })

  /* 抽屉底下凭空多出横向滚动条：卡片 flex-basis 是 260px，但 min-width 默认 auto，
     全景下拉的长选项文本把「环境 IBL」那张卡顶到 411px，六张一加就越过视口宽度。
     1903 = 1920 屏减掉页面竖条后的实际视口，正是用户碰到的那一档。 */
  for (const width of [1400, 1903, 2200]) {
    test(`${width}px：批量卡片一律等宽，抽屉不额外长出横向滚动条`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await waitForStudioReady(page)
      await openBatchPanel(page)
      await page.locator('#selAll').click()
      await page.locator('#en-panoClear').click()      // 勾一项，提示文案会出现
      await page.waitForTimeout(150)
      const g = await page.evaluate(() => {
        const w = document.getElementById('bwrap')
        return { sw: w.scrollWidth, cw: w.clientWidth,
          cards: [...w.querySelectorAll('.bgroup')].map(c => Math.round(c.getBoundingClientRect().width)) }
      })
      expect(new Set(g.cards).size).toBe(1)            // 所有卡片同宽
      expect(g.cards[0]).toBe(260)
      // 内容宽度不许超过容器：视口够宽时就不该出现横条
      if (width >= 1903) expect(g.sw).toBeLessThanOrEqual(g.cw)
    })
  }

  test('全景候选下拉：占位文字显示得下，选项收短，完整路径全靠 title 气泡', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 })
    await waitForStudioReady(page)
    await openBatchPanel(page)
    // optgroup 的标签底色跟不上 color-scheme，会浅底浅字看不清；来源改用选项文本前缀表达
    await expect(page.locator('#pick-pano optgroup')).toHaveCount(0)
    const opts = await page.$$eval('#pick-pano option', os => os.map(o => ({ t: o.textContent, title: o.title, v: o.value })))
    expect(opts[0].t).toBe('手动输入')
    for (const o of opts.slice(1)) {
      expect(o.t).toMatch(/^(已配置|公共背景) · /)
      expect(o.t).not.toMatch(/（\d+×\d+）/)              // 尺寸不进列表，弹窗不该为它撑宽
      expect(o.title).toMatch(/（\d+×\d+）$/)             // 尺寸进气泡
      expect(o.title).toContain(o.v.replace('../', ''))    // 气泡是完整路径
      expect(o.title.length).toBeGreaterThan(o.t.length)   // 列表文案确实比气泡短
    }
    // 占位文字要在控件列里放得下（含原生下拉箭头），换套字体也不能被切
    const fit = await page.evaluate(() => {
      const sel = document.getElementById('pick-pano'), cs = getComputedStyle(sel)
      const g = document.createElement('canvas').getContext('2d')
      g.font = `${cs.fontSize} ${cs.fontFamily}`
      const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
      return { need: g.measureText(sel.options[0].textContent).width, room: sel.clientWidth - pad - 20 }
    })
    expect(fit.room).toBeGreaterThan(fit.need + 20)
    // 选一张图：完整路径进两个 title，输入框同步
    const values = opts.map(o => o.v).filter(Boolean)
    await page.selectOption('#pick-pano', values[0])
    expect(await page.getAttribute('#pick-pano', 'title')).toContain(values[0].replace('../', ''))
    expect(await page.getAttribute('#v-pano', 'title')).toBe(values[0])
  })

  test('清除全景：标签与说明同一行，不被 92px 标签列压成两行', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 })
    await waitForStudioReady(page)
    await openBatchPanel(page)
    const g = await page.evaluate(() => {
      const row = document.getElementById('row-panoClear')
      const lb = row.querySelector('.lb'), note = row.querySelector('.act-note')
      const lines = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getClientRects().length }
      const rr = row.getBoundingClientRect()
      return { lbLines: lines(lb), noteLines: lines(note),
        sameRow: Math.abs(lb.getBoundingClientRect().top - note.getBoundingClientRect().top) < 6,
        rowH: Math.round(rr.height),
        noteX: Math.round(note.getBoundingClientRect().x),
        otherCtlX: Math.round(document.getElementById('v-epreset').getBoundingClientRect().x),
        right: note.getBoundingClientRect().right, cardRight: row.closest('.bgroup').getBoundingClientRect().right }
    })
    expect(g.lbLines).toBe(1)
    expect(g.noteLines).toBe(1)
    expect(g.sameRow).toBe(true)
    expect(g.right).toBeLessThanOrEqual(g.cardRight + 1)
    expect(g.noteX).toBe(g.otherCtlX)   // 说明要从别的行的控件列起头，否则看着错位
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

  test('create exhibit modal creates blank craft from template', async ({ page }) => {
    const testDir = 'craft-987'
    const testPath = path.join(ROOT, testDir)
    if (fs.existsSync(testPath)) fs.rmSync(testPath, { recursive: true, force: true })
    try {
      await waitForStudioReady(page)
      await page.locator('#newToggle').click()
      await expect(page.locator('#newModal.open')).toHaveCount(1)
      await page.fill('#newDir', '987')
      await page.fill('#newTitle', 'E2E 新建测试')
      await page.locator('#newSubmit').click()
      await page.waitForSelector(`.card[data-dir="${testDir}"]`, { timeout: 20_000 })
      const cfg = loadCfg(testDir)
      expect(cfg.hotspots).toEqual([])
      expect(cfg.i18n.zh.title).toBe('E2E 新建测试')
      const idx = fs.readFileSync(path.join(testPath, 'index.html'), 'utf8')
      expect(idx).toContain('ex=craft-987')
    } finally {
      if (fs.existsSync(testPath)) fs.rmSync(testPath, { recursive: true, force: true })
    }
  })

  test('create modal opens when capabilities.create is true', async ({ page }) => {
    await gotoStudioWithListStub(page, { create: true, save: true, batch: true })
    await page.locator('#newToggle').click()
    await expect(page.locator('#newModal.open')).toHaveCount(1)
  })

  for (const [label, capabilities] of [
    ['false', { create: false, save: true, batch: true }],
    ['missing', undefined],
  ]) {
    test(`create blocked when capabilities.create is ${label}`, async ({ page }) => {
      const creates = []
      page.on('request', r => { if (r.url().includes('studio-api/create')) creates.push(r.url()) })

      await gotoStudioWithListStub(page, capabilities)

      let capturedMessage = ''
      await Promise.all([
        page.waitForEvent('dialog').then(async dialog => {
          capturedMessage = dialog.message()
          await dialog.accept()
        }),
        page.locator('#newToggle').click(),
      ])
      expect(capturedMessage).toMatch(/未提供|新建展品/)

      await expect(page.locator('#newModal.open')).toHaveCount(0)
      expect(creates).toEqual([])
    })
  }
})
