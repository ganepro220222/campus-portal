import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gotoPlayer, reloadPlayer, releaseWebGL, baseCfg } from './helpers.mjs'

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
    // craft-001 默认 followCamera=true；先关再测，避免 rigRotY 初始值等于 camAzimuth
    if (await page.locator('#ed-light-follow').isChecked()) {
      await page.uncheck('#ed-light-follow')
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))
    }
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

test.describe('地面反射光（第五盏）', () => {
  test('旧配置里没有 bounce 键 → 面板显示未勾选，场景里也不亮', async () => {
    const lights = { ...baseCfg().lights }
    delete lights.bounce
    await reloadPlayer(page, { lights, lightsReplace: true })
    await openLightSection()
    await expect(page.locator('#editor [data-lon="bounce"]')).not.toBeChecked()
    const st = await lightState()
    expect(st.lights.bounce.intensity).toBe(0)
    expect(st.cfgLights.bounce).toBeUndefined()
  })

  test('勾选后从下方补光，取消后回到不亮', async () => {
    await openLightSection()
    await page.check('#editor [data-lon="bounce"]')
    let st = await lightState()
    expect(st.lights.bounce.intensity).toBeGreaterThan(0)
    expect(st.lights.bounce.pos[1]).toBeLessThan(0)   // 仰角为负才叫「地面反射」
    expect(st.lights.bounce.inRig).toBe(true)
    await page.uncheck('#editor [data-lon="bounce"]')
    st = await lightState()
    expect(st.lights.bounce.intensity).toBe(0)
    expect(st.cfgLights.bounce.enabled).toBe(false)
  })
})

test.describe('落地阴影', () => {
  const openShadowSection = () => page.evaluate(() => {
    for (const d of document.querySelectorAll('#editor details.ed-sec')) {
      if ((d.querySelector('summary')?.textContent || '').includes('落地阴影')) d.open = true
    }
  })

  test('默认关闭：不建地面、不开投影，旧展品零变化', async () => {
    await reloadPlayer(page, {})
    const st = await lightState()
    expect(st.shadow.rendererEnabled).toBe(false)
    expect(st.shadow.hasGround).toBe(false)
    expect(st.shadow.casters).toEqual([])
    expect(st.shadow.meshesCast).toBe(0)
  })

  test('开启后：只有主光投影，接触阴影与地面贴着模型底面，模型全部投影', async () => {
    await reloadPlayer(page, { shadow: { enabled: true, groundOffset: 0 } })
    const st = await lightState()
    expect(st.shadow.rendererEnabled).toBe(true)
    expect(st.shadow.autoUpdate).toBe(false)          // 静态场景不逐帧重算阴影
    expect(st.shadow.hasGround).toBe(true)
    expect(st.shadow.hasContact).toBe(true)
    expect(st.shadow.casters).toEqual(['key'])
    expect(st.shadow.meshesCast).toBeGreaterThan(0)
    expect(st.shadow.groundY).toBeCloseTo(st.shadow.modelMinY, 2)
    expect(st.shadow.contactY).toBeCloseTo(st.shadow.modelMinY, 2)
    expect(st.shadow.groundSpan).toBeGreaterThan(st.shadow.contactSpan)  // 承影面比接触斑大
  })

  test('展台默认随阴影开启，可单独关掉换回纯接影面', async () => {
    await reloadPlayer(page, { shadow: { enabled: true, plate: true, groundOffset: 0 } })
    let st = await lightState()
    expect(st.shadow.plate).toBe(true)
    expect(st.shadow.plateColor).toBe('#2b2f3a')
    await page.evaluate(() => {
      for (const d of document.querySelectorAll('#editor details.ed-sec')) {
        if ((d.querySelector('summary')?.textContent || '').includes('落地阴影')) d.open = true
      }
    })
    await page.uncheck('#ed-shadow-plate')
    st = await lightState()
    expect(st.shadow.plate).toBe(false)
    expect(st.shadow.hasGround).toBe(true)     // 仍有承影面，只是不可见
    await page.check('#ed-shadow-plate')
    expect((await lightState()).shadow.plate).toBe(true)
  })

  test('浓度/柔化/承影面高低三个滑条即时生效', async () => {
    const base = (await lightState()).shadow.modelMinY
    await setRange('sh.opacity', 0.75)
    await setRange('sh.soft', 7)
    await setRange('sh.offset', -0.06)
    const st = await lightState()
    expect(st.shadow.contactOpacity).toBeCloseTo(0.75 * 0.85, 2)
    expect(st.shadow.radius).toBeCloseTo(7, 2)
    expect(st.shadow.groundY).toBeCloseTo(base - 0.06, 2)
    expect(st.shadow.contactY).toBeCloseTo(base - 0.06 + 0.002, 3)
    expect(st.shadow.modelMinY).toBeCloseTo(base, 5)   // 动的是承影面，器物不许跟着走
  })

  /* 这根滑条只挪承影面。量程收窄前是 ±0.3，能把承影面推到离器物底面 0.3 远，
     器物看着就像浮在空中——被当成 bug 报过。要挪器物请用 模型摆放 → 位移。 */
  /* 「位移 Y 把展台一起抬走了，是 bug 吗」——不是。承影面永远钉在模型底面 + 承影面高低上，
     所以挪器物时展台跟着走、器物绝不会脱离展台；唯一能拉开缝的是承影面高低本身。
     这条把两者的分工钉死：位移 Y 不改变间距，间距完全等于承影面高低。 */
  test('位移 Y 只整体升降：承影面跟着器物走，间距始终等于承影面高低', async () => {
    await reloadPlayer(page, { shadow: { enabled: true } })
    await openShadowSection()
    for (const off of [0, -0.08, 0.05]) {
      await setRange('sh.offset', off)
      const heights = []
      for (const y of [0, 0.3, -0.3]) {
        await setRange('m.py', y)
        const st = (await lightState()).shadow
        expect(st.modelMinY - st.groundY).toBeCloseTo(-off, 3)   // 间距只由承影面高低决定
        heights.push(st.modelMinY)
      }
      expect(heights[1]).toBeGreaterThan(heights[0])             // 位移 Y 确实抬高了器物
      expect(heights[2]).toBeLessThan(heights[0])
    }
    await setRange('m.py', 0)
    await setRange('sh.offset', 0)
    const st = (await lightState()).shadow
    expect(st.groundY).toBeCloseTo(st.modelMinY, 3)              // 归零＝严丝合缝
  })

  test('承影面高低：量程收在 ±0.08，接触斑始终贴着承影面', async () => {
    const slider = page.locator('#editor input[type=range][data-k="sh.offset"]')
    await expect(slider).toHaveAttribute('min', '-0.08')
    await expect(slider).toHaveAttribute('max', '0.08')
    const base = (await lightState()).shadow.modelMinY
    for (const v of [-0.08, 0, 0.08]) {
      await setRange('sh.offset', v)
      const st = await lightState()
      expect(st.shadow.modelMinY).toBeCloseTo(base, 5)
      expect(st.shadow.groundY).toBeCloseTo(base + v, 3)
      expect(st.shadow.contactY - st.shadow.groundY).toBeCloseTo(0.002, 3)   // 接触斑不许脱离承影面
    }
  })

  test('承影面高低：老配置里的大数值不会被滑条截断', async () => {
    await reloadPlayer(page, { shadow: { enabled: true, groundOffset: -0.25 } })
    // reload 会把 details 状态清回默认；本段后面的用例要点这里面的控件，得重新展开
    await openShadowSection()
    const slider = page.locator('#editor input[type=range][data-k="sh.offset"]')
    await expect(slider).toHaveAttribute('min', '-0.25')       // 量程临时放宽到装得下
    await expect(slider).toHaveValue('-0.25')
    const st = await lightState()
    expect(st.shadow.groundY).toBeCloseTo(st.shadow.modelMinY - 0.25, 3)
  })

  test('关掉展台后，浓度作用在承影面上', async () => {
    await page.uncheck('#ed-shadow-plate')
    await setRange('sh.opacity', 0.6)
    const st = await lightState()
    expect(st.shadow.plate).toBe(false)
    expect(st.shadow.opacity).toBeCloseTo(0.6, 2)
    await page.check('#ed-shadow-plate')
    expect((await lightState()).shadow.opacity).toBe(1)   // 展台自身不透明，浓度交给影子
  })

  test('关掉开关会拆掉地面，避免留下一块空平面', async () => {
    await page.uncheck('#ed-shadow-on')
    let st = await lightState()
    expect(st.shadow.hasGround).toBe(false)
    expect(st.shadow.meshesCast).toBe(0)
    await page.check('#ed-shadow-on')
    st = await lightState()
    expect(st.shadow.hasGround).toBe(true)
    expect(st.shadow.casters).toEqual(['key'])
  })

  test('主光转到水平面以下时提示「只剩接触阴影」', async () => {
    await openLightSection()
    await setRange('l.key.el', -40)
    await expect(page.locator('#ed-shadow-warn')).toContainText('只剩接触阴影')
    await setRange('l.key.el', 45)
    await expect(page.locator('#ed-shadow-warn')).toBeEmpty()
  })

  test('编辑器关闭主光时 key.castShadow 立即同步', async () => {
    await openLightSection()
    expect((await lightState()).shadow.casters).toEqual(['key'])
    await page.uncheck('#editor [data-lon="key"]')
    expect((await lightState()).shadow.casters).toEqual([])
    await page.check('#editor [data-lon="key"]')
    expect((await lightState()).shadow.casters).toEqual(['key'])
  })

  test('主光强度归零时 key.castShadow 立即同步', async () => {
    await openLightSection()
    await setRange('l.key.i', 0)
    expect((await lightState()).shadow.casters).toEqual([])
    await setRange('l.key.i', 1.1)
    expect((await lightState()).shadow.casters).toEqual(['key'])
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

  test('有全景图时全景优先，预设只作兜底', async () => {
    await reloadPlayer(page, { environment: { preset: 'studio' } })
    const st = await lightState()
    expect(st.envSource.kind).toBe('panorama')
    expect(st.hasEnvMap).toBe(true)
  })

  test('全景接管时预设下拉禁用并常驻说明，不让人白选', async () => {
    await reloadPlayer(page, { environment: { preset: 'studio' } })
    const openEnv = () => page.evaluate(() => {
      for (const d of document.querySelectorAll('#editor details.ed-sec')) {
        d.open = (d.querySelector('summary')?.textContent || '').includes('环境 IBL')
      }
    })
    await openEnv()
    await expect(page.locator('#ed-env-preset')).toBeDisabled()
    await expect(page.locator('#editor')).toContainText('预设被全景接管')
    await expect(page.locator('#ed-pano-clear')).toHaveCount(1)

    page.once('dialog', d => d.accept())
    await page.click('#ed-pano-clear')
    await openEnv()
    await expect(page.locator('#ed-env-preset')).toBeEnabled()
    await expect(page.locator('#editor')).not.toContainText('预设被全景接管')
    await expect(page.locator('#ed-pano-clear')).toHaveCount(0)   // 已无全景可清
    expect((await lightState()).envSource.kind).toBe('preset')

    // 现在换预设必须真的生效
    await page.selectOption('#ed-env-preset', 'night')
    expect((await lightState()).envSource).toEqual({ kind: 'preset', preset: 'night' })
  })

  test('全景文件加载失败时，编辑器如实显示回落到的预设而不是「全景图」', async () => {
    await reloadPlayer(page, {
      environment: { preset: 'gallery' },
      assets: { panorama: 'assets/根本不存在.jpg' },
    })
    await page.waitForTimeout(1200)   // 等 TextureLoader 报错并回落
    await page.evaluate(() => {
      for (const d of document.querySelectorAll('#editor details.ed-sec')) {
        d.open = (d.querySelector('summary')?.textContent || '').includes('环境 IBL')
      }
    })
    await expect(page.locator('#editor')).toContainText('全景图加载失败')
    await expect(page.locator('#editor')).toContainText('博物馆暖阁')
    await expect(page.locator('#ed-env-preset')).toBeEnabled()   // 全景没生效，就别锁着人家
    await expect(page.locator('#ed-pano-clear')).toHaveCount(1)
    expect((await lightState()).envSource).toEqual({ kind: 'preset', preset: 'gallery' })

    await page.selectOption('#ed-env-preset', 'night')
    expect((await lightState()).envSource).toEqual({ kind: 'preset', preset: 'night' })
  })

  test('全景加载失败后重试成功时，编辑器同步清除失败提示', async () => {
    const panoUrl = 'assets/retry-pano.jpg'
    let serveOk = false
    const panoBytes = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../共享背景/8.jpg'))
    await page.route(`**/${panoUrl}`, route => {
      if (serveOk) route.fulfill({ status: 200, contentType: 'image/jpeg', body: panoBytes })
      else route.fulfill({ status: 404, body: 'not found' })
    })
    try {
      await reloadPlayer(page, {
        environment: { preset: 'gallery' },
        assets: { panorama: panoUrl },
      })
      await page.waitForTimeout(1200)
      await page.evaluate(() => {
        for (const d of document.querySelectorAll('#editor details.ed-sec')) {
          d.open = (d.querySelector('summary')?.textContent || '').includes('环境 IBL')
        }
      })
      await expect(page.locator('#editor')).toContainText('全景图加载失败')

      serveOk = true
      await page.fill('#ed-pano', panoUrl)
      await page.click('#ed-pano-load')
      await page.waitForFunction(() => {
        const ed = document.getElementById('editor')
        return ed && !ed.textContent.includes('全景图加载失败')
      }, null, { timeout: 15_000 })
      await expect(page.locator('#ed-env-preset')).toBeDisabled()
      expect((await lightState()).envSource.kind).toBe('panorama')
    } finally {
      await page.unroute(`**/${panoUrl}`)
    }
  })

  test('去掉全景后按预设程序化生成环境，无需任何素材', async () => {
    await reloadPlayer(page, { environment: { mode: 'preset', preset: 'studio' }, assets: { panorama: '' } })
    let st = await lightState()
    expect(st.envSource).toEqual({ kind: 'preset', preset: 'studio' })
    expect(st.hasEnvMap).toBe(true)

    await page.evaluate(() => {
      for (const d of document.querySelectorAll('#editor details.ed-sec')) {
        if ((d.querySelector('summary')?.textContent || '').includes('环境 IBL')) d.open = true
      }
    })
    for (const name of ['gallery', 'overcast', 'night', 'room']) {
      await page.selectOption('#ed-env-preset', name)
      st = await lightState()
      expect(st.envPreset).toBe(name)
      expect(st.envSource.kind).toBe(name === 'room' ? 'room' : 'preset')
      expect(st.hasEnvMap).toBe(true)   // 每次切换都必须留下可用环境，不能变成空
    }
  })

  test('可见环境背景：程序化预设也能当背景显示', async () => {
    await reloadPlayer(page, {
      environment: { mode: 'preset', preset: 'overcast', visibleBackground: true },
      assets: { panorama: '' },
    })
    expect((await lightState()).backgroundIsTexture).toBe(true)
    await reloadPlayer(page, {
      environment: { mode: 'preset', preset: 'overcast', visibleBackground: false },
      assets: { panorama: '' },
    })
    expect((await lightState()).backgroundIsTexture).toBe(false)
  })

  test('勾选可见环境背景后立即显示预设背景（无需保存刷新）', async () => {
    await reloadPlayer(page, {
      environment: { mode: 'preset', preset: 'overcast', visibleBackground: false },
      assets: { panorama: '' },
    })
    expect((await lightState()).backgroundIsTexture).toBe(false)
    await page.evaluate(() => {
      for (const d of document.querySelectorAll('#editor details.ed-sec')) {
        if ((d.querySelector('summary')?.textContent || '').includes('环境 IBL')) d.open = true
      }
    })
    await page.evaluate(() => {
      const cb = document.querySelector('#editor input[data-k="e.bg"]')
      cb.checked = true
      cb.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect((await lightState()).backgroundIsTexture).toBe(true)
    await page.evaluate(() => {
      const cb = document.querySelector('#editor input[data-k="e.bg"]')
      cb.checked = false
      cb.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect((await lightState()).backgroundIsTexture).toBe(false)
  })

  test('内置 room 不支持可见环境背景：checkbox 禁用', async () => {
    await reloadPlayer(page, {
      environment: { mode: 'preset', preset: 'room', visibleBackground: true },
      assets: { panorama: '' },
    })
    const st = await lightState()
    expect(st.visibleBgSupported).toBe(false)
    expect(st.visibleBgDisabled).toBe(true)
    expect(st.backgroundIsTexture).toBe(false)
  })
})

test.describe('预设（灯光方案）', () => {
  test('应用预设会一并还原环境与阴影，但不动展品的全景图', async () => {
    await reloadPlayer(page, {
      environment: { intensity: 1.15, rotationDeg: 0 },
      shadow: { enabled: false },
      presets: [{
        id: 'p1', label: { zh: '带阴影方案' }, exposure: 1.3, envMapIntensity: 1.5,
        environment: { preset: 'studio', intensity: 2.1, rotationDeg: 60 },
        shadow: { enabled: true, opacity: 0.5, softness: 4, groundOffset: 0 },
        lights: { key: { intensity: 1.4, position: [5, 8, 6] }, bounce: { enabled: true, intensity: 0.4 } },
        showAsButton: true,
      }],
    })
    await page.click('#presets .preset[data-id="p1"]')
    const st = await lightState()
    expect(st.envIntensity).toBeCloseTo(2.1, 3)
    expect(st.envRotY).toBeCloseTo(Math.PI / 3, 3)
    expect(st.shadow.rendererEnabled).toBe(true)
    expect(st.shadow.hasGround).toBe(true)
    expect(st.lights.bounce.intensity).toBeCloseTo(0.4, 3)
    expect(st.envSource.kind).toBe('panorama')   // 全景图仍在，没被预设顶掉
  })

  test('旧预设（没有 environment / shadow 字段）照常工作', async () => {
    await reloadPlayer(page, {
      shadow: { enabled: false },
      presets: [{ id: 'old', label: { zh: '老预设' }, exposure: 1.4, envMapIntensity: 1.6, showAsButton: true }],
    })
    await page.click('#presets .preset[data-id="old"]')
    const st = await lightState()
    expect(st.shadow.rendererEnabled).toBe(false)
    expect(st.envIntensity).toBeCloseTo(1.15, 3)
  })
})

test.describe('材质覆盖', () => {
  const openMat = () => page.evaluate(() => {
    for (const d of document.querySelectorAll('#editor details.ed-sec')) {
      if ((d.querySelector('summary')?.textContent || '').trim() === '材质') d.open = true
    }
  })
  const ovState = () => page.evaluate(() => ({
    on: document.getElementById('ed-ov-on').checked,
    disabled: document.querySelector('#editor input[type=range][data-k="ov.metal"]').disabled,
    metal: +document.querySelector('#editor input[type=range][data-k="ov.metal"]').value,
    rough: +document.querySelector('#editor input[type=range][data-k="ov.rough"]').value,
    note: document.getElementById('ed-ov-note').textContent.trim(),
  }))
  const toggleOv = () => page.evaluate(() => {
    const c = document.getElementById('ed-ov-on'); c.checked = !c.checked
    c.dispatchEvent(new Event('change', { bubbles: true }))
  })
  const mats = () => page.evaluate(() => window.__SY_TEST__.materialsConfig())
  const live = () => page.evaluate(() => window.__SY_TEST__.materialLive())

  test.beforeEach(async () => {
    await reloadPlayer(page, { mode: 'edit' })
    await openMat()
  })

  test('失效的 envMapIntensity 滑条已从界面移除（全局与覆盖各一处）', async () => {
    await expect(page.locator('#editor input[type=range][data-k="g.env"]')).toHaveCount(0)
    await expect(page.locator('#editor input[type=range][data-k="ov.env"]')).toHaveCount(0)
    // 曝光 / 金属度 / 粗糙度 三根必须还在
    for (const k of ['g.exposure', 'g.metal', 'g.rough']) {
      await expect(page.locator(`#editor input[type=range][data-k="${k}"]`)).toHaveCount(1)
    }
  })

  test('默认未启用覆盖：滑条禁用、回填材质真实值、config 不写任何东西', async () => {
    const st = await ovState()
    expect(st.on).toBe(false)
    expect(st.disabled).toBe(true)
    expect(st.note).toContain('跟随上方全局设置')
    const cur = (await live())[0]
    expect(st.metal).toBeCloseTo(cur.metalness, 5)
    expect(st.rough).toBeCloseTo(cur.roughness, 5)
    expect((await mats()).overrides || []).toEqual([])
  })

  test('未启用时拖覆盖滑条不写 config（老实现会静默建条目）', async () => {
    await setRange('ov.metal', 1)
    await setRange('ov.rough', 0.05)
    expect((await mats()).overrides || []).toEqual([])
  })

  test('勾选启用＝按当前真实值建条目，材质实际取值不跳变', async () => {
    const before = (await live())[0]
    await toggleOv()
    const ov = (await mats()).overrides
    expect(ov).toHaveLength(1)
    expect(ov[0].metalness).toBeCloseTo(before.metalness, 5)
    expect(ov[0].roughness).toBeCloseTo(before.roughness, 5)
    const after = (await live())[0]
    expect(after.metalness).toBeCloseTo(before.metalness, 5)
    expect(after.roughness).toBeCloseTo(before.roughness, 5)
  })

  test('只动一项就只写一项——另一项必须保持原值', async () => {
    const before = (await live())[0]
    await toggleOv()
    await setRange('ov.rough', 0.93)
    const o = (await mats()).overrides[0]
    expect(o.roughness).toBeCloseTo(0.93, 5)
    expect(o.metalness).toBeCloseTo(before.metalness, 5)   // 没碰过，不能被改
    expect('envMapIntensity' in o).toBe(false)             // 失效字段不得再写进 config
  })

  test('取消勾选＝删除该条目，材质回到全局值', async () => {
    await toggleOv()
    await setRange('ov.metal', 1)
    expect((await live())[0].metalness).toBeCloseTo(1, 5)
    await setRange('g.metal', 0.3)
    expect((await live())[0].metalness).toBeCloseTo(1, 5)  // 覆盖压住全局，这是正确语义
    await toggleOv()
    expect((await mats()).overrides).toEqual([])
    expect((await live())[0].metalness).toBeCloseTo(0.3, 5)  // 回到全局值
    expect((await ovState()).disabled).toBe(true)
  })

  test('存在覆盖时，全局滑条旁给出「对它不生效」的提示', async () => {
    await toggleOv()
    await page.evaluate(() => window.__edRefresh && window.__edRefresh())
    await openMat()
    await expect(page.locator('#editor')).toContainText('个材质被覆盖')
  })

  /* 多材质：craft-001 的模型只有一个材质，切换材质相关的回归在它身上测不出来。
     renderEditor 会整段重建面板，<select> 是新元素、默认落回第一项 —— 曾经因此
     「给第 2 个材质开覆盖」会当场跳回第 1 个材质，用户再点一次就在错材质上多出一条。 */
  test.describe('多材质', () => {
    const matSel = () => page.evaluate(() => document.getElementById('ed-matsel').value)
    const pickMat = name => page.selectOption('#ed-matsel', name)

    test.beforeEach(async () => {
      await reloadPlayer(page, { mode: 'edit', assets: { model: '../e2e/fixtures/two-material.gltf' } })
      await openMat()
    })

    test('下拉列出模型里的全部具名材质', async () => {
      expect(await page.$$eval('#ed-matsel option', os => os.map(o => o.value))).toEqual(['Body', 'Trim'])
    })

    test('给第二个材质开覆盖后，选中项不得跳回第一个', async () => {
      await pickMat('Trim')
      expect(await matSel()).toBe('Trim')
      await toggleOv()
      expect(await matSel()).toBe('Trim')                       // 面板重绘不许顶掉选择
      expect(await page.isChecked('#ed-ov-on')).toBe(true)
      const ov = (await mats()).overrides
      expect(ov.map(x => x.namePattern)).toEqual(['Trim'])       // 只有 Trim，不许连坐 Body
      expect((await ovState()).note).toContain('Trim')
    })

    test('拖动写进当前选中的材质，另一个材质不受影响', async () => {
      await pickMat('Trim')
      await toggleOv()
      await setRange('ov.metal', 0.77)
      const ov = (await mats()).overrides
      expect(ov).toHaveLength(1)
      expect(ov[0]).toMatchObject({ namePattern: 'Trim' })
      expect(ov[0].metalness).toBeCloseTo(0.77, 5)
      const byName = Object.fromEntries((await live()).map(m => [m.name, m]))
      expect(byName.Trim.metalness).toBeCloseTo(0.77, 5)
      expect(byName.Body.metalness).not.toBeCloseTo(0.77, 5)
    })

    test('切回没有覆盖的材质：勾选框复位、滑条禁用、回填它自己的真实值', async () => {
      await pickMat('Trim')
      await toggleOv()
      await setRange('ov.metal', 0.77)
      await pickMat('Body')
      const st = await ovState()
      expect(st.on).toBe(false)
      expect(st.disabled).toBe(true)
      const body = (await live()).find(m => m.name === 'Body')
      expect(st.metal).toBeCloseTo(body.metalness, 5)
      // 再切回去，覆盖值必须原样回来
      await pickMat('Trim')
      const back = await ovState()
      expect(back.on).toBe(true)
      expect(back.metal).toBeCloseTo(0.77, 5)
    })

    test('精确 namePattern 优先于更短的子串规则', async () => {
      await page.evaluate(() => {
        window.__SY_TEST__.setOverridesForTest([
          { namePattern: 'Bod', metalness: 0.9 },
          { namePattern: 'Body', metalness: 0.3 },
        ])
      })
      await page.evaluate(() => window.__edRefresh())
      await openMat()
      await pickMat('Body')
      // 材质真实取值：精确条目 0.3 压过子串条目 0.9，这是这条规则的全部意义
      const body = (await live()).find(m => m.name === 'Body')
      expect(body.metalness).toBeCloseTo(0.3, 5)
      // 「Body」有自己的条目，所以勾选框是选中的，提示走「使用下面的值」那一支
      const st = await ovState()
      expect(st.on).toBe(true)
      expect(st.metal).toBeCloseTo(0.3, 5)
      expect(st.note).toContain('「Body」')
      expect(st.note).not.toContain('分组命中')   // 有自己的条目就不该说是被别人带的
    })

    test('被别人的 namePattern 按子串命中时，提示要说清是跟着那条走', async () => {
      // applyMaterial 用 includes 匹配：'Bod' 会连带命中 'Body'
      await page.evaluate(() => {
        window.__SY_TEST__.setOverridesForTest([{ namePattern: 'Bod', metalness: 0.9 }])
      })
      await page.evaluate(() => window.__edRefresh())
      await openMat()
      await pickMat('Body')
      const st = await ovState()
      expect(st.on).toBe(false)                    // 没有自己的条目
      expect(st.note).toContain('名称包含')   // 但不能说「跟随上方全局设置」
      expect(st.note).toContain('Bod')
    })

    test('config 里 namePattern 大小写与模型材质名不同时编辑器状态一致', async () => {
      await page.evaluate(() => {
        window.__SY_TEST__.setOverridesForTest([{ namePattern: 'body', metalness: 0.8, roughness: 0.4 }])
      })
      await page.evaluate(() => window.__edRefresh())
      await openMat()
      await pickMat('Body')
      const st = await ovState()
      expect(st.on).toBe(true)
      expect(st.metal).toBeCloseTo(0.8, 5)
      await setRange('ov.metal', 0.55)
      const ov = (await mats()).overrides
      expect(ov.length).toBe(1)
      expect(ov[0].namePattern).toBe('Body')
      expect(ov[0].metalness).toBeCloseTo(0.55, 5)
      await toggleOv()
      expect((await mats()).overrides || []).toEqual([])
    })
  })
})
