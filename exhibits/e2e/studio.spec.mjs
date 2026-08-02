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
async function gotoStudioWithExhibits(page, exhibits) {
  const bodyJson = JSON.stringify({ exhibits, capabilities: { create: true, save: true, batch: true } })
  await page.addInitScript(json => {
    const stub = JSON.parse(json)
    const origFetch = window.fetch.bind(window)
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input))
      if (url.includes('studio-api/list')) {
        return Promise.resolve(new Response(JSON.stringify(stub), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      }
      return origFetch(input, init)
    }
  }, bodyJson)
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
    await expect(hint).toContainText('已配全景图')
    await expect(hint).toContainText('不会生效')
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
    cfg.assets = { ...(cfg.assets || {}), panorama: '../craft-001/assets/panorama.jpg' }
    await page.route('**/craft-001/config.json*', r => r.fulfill({ json: structuredClone(cfg) }))
    const saves = []
    await page.route('**/studio-api/save', async route => {
      saves.push(route.request().postDataJSON())
      await route.fulfill({ json: { ok: true } })
    })
    await waitForStudioReady(page)
    await openBatchPanel(page)
    await selectExhibits(page, ['craft-001'])
    await page.locator('#en-panoClear').check()
    await page.locator('#bapply').click()
    await page.waitForFunction(() => document.querySelector('#blog')?.textContent?.includes('完成'), null, { timeout: 20_000 })
    expect(saves).toHaveLength(1)
    expect(saves[0].config.assets.panorama).toBe('')
    expect(saves[0].config.environment.mode).toBe('preset')
  })

  test('批量五光源：写入 lights.*，方位角/仰角合成 position，未勾选的灯一律不碰', async ({ page }) => {
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
