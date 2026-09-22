#!/usr/bin/env node
/**
 * 护栏：网格的 `fr` 轨道必须写成 `minmax(0, 1fr)`，不许写裸的 `1fr`。
 *
 * 这条是踩出来的。展馆页两列写的是 `grid-template-columns: 1fr 1fr`，
 * 在真机上整片网格溢出屏幕，而且**两列不等宽**：谁的简介长谁就宽，
 * 点不同分类出来的卡片宽度都不一样，有的还横着排出去。
 *
 * 原因：`1fr` 是 `minmax(auto, 1fr)` 的简写，那个 `auto` 下限等于
 * 这一列内容的**最小内容宽度**。卡片里只要有一处 `white-space: nowrap`
 * 的长句（展馆卡的简介就是），最小内容宽度就是那整句话的长度，
 * 列宽被它顶开，`1fr` 那个"平分"的意思完全不起作用。
 * 浏览器里量过：两列分别 366px 和 313px，合计 707px 铺在 375pt 的屏上。
 *
 * 为什么之前没出事：那几张卡片碰巧都写了 `overflow: hidden`（为了裁封面），
 * 而 `overflow` 不是 visible 时，网格项的 `min-width: auto` 会被按成 0。
 * 也就是说这个 bug 一直**被一个副作用压着**。封面改成裱框、不用裁了，
 * 我把 `overflow: hidden` 删掉，溢出立刻就回来了。
 * 靠副作用维持的正确性不叫正确，所以立成一条明规则。
 *
 * `minmax(0, 1fr)` 把下限按回 0，列宽只由可用空间决定 —— 手机上固定宽度的
 * 版面里，这几乎永远是想要的那个行为。真要按内容撑开的场景，
 * 用 `auto` 或 `max-content` 显式写出来，这条也不会拦。
 *
 * 配套（这条查不了、但同属一类）：网格项自己的 `min-width` 默认也是 auto，
 * 该写 `min-width: 0` 的地方别省，见 pages/hall 的 .hcard、packageA/craft 的 .ccard。
 *
 * 用法：node scripts/check-grid-tracks.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MINI = path.join(ROOT, 'miniapp')
const SKIP_DIRS = new Set(['node_modules', 'miniprogram_npm'])

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), out)
    } else if (e.name.endsWith('.wxss')) out.push(path.join(dir, e.name))
  }
  return out
}

/**
 * 把一条轨道列表切成一个个轨道。
 * 只需要分清"顶层的空格"和"括号里的空格"——minmax(0, 1fr) 里那个空格不算分隔。
 */
function splitTracks(value) {
  const out = []
  let depth = 0
  let cur = ''
  for (const ch of value) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (/\s/.test(ch) && depth === 0) {
      if (cur) { out.push(cur); cur = '' }
    } else cur += ch
  }
  if (cur) out.push(cur)
  return out
}

/**
 * 找出一条轨道列表里所有**裸的 fr**。
 * repeat(2, 1fr) 要递归进去看；minmax(…) 已经显式写了下限，放行。
 *
 * 第一版偷懒写成「先用正则把 repeat( 前缀剥掉再切」，结果把
 * `minmax(0, 1fr) minmax(0, 1fr)` 也当成 repeat 剥了一刀，自己报自己的错。
 * 所以这里按轨道逐个判，不做整串的字符串手术。
 */
function bareFrTracks(value) {
  const out = []
  for (const t of splitTracks(value)) {
    const rep = t.match(/^repeat\(\s*[^,]+,\s*([\s\S]*)\)$/)
    if (rep) { out.push(...bareFrTracks(rep[1].trim())); continue }
    if (/^minmax\(/.test(t) || /^fit-content\(/.test(t)) continue
    if (/^[\d.]*fr$/.test(t)) out.push(t)
  }
  return out
}

const errs = []
let checked = 0

for (const abs of walk(MINI)) {
  const rel = path.relative(MINI, abs).split(path.sep).join('/')
  // 注释里举反例（比如这条护栏自己的说明）不该被判违规
  const src = fs.readFileSync(abs, 'utf8').replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/\S/g, ' '))
  for (const m of src.matchAll(/grid-template-(?:columns|rows)\s*:\s*([^;}]+)/g)) {
    const value = m[1].replace(/\s+/g, ' ').trim()
    const bare = bareFrTracks(value)
    if (bare.length) {
      const line = src.slice(0, m.index).split('\n').length
      checked++
      errs.push(`${rel}:${line} 里 \`${value}\` 有裸的 fr（${bare.join(' ')}）\n` +
                `      改成 minmax(0, ${bare[0]}) —— 裸 fr 的下限是"最小内容宽度"，\n` +
                `      卡片里一处 white-space: nowrap 的长句就能把这一列顶到溢出屏幕`)
    } else {
      checked++
    }
  }
}

if (errs.length) {
  console.error('check-grid-tracks 发现问题：')
  for (const e of errs) console.error('  ✗ ' + e)
  process.exit(1)
}
console.log(`✓ 网格轨道都按 minmax(0, …) 写（查了 ${checked} 条 grid-template-*）`)
