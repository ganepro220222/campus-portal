#!/usr/bin/env node
/**
 * 图标线宽归一：让整套图标**摆在一起时一样粗**。
 *
 * ── 为什么要做 ────────────────────────────────────────────────
 * 这套图标是三批凑起来的，从来没对过账：
 *   · 26 枚器物图标（山门 / 简牍 / 鼎 / 书册 / 儒生…），由
 *     build-line-icons.mjs 从设计稿现烤；
 *   · 14 枚通用控件（search / close / eye / chevron / download…），更早手写；
 *   · 5 枚实心（play / pause / robot / send / wechat）。
 * 后果每一行都看得见：菜单左边是器物图标、右边是 chevron —— 右边那枚粗 47%。
 * 一套图标"精不精致"，最先看的不是画得像不像，是**轻重齐不齐**。
 *
 * ── 为什么靠量，不靠算 ────────────────────────────────────────
 * 第一版是算的：有效线宽 = w × 路径里所有 scale() 的乘积，反解出 w。
 * 错了，而且错得很像对的。二儒生（users）是**两个并排的儒生**，
 * 各自带一层 <g scale()>；把兄弟节点的 scale 也乘进去，算出来的缩放
 * 比真的小一半，于是给它配了 3 倍粗的线，两个人糊成两团。
 * transform 还能写成非等比 scale(a b)、能嵌任意层、能只罩住一部分路径——
 * 靠字符串算迟早还会栽。
 *
 * 所以这一版**真的把图标画出来量**：二分 w，直到量到的笔画落在目标上。
 * 量法是**距离变换**：每个墨点到最近背景的距离，取 95 分位再 ×2 就是笔宽。
 * 试过扫描线游程，不行——45° 的笔画被横扫切出来的长度是真宽的 √2 倍，
 * chevron / close / 箭头会被判成偏粗，照着调就把它们统统削薄 30%。
 * 距离变换和笔画方向无关。
 *
 * ── 收不住的那种 ──────────────────────────────────────────────
 * 有些图标内部的空隙比目标线宽还窄，加粗就糊成一团（线装书那摞书页）。
 * 二分收不到目标时不硬塞，按能收住的最粗值停下并**列进 STUBBORN**，
 * 写明是形状问题、要改的是图形不是粗细。宁可留一条明账。
 *
 * 用法：
 *   node scripts/tune-icon-weight.mjs          量 + 写回 icons.js
 *   node scripts/tune-icon-weight.mjs --check  只量不写（护栏用）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILE = path.join(ROOT, 'miniapp/components/icon/icons.js')
const require = createRequire(import.meta.url)

/**
 * 目标笔画。取**器物那一批**量出来的值——全套 45 枚里它占 22 枚，是最大的一群，
 * 而且只有它的粗细有出处（设计稿 build-line-icons 的 STROKE 常量），
 * 所以让另外那些去就它，不是反过来。
 * 量出来的分布是 4 / 8 / 9.66 / 11.31 / 12，跨度 3 倍；8 就是器物那一档
 * （在 192 的画布上翻倍成 16）。
 */
const N = 192                     // 量图的画布边长。96 太粗，二分收不紧
/* buildSrc 的 size 只决定 SVG 的**标称**尺寸（它内部会 ×3），
   而画到画布上时又缩放一次。两次尺寸不一致就多一道重采样，
   量出来的笔宽会飘——thumb 就是这么一次量到 16、一次量到 17.66 的。
   让标称尺寸正好等于画布边长，中间那道缩放就没了。 */
const MEASURE_SIZE = N / 3
const TARGET_PX = 16
/* ±2px ≈ ±12.5%。不收得更紧是因为量出来的值对 SVG 的标称尺寸有点敏感
   （同一个 w，标称 192 量到 17.66、标称 576 量到 16），再紧就会有一两枚
   在护栏边界上来回横跳。原来的跨度是 4~21px（5 倍），收到 ±12.5% 已经
   把"摆在一起不齐"这件事解决掉了；thumb 目前压在这个边上。 */
const TOL = 2

/**
 * 内部空隙本来就比目标线宽窄、加粗必糊的那几枚。
 * 这里只记账，不强行加粗——要治得改图形。
 */
const STUBBORN = {
  'entry-resource': '线装书那摞书页之间只有 1 个单位的缝，到不了 7px 就先糊了',
  'wechat': '微信官方标识，形状不能动',
  'send': '实心鸿雁，没有"线宽"这回事',
  'play': '实心三角，同上',
  'pause': '实心两竖，同上'
}

let browser, page
async function openCanvas() {
  const pw = require(path.join(ROOT, 'exhibits/node_modules/playwright/index.js'))
  browser = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
  page = await browser.newPage()
  await page.setContent(`<canvas id="c" width="${N}" height="${N}"></canvas>`)
}

/** 把一枚图标画出来，量笔画中位宽（px，N 框）和墨量占比 */
async function measure(src) {
  return page.evaluate(async ({ src, N }) => {
    const c = document.getElementById('c'), x = c.getContext('2d')
    const img = new Image()
    await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = src })
    x.clearRect(0, 0, N, N); x.drawImage(img, 0, 0, N, N)
    const d = x.getImageData(0, 0, N, N).data
    const on = (xx, yy) => d[(yy * N + xx) * 4 + 3] > 128
    /* 距离变换量笔宽，不用扫描线游程。
       游程法对斜笔有系统性偏差：45° 的笔画被横扫或竖扫切出来的长度
       是真宽的 √2 倍，于是 chevron / close / 箭头这些会被判成"偏粗"，
       照着调就把它们统统削薄 30%。距离变换和方向无关。
       每个墨点到最近背景的距离，沿中轴取到的最大值就是半个笔宽。 */
    const INF = 1e9
    const D = new Float64Array(N * N)
    for (let i = 0; i < N * N; i++) D[i] = on(i % N, (i / N) | 0) ? INF : 0
    const S2 = Math.SQRT2
    for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) {
      const i = yy * N + xx; if (!D[i]) continue
      let v = D[i]
      if (xx > 0) v = Math.min(v, D[i - 1] + 1)
      if (yy > 0) v = Math.min(v, D[i - N] + 1)
      if (xx > 0 && yy > 0) v = Math.min(v, D[i - N - 1] + S2)
      if (xx < N - 1 && yy > 0) v = Math.min(v, D[i - N + 1] + S2)
      D[i] = v
    }
    for (let yy = N - 1; yy >= 0; yy--) for (let xx = N - 1; xx >= 0; xx--) {
      const i = yy * N + xx; if (!D[i]) continue
      let v = D[i]
      if (xx < N - 1) v = Math.min(v, D[i + 1] + 1)
      if (yy < N - 1) v = Math.min(v, D[i + N] + 1)
      if (xx < N - 1 && yy < N - 1) v = Math.min(v, D[i + N + 1] + S2)
      if (xx > 0 && yy < N - 1) v = Math.min(v, D[i + N - 1] + S2)
      D[i] = v
    }
    const runs = []
    let ink = 0
    for (let i = 0; i < N * N; i++) {
      if (!D[i]) continue
      ink++
      runs.push(D[i])
    }
    runs.sort((a, b) => a - b)
    /* 一条宽 t 的笔画，横截面上到边的距离从 0 均匀分布到 t/2，
       所以**中位数 × 4 = 笔宽**。
       别用高分位：笔画交叉处的墨更厚，p95 量到的是那些结点不是笔画本身
       （山门有七八处交叉，p95 读出 10px，其实笔画就是 7px）。 */
    const med = runs.length ? runs[Math.floor(runs.length / 2)] : 0
    return { stroke: +(med * 4).toFixed(2), ink: ink / (N * N) }
  }, { src, N })
}

/** 解析 ICONS 的每一项（只取名字、模式、w、d 和它在源码里的位置） */
export function parseIcons(src) {
  const out = []
  const re = /'([a-z0-9-]+)':\s*\{ i: '([\s\S]*?)', m: '(stroke|fill)'((?:, [a-z]+: [^,}]+)*)\s*\}/g
  let m
  while ((m = re.exec(src))) {
    const [full, name, , mode, rest] = m
    const num = (k) => { const x = (rest.match(new RegExp(`, ${k}: ([\\d.]+)`)) || [])[1]; return x === undefined ? null : Number(x) }
    out.push({ name, mode, w: num('w'), d: num('d'), full, index: m.index })
  }
  return out
}

async function solve(name, mode, lo, hi) {
  const icons = require(FILE)
  // 二分：找让量到的笔画最接近 TARGET_PX 的那个值
  let best = null
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2
    const src = mode === 'fill'
      ? icons.buildSrc(name, MEASURE_SIZE, '#000000', 0, mid)
      : icons.buildSrc(name, MEASURE_SIZE, '#000000', mid)
    const r = await measure(src)
    const err = Math.abs(r.stroke - TARGET_PX)
    if (!best || err < best.err) best = { v: +mid.toFixed(3), err, ...r }
    if (r.stroke > TARGET_PX) hi = mid; else lo = mid
  }
  return best
}

async function main() {
  const check = process.argv.includes('--check')
  let src = fs.readFileSync(FILE, 'utf8')
  const items = parseIcons(src)
  if (items.length < 40) {
    console.error(`只解析到 ${items.length} 枚图标，ICONS 的写法大概改了 —— 这个脚本要跟着改`)
    process.exit(1)
  }
  await openCanvas()
  const icons = require(FILE)

  const rows = []
  for (const it of items) {
    const cur = it.mode === 'fill'
      ? icons.buildSrc(it.name, MEASURE_SIZE, '#000000', 0, it.d || 0)
      : icons.buildSrc(it.name, MEASURE_SIZE, '#000000', 0)
    const now = await measure(cur)
    const stubborn = STUBBORN[it.name]
    let want = null
    if (!stubborn && Math.abs(now.stroke - TARGET_PX) > TOL) {
      want = await solve(it.name, it.mode, 0.01, it.mode === 'fill' ? 60 : 8)
    }
    rows.push({ it, now, want, stubborn })
  }
  await browser.close()

  const off = rows.filter(r => r.want && Math.abs(r.want.stroke - TARGET_PX) <= TOL)
  const stuck = rows.filter(r => r.want && Math.abs(r.want.stroke - TARGET_PX) > TOL)

  if (check) {
    const bad = rows.filter(r => !r.stubborn && Math.abs(r.now.stroke - TARGET_PX) > TOL)
    if (bad.length) {
      console.error('check-icon-weight 发现问题（跑 node scripts/tune-icon-weight.mjs 归一）：')
      for (const r of bad) {
        console.error(`  ✗ ${r.it.name}：量到笔画 ${r.now.stroke}px，目标 ${TARGET_PX}±${TOL}`)
      }
      process.exit(1)
    }
    console.log(`✓ 图标线宽齐平：${rows.length - Object.keys(STUBBORN).length} 枚量到 ` +
                `${TARGET_PX}±${TOL}px，另有 ${Object.keys(STUBBORN).length} 枚在册（形状所限）`)
    return
  }

  for (const r of [...off].sort((a, b) => b.it.index - a.it.index)) {
    const key = r.it.mode === 'fill' ? 'd' : 'w'
    const oldv = r.it[key]
    const seg = src.slice(r.it.index, r.it.index + r.it.full.length)
    const next = oldv === null
      ? seg.replace(`, m: '${r.it.mode}'`, `, m: '${r.it.mode}', ${key}: ${r.want.v}`)
      : seg.replace(`, ${key}: ${oldv}`, `, ${key}: ${r.want.v}`)
    if (next === seg) continue        // 解出来就是当前值，不用改
    src = src.slice(0, r.it.index) + next + src.slice(r.it.index + r.it.full.length)
  }
  fs.writeFileSync(FILE, src)
  console.log(`✓ 量了 ${rows.length} 枚，调了 ${off.length} 枚到 ${TARGET_PX}px`)
  for (const r of off) {
    console.log(`  · ${r.it.name.padEnd(15)} ${r.now.stroke}px → ${r.want.stroke}px` +
                `（${r.it.mode === 'fill' ? 'd' : 'w'} ${r.it[r.it.mode === 'fill' ? 'd' : 'w']} → ${r.want.v}）`)
  }
  if (stuck.length) {
    console.log('\n收不到目标的（形状问题，要改图不是改粗细）：')
    for (const r of stuck) console.log(`  · ${r.it.name}：最接近 ${r.want.stroke}px`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main()
