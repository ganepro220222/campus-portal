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

test.describe('地面反射光（第五盏）', () => {
  test('旧配置里没有 bounce 键 → 面板显示未勾选，场景里也不亮', async () => {
    await reloadPlayer(page, {})
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
  test('默认关闭：不建地面、不开投影，旧展品零变化', async () => {
    await reloadPlayer(page, {})
    const st = await lightState()
    expect(st.shadow.rendererEnabled).toBe(false)
    expect(st.shadow.hasGround).toBe(false)
    expect(st.shadow.casters).toEqual([])
    expect(st.shadow.meshesCast).toBe(0)
  })

  test('开启后：只有主光投影，接触阴影与地面贴着模型底面，模型全部投影', async () => {
    await reloadPlayer(page, { shadow: { enabled: true } })
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

  test('浓度/柔化/地面高低三个滑条即时生效', async () => {
    const base = (await lightState()).shadow.modelMinY
    await setRange('sh.opacity', 0.75)
    await setRange('sh.soft', 7)
    await setRange('sh.offset', -0.12)
    const st = await lightState()
    expect(st.shadow.contactOpacity).toBeCloseTo(0.75 * 0.85, 2)
    expect(st.shadow.radius).toBeCloseTo(7, 2)
    expect(st.shadow.groundY).toBeCloseTo(base - 0.12, 2)
    expect(st.shadow.contactY).toBeCloseTo(base - 0.12 + 0.002, 3)
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
