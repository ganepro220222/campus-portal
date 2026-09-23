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
   * 每个 tab 页自己也要给标签栏让出位置——而且不是"刚好盖住"就行。
   *
   * 上面那条只管住了问答浮标。页面**内容**的那一份当时漏了：
   * 四个 tab 页的底部留白都写着 150rpx，那是标签栏还只有 108rpx 时定的数。
   * 加了回纹带长到 144rpx 之后，净空隙从 42rpx 掉到 6rpx（3px）——
   * 滚到底时最后一块卡片几乎贴着回纹带。
   * 这条注释的上一段其实已经把"42 掉到 6"写出来了，却只去补了浮标，
   * 内容这一份就这么留在线上。所以补这一条。
   *
   * 余量取 40rpx：设计稿 home.html 给 .fret 的是 margin-top: 20px，
   * 也就是内容和回纹带之间本来就该有 20px = 40rpx 的一口气。
   *
   * 怎么找那块留白：取 wxml 里**最后**一个空 view，它的类在本页 wxss 里
   * 写着 height: calc(Nrpx + env(safe-area-inset-bottom))。
   * 找不到就报错——tab 页不给让位，内容一定会被压住。
   */
  const CONTENT_CLEARANCE_RPX = 40
  for (const route of app.routes) {
    const wxml = read(route + '.wxml')
    const wxss = read(route + '.wxss')
    const spacers = [...wxml.matchAll(/<view\s+class="([\w-]+)"\s*>\s*<\/view>/g)].map((m) => m[1])
    let found = null
    for (const cls of spacers.reverse()) {
      const re = new RegExp('\\.' + cls + '\\s*\\{[^}]*height:\\s*calc\\((\\d+)rpx\\s*\\+\\s*env\\(safe-area-inset-bottom\\)\\)')
      const hit = wxss.replace(/\/\*[\s\S]*?\*\//g, '').match(re)
      if (hit) { found = { cls, rpx: Number(hit[1]) }; break }
    }
    if (!found) {
      errs.push(`${route} 是 tab 页，却没找到底部留白 —— ` +
        'wxml 末尾要有一个空 view，它的类在 wxss 里写 ' +
        'height: calc(<N>rpx + env(safe-area-inset-bottom))，N 要盖过标签栏')
    } else if (hWxss !== null && found.rpx - hWxss < CONTENT_CLEARANCE_RPX) {
      errs.push(`${route} 底部只留了 ${found.rpx}rpx（.${found.cls}），标签栏占 ${hWxss}rpx，` +
        `净空隙 ${found.rpx - hWxss}rpx（要 ≥ ${CONTENT_CLEARANCE_RPX}rpx）—— ` +
        '滚到底时最后一块内容会贴着回纹带；设计稿那里本来有 20px 的一口气')
    }
  }

  /*
   * 回纹带有**两份**，必须画得一模一样。
   *
   * 自定义 tabBar 是页面之外的独立层，app.wxss 的 class 规则到不了那儿
   * （同理它也继承不到 page 上的令牌，见 build-tabbar-tokens.mjs），
   * 所以 .fret 在 app.wxss 和 custom-tab-bar/index.wxss 里各存一份：
   * 前者给二级页当分隔，后者给标签栏当收底。
   * 两份是同一个纹样，drift 了就是两处长得不一样的回纹。
   * 这里只比"画法"那几条（底色、两层贴图、错位、平铺、内阴影），
   * 不比 height/margin —— 那两处本来就该不同。
   */
  const PAINT = ['background-color', 'background-image', 'background-position',
                 'background-size', 'background-repeat', 'box-shadow']
  const fretPaint = (css, where) => {
    const rule = (css.replace(/\/\*[\s\S]*?\*\//g, '').match(/\.fret\s*\{[^}]*\}/) || [''])[0]
    if (!rule) { errs.push(`${where} 里找不到 .fret 规则`); return null }
    const out = {}
    for (const k of PAINT) {
      const m = rule.match(new RegExp(`${k}\\s*:\\s*([^;]+);`))
      if (m) out[k] = m[1].replace(/\s+/g, ' ').trim()
    }
    return out
  }
  const pApp = fretPaint(read('app.wxss'), 'app.wxss')
  const pBar = fretPaint(read('custom-tab-bar/index.wxss'), 'custom-tab-bar/index.wxss')
  if (pApp && pBar) {
    for (const k of PAINT) {
      if (pApp[k] !== pBar[k]) {
        errs.push(`两份 .fret 的 ${k} 不一致 —— 回纹带在二级页和标签栏上会长得不一样\n` +
          `      app.wxss                    → ${pApp[k] || '(没写)'}\n` +
          `      custom-tab-bar/index.wxss   → ${pBar[k] || '(没写)'}`)
      }
    }
  }

  /*
   * 回纹带必须有不透明的底。
   *
   * 设计稿里 .fret 是画在页面那张纸上的，自己的底色只有 7% 的金棕水。
   * 小程序这边整条栏住在一个 fixed 的空层里，背后什么都没有 ——
   * 不补一层纸，页面滚上来的内容和收起的抽屉会直接从纹样里透出来，
   * 回纹就"不见了"。真机上出过。
   */
  // 注意：.tabbar-wrap 在这个文件里有**两条**规则——生成的令牌副本占了第一条。
  // 只取第一条会永远取到副本（里面当然没有底色），所以把所有同名规则拼起来看。
  const barCss = read('custom-tab-bar/index.wxss')
  const wrap = [...barCss.matchAll(/\.tabbar-wrap\s*\{[^}]*\}/g)].map(x => x[0]).join('\n')
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
