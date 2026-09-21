#!/usr/bin/env node
/**
 * 把设计稿里的线性器物图标搬进小程序的图标库。
 *
 * 为什么只搬一部分：48 枚图标不是一类东西。
 *   · **身份类**——出现得大、承担品牌：tabBar 四枚、首页五入口、问答浮标、
 *     顶栏的人和铃。这些该是器物，是这套设计的脸面。
 *   · **控件类**——出现得小、紧挨着文字、要一眼认出：返回、关闭、搜索、
 *     播放、下载、眼睛。这些是国际通用符号，改成器物只会让人认不出；
 *     传统设计里也没有把"关闭"画成器物的道理。故宫那套 app 也是这么分的。
 * 所以这个脚本只换身份类，控件类留给人工逐枚调线宽、让它们和器物是一家人。
 *
 * 设计源在 design/demo/v2/_ornaments.py 的 lico_*，viewBox 是 32；
 * 小程序的 buildSrc 写死 24，所以这里包一层 scale()，
 * **不去缩放路径数据本身**——路径里有圆弧，`a rx ry rot large sweep x y`
 * 的三个 flag 不能跟着乘，逐个数字缩放一定会把弧画坏。
 *
 * 尺寸：不是统一缩 0.75，而是**逐枚量墨迹、逐枚定缩放**。
 * 先在真 SVG 引擎里量控件类那批的墨迹，最长边的中位数是 18（24 框内）——
 * 这是这套图标现成的视觉尺寸基准。于是每枚器物按 s = 18 / 最长边 缩，
 * 大家的视觉重量才一致。统一缩一个系数试过，山门的墨迹宽会到 28，
 * 超出 24 的 viewBox，直接被裁掉。
 *
 * 线宽跟着缩放反着走：缩放会把描边一起缩细，所以每枚的 w = 1.7 / s，
 * 渲染出来都是 1.7（24 框内 7%）。设计稿原本是 1.6/32 = 5%，
 * 放到 23px 的 tabBar 上只有 1.15 物理像素，未选中态会糊掉。
 *
 * 用法：node scripts/build-line-icons.mjs
 * 跑完要再跑 node scripts/measure-icon-centering.mjs，把它给的 c 填回去。
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ICONS_JS = path.join(ROOT, 'miniapp/components/icon/icons.js')
const TARGET = 18      // 墨迹最长边的目标值（24 框内），取自控件类那批的中位数
const STROKE = 1.7     // 渲染出来的描边宽度（24 框内）

/** 小程序图标名 → 设计稿器物名。一个器物可以供几个名字用。 */
const MAP = {
  'home':           ['shanmen',     '山门'],
  'news':           ['jiandu',      '简牍'],
  'entry-news':     ['jiandu',      '简牍'],
  'museum':         ['ding',        '鼎'],
  'course':         ['ce',          '书册'],
  'book':           ['ce',          '书册'],
  'user-circle':    ['rusheng',     '儒生半身'],
  'user':           ['rusheng',     '儒生半身'],
  'medal':          ['yapai',       '牙牌'],
  'chat':           ['xinzha',      '信札'],
  'bell':           ['muduo',       '木铎'],
  'entry-resource': ['xianzhuang',  '线装书'],
  'entry-enroll':   ['bi',          '毛笔'],
  'megaphone':      ['fan',         '幡'],
  'robot':          ['wenpai',      '小篆「问」牌'],

  /* 控件类里有中式对应物、且换了不伤可用性的那批。
     返回/关闭/搜索/播放/眼睛这些国际通用符号不换——换形用户就得现学。 */
  'bookmark':       ['qiantiao',    '签条'],
  'lock':           ['guangsuo',    '广锁'],
  'clock':          ['louke',       '漏刻'],
  'calendar':       ['liye',        '历页'],
  'file':           ['du',          '牍'],
  'grid':           ['lingge',      '棂格'],
  'users':          ['ersheng',     '二儒生'],
  'cube':           ['hantao',      '书函'],
  'poster':         ['bang',        '榜'],
  'flag':           ['yaqi',        '牙旗'],

  /* 发送：纸飞机是西方符号，中文里"寄信"的本相是**雁字**——
     雁阵排成人字，一封信跟着飞走（「云中谁寄锦书来，雁字回时」）。
     这一枚不在"国际通用符号别动"那条里：关闭、返回没有中式对应物，
     发送有，而且是这套语汇里现成的。 */
  'send':           ['yanzi',       '雁字']
}

function designBodies() {
  const py = `
import sys, io, re, json
sys.path.insert(0, ${JSON.stringify(path.join(ROOT, 'design/demo/v2'))})
import _ornaments as o
out = {}
for k, svg in o.line_icon_set().items():
    m = re.search(r'aria-hidden="true">(.*)</svg>$', svg, re.S)
    assert m, k
    out[k] = m.group(1)
sys.stdout.write(json.dumps(out, ensure_ascii=False))
`
  return JSON.parse(execFileSync('python', ['-c', py], { encoding: 'utf8' }))
}

/** 在真 SVG 引擎里量每个器物的墨迹（32 框内，不含描边） */
async function measure(bodies) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
  const p = await (await b.newContext()).newPage()
  await p.setContent('<div></div>')
  const r = await p.evaluate((bodies) => {
    const out = {}
    for (const [k, inner] of Object.entries(bodies)) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      el.setAttribute('viewBox', '0 0 32 32')
      el.setAttribute('fill', 'none')
      el.innerHTML = inner
      document.body.appendChild(el)
      const bb = el.getBBox()
      out[k] = { w: bb.width, h: bb.height, cx: bb.x + bb.width / 2, cy: bb.y + bb.height / 2 }
      el.remove()
    }
    return out
  }, bodies)
  await b.close()
  return r
}

async function main() {
  const bodies = designBodies()
  const ink = await measure(bodies)
  let src = fs.readFileSync(ICONS_JS, 'utf8')
  let done = 0
  const rows = []
  for (const [name, [key, label]] of Object.entries(MAP)) {
    if (!bodies[key]) throw new Error(`设计稿里没有 lico_${key}`)
    const longest = Math.max(ink[key].w, ink[key].h)
    const s = +(TARGET / longest).toFixed(4)
    const w = +(STROKE / s).toFixed(2)
    /*
     * 除了缩放，还要**把墨迹挪到正中**。
     * 只缩放的话，画得偏的器物（儒生半身画在 32 画布的偏上方）得靠 icons.js 的 c
     * 去补，而 c 是挪 viewBox 原点的——补到 -4.66 就超出了护栏给的 ±3，
     * 而且 viewBox 挪多了图形会被裁。在 <g> 里 translate 是精确的，
     * 补完之后每一枚的 c 都是 0。
     */
    const tx = +(12 - ink[key].cx * s).toFixed(3)
    const ty = +(12 - ink[key].cy * s).toFixed(3)
    rows.push({ 图标: name, 器物: label, 原墨迹最长边: +longest.toFixed(1), 缩放: s, 线宽: w,
                平移: `${tx}, ${ty}` })
    const inner = `<g transform="translate(${tx} ${ty}) scale(${s})">${bodies[key]}</g>`
    /*
     * 只替换这一枚的定义行。行尾那个 `(\\s*\\/\\*[^\\n]*\\*\\/)?` 不能省——
     * 这个脚本自己会在行尾写一条 /* 器物名 *\u200b/ 的注释，
     * 第二次跑的时候若不认它，正则就匹配不上，直接抛"找不到定义行"。踩过一次。
     */
    const re = new RegExp(
      `^(\\s*)'${name}':(\\s*)\\{[^\\n]*\\}(,?)(\\s*\\/\\*[^\\n]*\\*\\/)?$`, 'm')
    if (!re.test(src)) throw new Error(`icons.js 里找不到 '${name}' 的定义行`)
    src = src.replace(re, (_m, indent, gap, comma) =>
      `${indent}'${name}':${gap}{ i: '${inner}', m: 'stroke', w: ${w} }${comma}` +
      `  /* ${label} */`)
    done++
  }
  fs.writeFileSync(ICONS_JS, src)
  console.log(`✓ ${done} 枚身份类图标换成线性器物（目标墨迹 ${TARGET}，描边 ${STROKE}）`)
  console.table(rows)
  console.log('  下一步：node scripts/measure-icon-centering.mjs，把它给的 c 填回 icons.js')
}

await main()
