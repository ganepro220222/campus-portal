#!/usr/bin/env node
/**
 * tabBar 路由三处一致性检查。
 *
 * 自定义 tabBar 的页面清单同时写在三个地方：
 *   1. miniapp/app.json          → tabBar.list（微信按这份决定哪些页面显示 tabbar）
 *   2. miniapp/custom-tab-bar/index.js → data.list（真正画出来的那四个按钮）
 *   3. miniapp/utils/tabRoutes.js      → TAB_ROUTES（浮层用来判断要不要给 tabbar 让位）
 *
 * 改漏任意一处的后果都不显眼但真实：少一条 → 该页的书院助手抽屉底部被 tabbar 切掉；
 * 多一条 → 非 tab 页平白空出 108rpx。这里把三份比一遍。
 *
 * 顺带检查 tabbar 高度：utils/tabRoutes.js 的 TAB_BAR_HEIGHT_RPX 必须等于
 * custom-tab-bar/index.wxss 里**这条固定栏占掉的全部高度**，让位才对得上。
 *
 * 注意「全部高度」是 .fret + .tabbar 两段之和，不是 .tabbar 一段。
 * 标签栏上方那条回纹带和栏身一起装在同一个 fixed 的 .tabbar-wrap 里，
 * 一样挡着页面内容。只按 .tabbar 算的话，浮层会被回纹带压掉 40rpx，
 * 且这类偏差在模拟器上不明显——真机上是输入框顶着一条纹样。
 *
 * 安全区不在这个数里：它由 .tabbar 的 padding-bottom 占，
 * 让位的地方各自再 + env(safe-area-inset-bottom)，两边都这么算。
 *
 * 用法：node scripts/check-tabbar-routes.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const miniappDir = path.join(root, 'miniapp')
const read = (p) => fs.readFileSync(path.join(miniappDir, p), 'utf8')

const norm = (p) => String(p).replace(/^\//, '')

function fromAppJson() {
  const cfg = JSON.parse(read('app.json'))
  const list = (cfg.tabBar && cfg.tabBar.list) || []
  return { custom: !!(cfg.tabBar && cfg.tabBar.custom), routes: list.map((i) => norm(i.pagePath)) }
}

function fromCustomTabBar() {
  const src = read('custom-tab-bar/index.js')
  return [...src.matchAll(/path:\s*'([^']+)'/g)].map((m) => norm(m[1]))
}

function fromTabRoutes() {
  const src = read('utils/tabRoutes.js')
  const block = src.match(/const TAB_ROUTES = \[([\s\S]*?)\]/)
  if (!block) return null
  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => norm(m[1]))
}

/**
 * 这条固定栏一共占掉多少 rpx = 回纹带 + 栏身。
 * 两段都要能量到；少量到一段就返回 null，由调用方报错——
 * 「量不到就当 0」会让让位悄悄少一截，正是这里要防的。
 */
function heightFromWxss() {
  const src = read('custom-tab-bar/index.wxss')
  const parts = {}
  for (const sel of ['.fret', '.tabbar']) {
    const m = src.match(new RegExp(`\\${sel}\\s*\\{[\\s\\S]*?height:\\s*(\\d+(?:\\.\\d+)?)rpx`))
    if (!m) return { total: null, parts }
    parts[sel] = Number(m[1])
  }
  return { total: parts['.fret'] + parts['.tabbar'], parts }
}

function heightFromUtil() {
  const m = read('utils/tabRoutes.js').match(/TAB_BAR_HEIGHT_RPX\s*=\s*(\d+)/)
  return m ? Number(m[1]) : null
}

function main() {
  const errs = []
  const app = fromAppJson()
  const bar = fromCustomTabBar()
  const util = fromTabRoutes()

  if (!app.custom) {
    // 原生 tabBar 由客户端绘制，浮层让位的算法完全不同，改了要重新验一遍
    errs.push('app.json 的 tabBar.custom 不再是 true；书院助手抽屉的让位逻辑需重新核对')
  }
  if (!util) {
    errs.push('utils/tabRoutes.js 里没解析到 TAB_ROUTES')
  }

  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i])
  if (util && !same(app.routes, util)) {
    errs.push(`utils/tabRoutes.js 的 TAB_ROUTES 与 app.json 的 tabBar.list 不一致：\n` +
      `      app.json          → ${app.routes.join(', ')}\n` +
      `      utils/tabRoutes.js → ${util.join(', ')}`)
  }
  if (!same(app.routes, bar)) {
    errs.push(`custom-tab-bar/index.js 的 list 与 app.json 的 tabBar.list 不一致：\n` +
      `      app.json              → ${app.routes.join(', ')}\n` +
      `      custom-tab-bar/index.js → ${bar.join(', ')}`)
  }

  const { total: hWxss, parts } = heightFromWxss()
  const hUtil = heightFromUtil()
  if (hWxss === null || hUtil === null) {
    errs.push('取不到 tabbar 高度（custom-tab-bar/index.wxss 的 .fret + .tabbar height，' +
      '或 utils/tabRoutes.js 的 TAB_BAR_HEIGHT_RPX）')
  } else if (hWxss !== hUtil) {
    const detail = Object.entries(parts).map(([k, v]) => `${k} ${v}`).join(' + ')
    errs.push(`tabbar 高度对不上：custom-tab-bar/index.wxss 是 ${hWxss}rpx（${detail}），` +
      `utils/tabRoutes.js 的 TAB_BAR_HEIGHT_RPX 是 ${hUtil}rpx`)
  }

  // 让位用的数值直接写在 ai-assistant 的 wxss 里，也要跟着这个高度
  const sheet = read('components/ai-assistant/index.wxss')
  const m = sheet.match(/\.sheet\.above-tabbar\s*\{[\s\S]*?bottom:\s*calc\((\d+)rpx/)
  if (!m) {
    errs.push('components/ai-assistant/index.wxss 里没找到 .sheet.above-tabbar 的让位规则')
  } else if (hWxss !== null && Number(m[1]) !== hWxss) {
    errs.push(`书院助手抽屉让位 ${m[1]}rpx，但 tabbar 实际高 ${hWxss}rpx`)
  }

  if (errs.length) {
    console.error('check-tabbar-routes 发现问题：')
    for (const e of errs) console.error('  ✗ ' + e)
    process.exit(1)
  }
  console.log(`check-tabbar-routes OK（${app.routes.length} 个 tab 页，让位 ${hWxss}rpx，三处一致）`)
}

main()
