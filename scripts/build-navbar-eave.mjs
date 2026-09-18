#!/usr/bin/env node
/**
 * 生成小程序顶栏用的屋檐图：miniapp/assets/images/nav-eave.png
 *
 * 为什么是 PNG 而不是把 SVG 塞进 WXSS：
 *   屋檐这件东西是 622 个图元（385 条 path + 99 个 rect + 138 个圆）画出来的，
 *   转成 data URI 有 84 KB，而且它在主包里、每开一个页面都要解析一遍。
 *   渲成 2 倍图的 PNG 只有几十 KB，还没有解析开销。
 *   WXSS 的 background-image 不收本地路径（只收网络地址或 base64），
 *   所以组件里用 <image src="/assets/images/nav-eave.png"> 引它。
 *
 * 颜色从 miniapp/app.wxss 的令牌现取现烤 —— data URI / PNG 里解析不了 var()，
 * 所以必须烤进去。烤进去就会和令牌脱钩，于是配一条护栏
 * （scripts/check-navbar-eave.py）去量 PNG 里到底有没有当前这几个色值。
 *
 * 用法：node scripts/build-navbar-eave.mjs
 * 改了 --tile / --wood-* / --gold 之后要重跑，否则护栏会红。
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const OUT = path.join(ROOT, 'miniapp/assets/images/nav-eave.png')
export const W = 375, H = 46, SCALE = 3

/** 从 app.wxss 读令牌（小程序真正在用的那一份） */
export function tokens() {
  const src = fs.readFileSync(path.join(ROOT, 'miniapp/app.wxss'), 'utf8')
  const t = {}
  for (const [, k, v] of src.matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{3,8});/g)) {
    if (!(k in t)) t[k] = v.toUpperCase()      // 只取第一次出现的，后面是覆写
  }
  return t
}

/** 调 _ornaments.py 出屋檐的 SVG，再把 var(--x) 换成字面色值 */
export function bakedSvg() {
  const py = `
import sys, io, re
sys.path.insert(0, ${JSON.stringify(path.join(ROOT, 'design/demo/v2'))})
import _ornaments as o
svg = o.eave(height=${H}, top=6, ridge=5, yc=29, rise=15, pitch=8.0, sub=True)
sys.stdout.write(svg)
`
  let svg = execFileSync('python3', ['-c', py], { encoding: 'utf8', maxBuffer: 8 << 20 })
  const t = tokens()
  const missing = new Set()
  svg = svg.replace(/var\(--([a-z0-9-]+)\)/g, (m, k) => {
    if (!t[k]) { missing.add(k); return m }
    return t[k]
  })
  if (missing.size) {
    throw new Error(`app.wxss 里缺这些令牌，屋檐烤不出来：${[...missing].join('、')}`)
  }
  return svg
}

async function main() {
  const svg = bakedSvg()
  const html = `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent}
svg{display:block;width:${W}px;height:${H}px}</style>${svg}`
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
  const p = await (await b.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: SCALE
  })).newPage()
  await p.setContent(html, { waitUntil: 'load' })
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  await p.screenshot({ path: OUT, omitBackground: true })
  await b.close()
  const raw = fs.statSync(OUT).size

  // 调色板量化：真彩 PNG 86 KB，量化到 255 色只剩 16 KB，
  // 而屋檐本来就是平涂 + 少量渐变，肉眼比不出差别（对照图验过）。
  // 主包只有 500 KB 出头的余量，这 70 KB 省得值。
  execFileSync('python3', ['-c', `
from PIL import Image
p = ${JSON.stringify(OUT)}
im = Image.open(p).convert('RGBA')
im.quantize(colors=255, method=Image.FASTOCTREE).save(p, optimize=True)
`])
  // 记下这张图是用哪一版 SVG 烤的。护栏拿它比对，
  // 「改了令牌却没重新生成」就藏不住了。
  const HASH_FILE = path.join(ROOT, 'scripts/nav-eave.hash')
  fs.writeFileSync(HASH_FILE, crypto.createHash('sha256').update(svg).digest('hex') + '\n')

  const kb = (n) => (n / 1024).toFixed(0)
  console.log(`✓ ${path.relative(ROOT, OUT)}  ${W * SCALE}×${H * SCALE}  ` +
              `${kb(fs.statSync(OUT).size)} KB（量化前 ${kb(raw)} KB）`)
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
