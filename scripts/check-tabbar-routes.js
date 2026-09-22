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
  const rule = (sheet.match(/\.sheet\.above-tabbar\s*\{[\s\S]*?\}/) || [''])[0]
  const m = rule.match(/bottom:\s*calc\((\d+)rpx/)
  if (!m) {
    errs.push('components/ai-assistant/index.wxss 里没找到 .sheet.above-tabbar 的让位规则')
  } else if (hWxss !== null && Number(m[1]) !== hWxss) {
    errs.push(`书院助手抽屉让位 ${m[1]}rpx，但 tabbar 实际高 ${hWxss}rpx`)
  }

  /*
   * 抬了 bottom 就必须连着改**收起态的位移**。
   *
   * 抽屉收起靠 transform: translateY(100%)，而 100% 只等于抽屉自身的高度。
   * 一旦 bottom 把它的底边顶高 N，往下推完自身高度之后顶边正好停在
   * 离屏幕底 N 的位置 —— 也就是有 N 那么高的一截头一直露在屏幕上。
   *
   * 这个 bug 真出过：标签栏从 108rpx 长到 144rpx（加了回纹带），
   * bottom 跟着改了、位移没改，于是问答抽屉的头（玉牌 + 「知识问答」
   * + 那行小字）整条压在标签栏上。以前 108rpx 时没露馅，
   * 纯粹因为旧标签栏是不透明的、正好盖住 108rpx。
   *
   * 所以这里要求：收起态的位移里至少补上 bottom 那么多 rpx。
   */
  const tf = [...rule.matchAll(/transform:\s*translateY\(calc\(100%\s*\+\s*(\d+)rpx/g)]
  if (m && !tf.length) {
    errs.push('.sheet.above-tabbar 抬了 bottom 却没改收起态的位移 —— ' +
      `抽屉会有 ${m[1]}rpx 高的一截头露在标签栏上。\n` +
      '      收起态要写 transform: translateY(calc(100% + <让位高度> + 安全区))')
  } else if (m) {
    for (const t of tf) {
      if (Number(t[1]) < Number(m[1])) {
        errs.push(`.sheet.above-tabbar 收起态只往下推了 ${t[1]}rpx，` +
          `但 bottom 把它顶高了 ${m[1]}rpx —— 会露出 ${Number(m[1]) - Number(t[1])}rpx 的头`)
      }
    }
  }
  // 位移写在 .sheet.show 后面、权重又相同，必须另给一条更 specific 的展开态，
  // 否则抽屉永远打不开（点了没反应，比露头更难查）
  if (tf.length && !/\.sheet\.above-tabbar\.show\s*\{[^}]*translateY\(0\)/.test(sheet)) {
    errs.push('.sheet.above-tabbar 覆写了 transform，却没有 .sheet.above-tabbar.show —— ' +
      '展开态会被收起态的位移盖掉，抽屉打不开')
  }

  /*
   * 问答浮标的默认高度要盖过整条标签栏。
   *
   * 浮标是 fixed 的，离屏幕底 <bottom>rpx。标签栏一长高，这段距离就被吃掉：
   * 108 → 144 之后余量从 42rpx 掉到 6rpx，浮标的投影压在回纹带上，
   * 再高一点就压到 tab 按钮——那是「原生控件让位」的②，压住就按不到。
   *
   * ⚠ 这一条第一版只写了"盖过标签栏就行"。变异测试里把值改回 150
   * （= 真出过的那个回归，余量只剩 6rpx）**没报红** —— 150 确实 > 144。
   * 也就是说它守不住自己声称要守的东西。所以改成要求一段真正的余量：
   * 浮标的投影是 `0 12rpx 30rpx`，30rpx 的模糊半径意味着余量小于 30rpx
   * 时投影就已经糊在回纹带上了。取 40rpx，比模糊半径再宽一点。
   */
  const FAB_CLEARANCE_RPX = 40
  const fabDefault = (read('components/ai-assistant/index.js')
    .match(/bottom:\s*\{\s*type:\s*Number,\s*value:\s*(\d+)\s*\}/) || [])[1]
  if (!fabDefault) {
    errs.push('components/ai-assistant/index.js 里没解析到浮标的默认 bottom')
  } else if (hWxss !== null && Number(fabDefault) - hWxss < FAB_CLEARANCE_RPX) {
    errs.push(`问答浮标默认离底 ${fabDefault}rpx，标签栏占 ${hWxss}rpx，` +
      `只剩 ${Number(fabDefault) - hWxss}rpx 余量（要 ≥ ${FAB_CLEARANCE_RPX}rpx）—— ` +
      '浮标的投影会糊在回纹带上，再挤一点就压到 tab 按钮，按不到了')
  }

  /*
   * 回纹带必须有不透明的底。
   *
   * 设计稿里 .fret 是画在页面那张纸上的，自己的底色只有 7% 的金棕水。
   * 小程序这边整条栏住在一个 fixed 的空层里，背后什么都没有 ——
   * 不补一层纸，页面滚上来的内容和收起的抽屉会直接从纹样里透出来，
   * 回纹就"不见了"。真机上出过。
   */
  const barCss = read('custom-tab-bar/index.wxss')
  const wrap = (barCss.match(/\.tabbar-wrap\s*\{[\s\S]*?\}/) || [''])[0]
  if (!/background(-color)?:\s*var\(--paper\)/.test(wrap)) {
    errs.push('custom-tab-bar 的 .tabbar-wrap 没有不透明底色（background-color: var(--paper)）—— ' +
      '回纹带只有 7% 的底，背后的东西会透出来，纹样等于没画')
  }

  if (errs.length) {
    console.error('check-tabbar-routes 发现问题：')
    for (const e of errs) console.error('  ✗ ' + e)
    process.exit(1)
  }
  console.log(`check-tabbar-routes OK（${app.routes.length} 个 tab 页，让位 ${hWxss}rpx，三处一致）`)
}

main()
