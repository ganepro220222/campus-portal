#!/usr/bin/env node
/**
 * 图标视觉居中测量工具（**不进 preflight**，需要 Playwright，手动跑）。
 *
 * 用法：node scripts/measure-icon-centering.mjs
 *
 * 干什么：把 miniapp/components/icon/icons.js 里每个图标放进真实 SVG 引擎，
 * 逐个 getBBox（并把描边宽度算进去）得到"墨迹"的实际范围，
 * 再看墨迹中心离 viewBox 中心 (12,12) 差多少。
 *
 * 为什么需要：这些图标是手写路径，墨迹在 24×24 的框里并不都居中。
 * 首页那排功能入口就是被这个坑到的——「展馆展示」墨迹中心在 y=13、
 * 「课程中心」在 y=10.5，同排差 2.5 个 viewBox 单位，实际尺寸上差 5rpx，
 * 肉眼就是"没对齐"。
 *
 * 怎么用结果：脚本会打印建议的 c: [dx, dy]，填回 icons.js 对应图标即可；
 * 已经填过的会显示"修正后"的残差，正常应当接近 0。
 *
 * 例外：'play' 是右向三角形，视觉重心本就该偏右于几何中心，它的偏移是刻意的。
 */
import { chromium } from '../exhibits/node_modules/playwright/index.mjs'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = fs.readFileSync(path.join(root, 'miniapp/components/icon/icons.js'), 'utf8')
const body = src.slice(src.indexOf('const ICONS'), src.indexOf('function buildSrc'))
const names = [...src.matchAll(/^\s*'([\w-]+)'\s*:\s*\{/gm)].map((m) => m[1])

/** 刻意不居中的图标：名字 → 原因 */
const INTENTIONAL = {
  play: '右向三角形，视觉重心偏右于几何中心；按墨迹居中反而看着偏左'
}

const html = `<svg width="0" height="0"></svg><script>
${body}
window.__measure = (list) => list.map((n) => {
  const def = ICONS[n]
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('width', '240'); svg.setAttribute('height', '240')
  svg.setAttribute('fill', def.m === 'fill' ? '#000' : 'none')
  if (def.m !== 'fill') {
    svg.setAttribute('stroke', '#000')
    svg.setAttribute('stroke-width', String(def.w || 2))
    svg.setAttribute('stroke-linecap', 'round')
    svg.setAttribute('stroke-linejoin', 'round')
  }
  svg.innerHTML = def.i
  document.body.appendChild(svg)
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
  for (const el of svg.children) {
    const b = el.getBBox()
    const sw = def.m === 'fill' ? 0 : (def.w || 2) / 2
    x0 = Math.min(x0, b.x - sw); y0 = Math.min(y0, b.y - sw)
    x1 = Math.max(x1, b.x + b.width + sw); y1 = Math.max(y1, b.y + b.height + sw)
  }
  svg.remove()
  const c = def.c || [0, 0]
  return {
    name: n,
    // 加上已填的 c 之后，墨迹中心离 (12,12) 还差多少
    dx: +((x0 + x1) / 2 + c[0] - 12).toFixed(2),
    dy: +((y0 + y1) / 2 + c[1] - 12).toFixed(2),
    w: +(x1 - x0).toFixed(2),
    h: +(y1 - y0).toFixed(2),
    c: def.c ? \`[\${c[0]}, \${c[1]}]\` : ''
  }
})
</script>`

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage()
await page.setContent(html)
const rows = await page.evaluate((n) => window.__measure(n), names)
await browser.close()

const TOL = 0.25
const bad = rows.filter((r) => !INTENTIONAL[r.name] && (Math.abs(r.dx) >= TOL || Math.abs(r.dy) >= TOL))

console.log(`共 ${rows.length} 个图标，已填 c 的 ${rows.filter((r) => r.c).length} 个，` +
  `刻意例外 ${Object.keys(INTENTIONAL).length} 个`)
for (const [n, why] of Object.entries(INTENTIONAL)) {
  const r = rows.find((x) => x.name === n)
  if (r) console.log(`  例外 ${n}：偏移 (${r.dx}, ${r.dy}) —— ${why}`)
}

if (!bad.length) {
  console.log(`\n墨迹中心全部落在 (12,12) 的 ±${TOL} 内。`)
} else {
  console.log(`\n还有 ${bad.length} 个没居中，把下面这些 c 填进 icons.js：`)
  console.table(bad.map((r) => ({ name: r.name, 残差x: r.dx, 残差y: r.dy, 墨迹宽: r.w, 墨迹高: r.h, 现有c: r.c })))
  for (const r of bad) {
    const prev = r.c ? JSON.parse(r.c) : [0, 0]
    console.log(`  '${r.name}': c: [${+(prev[0] - r.dx).toFixed(2)}, ${+(prev[1] - r.dy).toFixed(2)}]`)
  }
}
