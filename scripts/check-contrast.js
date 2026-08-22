#!/usr/bin/env node
/**
 * 文字对比度检查 —— 拦「调浅一点更好看，然后就看不清了」。
 *
 * 这是真出过的：`--muted` 原来是 #8A93B2，白底上对比度只有 3.04:1、
 * 在 --paper 上 2.86:1，都低于 WCAG AA 对正文的 4.5:1；
 * 而它承担的是全站的提示文字、tabBar 未选中标签、空态说明——
 * 恰恰是"看不清就真的看不见"的那一类。
 *
 * 只查 app.wxss 里的调色板 token（它们覆盖了全站绝大多数文字），
 * 逐个算与其实际背景的对比度。页面里零散的字色查不了，
 * 靠 review；但 token 一旦被调浅，这里会红。
 *
 * WCAG 2.1 AA：普通文字 ≥4.5:1；≥18.66px 粗体或 ≥24px 常规可放宽到 3:1。
 * 这些 token 用在 20~30rpx（10~15pt）的小字上，一律按 4.5 要求。
 *
 * 用法：node scripts/check-contrast.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const appWxss = fs.readFileSync(path.join(root, 'miniapp/app.wxss'), 'utf8')

function token(name) {
  const m = appWxss.match(new RegExp('--' + name + '\\s*:\\s*(#[0-9A-Fa-f]{3,8})'))
  if (!m) throw new Error(`app.wxss 里找不到调色板变量 --${name}`)
  return m[1]
}

function rgb(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
}

function luminance(c) {
  const s = c.map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2]
}

function contrast(fg, bg) {
  const [hi, lo] = [luminance(rgb(fg)), luminance(rgb(bg))].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}

/** [前景 token, 背景 token, 最低对比度, 这个组合出现在哪] */
const PAIRS = [
  ['ink', 'card', 4.5, '卡片正文'],
  ['ink', 'paper', 4.5, '页面正文'],
  ['sub', 'card', 4.5, '卡片次要文字'],
  ['sub', 'paper', 4.5, '页面次要文字'],
  ['muted', 'card', 4.5, '卡片提示文字 / tabBar 未选中标签'],
  ['muted', 'paper', 4.5, '页面提示文字 / 空态说明'],
  ['navy', 'card', 4.5, 'tabBar 选中标签 / 强调文字']
]

function main() {
  const errs = []
  const rows = []
  for (const [fgName, bgName, min, where] of PAIRS) {
    const fg = token(fgName)
    const bg = token(bgName)
    const r = contrast(fg, bg)
    rows.push(`  --${fgName}(${fg}) 于 --${bgName}(${bg})：${r.toFixed(2)}:1  ${where}`)
    if (r < min) {
      errs.push(`--${fgName}(${fg}) 在 --${bgName}(${bg}) 上只有 ${r.toFixed(2)}:1，` +
        `低于 ${min}:1（${where}）；把颜色调深，或确认这里确实只用于大字号后改本文件的阈值`)
    }
  }
  if (errs.length) {
    console.error('check-contrast 发现问题：')
    for (const e of errs) console.error('  ✗ ' + e)
    console.error('明细：')
    for (const r of rows) console.error(r)
    process.exit(1)
  }
  console.log(`check-contrast OK（${PAIRS.length} 组调色板组合均达到 WCAG AA）`)
}

main()
