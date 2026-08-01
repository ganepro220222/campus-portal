import { test, expect } from '@playwright/test'
import { gotoPlayer, reloadPlayer, releaseWebGL } from './helpers.mjs'

/** 3D 用例串行 + 复用同一 page，避免重复冷启动 WebGL */
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

const lightState = () => page.evaluate(() => window.__SY_TEST__.lightState())
const openLightSection = async () => {
  await page.evaluate(() => {
    for (const d of document.querySelectorAll('#editor details.ed-sec')) {
      if ((d.querySelector('summary')?.textContent || '').includes('灯光')) d.open = true
    }
  })
}
/** 拖滑条：设值并派发 input，与真实操作同一条代码路径 */
const setRange = async (k, v) => {
  await page.evaluate(([key, val]) => {
    const el = document.querySelector(`#editor input[type=range][data-k="${key}"]`)
    el.value = String(val)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }, [k, v])
}

test.describe('灯光面板', () => {
  test('四盏灯都有独立分块；只有方向光有方位角/仰角', async () => {
    await openLightSection()
    for (const k of ['ambient', 'key', 'fill', 'rim']) {
      await expect(page.locator(`#editor [data-lon="${k}"]`)).toHaveCount(1)
      await expect(page.locator(`#editor input[type=range][data-k="l.${k}.i"]`)).toHaveCount(1)
      await expect(page.locator(`#editor input[type=color][data-k="l.${k}.c"]`)).toHaveCount(1)
    }
    for (const k of ['key', 'fill', 'rim']) {
      await expect(page.locator(`#editor input[type=range][data-k="l.${k}.az"]`)).toHaveCount(1)
      await expect(page.locator(`#editor input[type=range][data-k="l.${k}.el"]`)).toHaveCount(1)
    }
    await expect(page.locator('#editor input[type=range][data-k="l.ambient.az"]')).toHaveCount(0)
    await expect(page.locator('#editor input[type=range][data-k="l.ambient.el"]')).toHaveCount(0)
  })

  test('环境光上限放宽到 2', async () => {
    await openLightSection()
    await expect(page.locator('#editor input[type=range][data-k="l.ambient.i"]')).toHaveAttribute('max', '2')
    await setRange('l.ambient.i', 1.8)
    expect((await lightState()).lights.ambient.intensity).toBeCloseTo(1.8, 3)
  })

  test('仰角拖到负值 → 光真的从下方打上来', async () => {
    await openLightSection()
    expect((await lightState()).lights.key.pos[1]).toBeGreaterThan(0)
    await setRange('l.key.el', -55)
    const st = await lightState()
    expect(st.lights.key.pos[1]).toBeLessThan(0)
    expect(st.cfgLights.key.position[1]).toBeLessThan(0)
  })

  test('改方位角不动仰角与半径', async () => {
    await openLightSection()
    const before = (await lightState()).lights.fill.pos
    const r0 = Math.hypot(...before)
    await setRange('l.fill.az', 150)
    const after = (await lightState()).lights.fill.pos
    expect(Math.hypot(...after)).toBeCloseTo(r0, 2)
    expect(after[1]).toBeCloseTo(before[1], 2)
    expect(after[0]).not.toBeCloseTo(before[0], 2)
  })

  test('取消「启用」→ 渲染强度归零但配置里的强度保留', async () => {
    await openLightSection()
    await setRange('l.rim.i', 0.9)
    await page.uncheck('#editor [data-lon="rim"]')
    let st = await lightState()
    expect(st.lights.rim.intensity).toBe(0)
    expect(st.cfgLights.rim.intensity).toBeCloseTo(0.9, 3)
    expect(st.cfgLights.rim.enabled).toBe(false)
    // 关闭状态下拖强度不会把灯偷偷点亮
    await setRange('l.rim.i', 1.5)
    st = await lightState()
    expect(st.lights.rim.intensity).toBe(0)
    expect(st.cfgLights.rim.intensity).toBeCloseTo(1.5, 3)
    await page.check('#editor [data-lon="rim"]')
    expect((await lightState()).lights.rim.intensity).toBeCloseTo(1.5, 3)
  })

  test('灯光跟随相机：三盏方向光挂在灯组上并随视角旋转', async () => {
    await openLightSection()
    let st = await lightState()
    for (const k of ['key', 'fill', 'rim']) expect(st.lights[k].inRig).toBe(true)
    expect(st.lights.ambient.inRig).toBe(false)
    expect(st.rigRotY).toBe(0)

    await page.check('#ed-light-follow')
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
    st = await lightState()
    expect(st.rigRotY).toBeCloseTo(st.camAzimuth, 3)
    expect(st.cfgLights.followCamera).toBe(true)

    await page.uncheck('#ed-light-follow')
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
    expect((await lightState()).rigRotY).toBe(0)
  })

  test('亮度诊断给出可执行建议且可收起', async () => {
    await openLightSection()
    await page.click('#ed-light-diag')
    const out = page.locator('#ed-light-diagout')
    await expect(out).not.toBeEmpty()
    await expect(page.locator('#ed-light-diag')).toHaveText(/收起诊断/)
    await page.click('#ed-light-diag')
    await expect(out).toBeEmpty()
    await expect(page.locator('#ed-light-diag')).toHaveText(/亮度诊断/)
  })

  test('恢复出厂灯光：还原强度与角度，且不收起当前分段', async () => {
    await openLightSection()
    await setRange('l.key.el', -80)
    await setRange('l.key.i', 2.4)
    page.once('dialog', d => d.accept())
    await page.click('#ed-light-reset')
    const st = await lightState()
    expect(st.lights.key.intensity).toBeCloseTo(1.1, 3)
    expect(st.lights.key.pos).toEqual([5, 8, 6])
    // 重绘后「灯光」分段应保持展开（renderEditor 会还原 details 状态）
    const stillOpen = await page.evaluate(() => [...document.querySelectorAll('#editor details.ed-sec')]
      .some(d => d.open && (d.querySelector('summary')?.textContent || '').includes('灯光')))
    expect(stillOpen).toBe(true)
  })
})

test.describe('环境 IBL', () => {
  test('environment.intensity / rotationDeg 真正作用到场景', async () => {
    await reloadPlayer(page, { environment: { intensity: 2.2, rotationDeg: 90 } })
    let st = await lightState()
    expect(st.envIntensity).toBeCloseTo(2.2, 3)
    expect(st.envRotY).toBeCloseTo(Math.PI / 2, 3)

    await page.evaluate(() => {
      for (const d of document.querySelectorAll('#editor details.ed-sec')) {
        if ((d.querySelector('summary')?.textContent || '').includes('环境 IBL')) d.open = true
      }
    })
    await setRange('e.int', 0.6)
    await setRange('e.rot', -45)
    st = await lightState()
    expect(st.envIntensity).toBeCloseTo(0.6, 3)
    expect(st.envRotY).toBeCloseTo(-Math.PI / 4, 3)
  })

  test('旧配置未写 environment.intensity / rotationDeg 时保持原样（1 / 0）', async () => {
    await reloadPlayer(page, { environment: { intensity: undefined, rotationDeg: undefined } })
    const st = await lightState()
    expect(st.envIntensity).toBe(1)
    expect(st.envRotY).toBe(0)
  })
})
