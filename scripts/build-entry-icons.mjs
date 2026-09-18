#!/usr/bin/env node
/**
 * 生成首页五个功能入口的图标：miniapp/assets/images/entry-*.png
 *
 * 为什么不走 icon 组件：**icon 组件是单色的**。
 * buildSrc(name, size, color) 把一个颜色塞进 SVG，整枚图标只有这一个色。
 * 而方案 A 的五个入口是**多色填充的器物**——简策的竹黄与朱绳、画轴的青绿、
 * 讲案的木与书、书函的函套与签、笔笺的笔与朱印，一枚里有五六个色。
 * 单色组件装不下，所以做成图片。
 *
 * 这一版是返工：上一轮我把这五个入口一并换成了线描器物，那是错的——
 * 线描是 tabBar 和顶栏那一档的语言（小、要一眼认出轮廓），
 * 入口这一档在方案 A 里是**大的、多色的、有体积的**，两者不是一回事。
 *
 * 颜色从 miniapp/app.wxss 的令牌现取现烤（PNG 里解析不了 var()），
 * 和屋檐那张图一个做法，同样配指纹护栏防止令牌改了图没重出。
 *
 * 用法：node scripts/build-entry-icons.mjs
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'miniapp/assets/images')
const HASH_FILE = path.join(ROOT, 'scripts/entry-icons.hash')
const SIZE = 56          // 逻辑尺寸（px）；.ico 是 100rpx = 50px，留一点余量
const SCALE = 3

/** 入口图标名 → 设计稿 icon_set() 里的器物 */
const MAP = {
  'entry-news':     ['jiandu',   '简策'],
  'entry-hall':     ['huazhou',  '画轴'],
  'entry-course':   ['jiangan',  '讲案'],
  'entry-resource': ['shuhan',   '书函'],
  'entry-enroll':   ['bijian',   '笔笺']
}

function tokens() {
  const src = fs.readFileSync(path.join(ROOT, 'miniapp/app.wxss'), 'utf8')
  const t = {}
  for (const [, k, v] of src.matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{3,8});/g)) {
    if (!(k in t)) t[k] = v.toUpperCase()     // 只取第一次出现的，后面是覆写
  }
  return t
}

function bakedSvgs() {
  const py = `
import sys, io, re, json
sys.path.insert(0, ${JSON.stringify(path.join(ROOT, 'design/demo/v2'))})
import _ornaments as o
sys.stdout.write(json.dumps(o.icon_set(), ensure_ascii=False))
`
  const raw = JSON.parse(execFileSync('python3', ['-c', py], { encoding: 'utf8', maxBuffer: 8 << 20 }))
  const t = tokens()
  const out = {}
  const missing = new Set()
  for (const [name, [key]] of Object.entries(MAP)) {
    if (!raw[key]) throw new Error(`设计稿的 icon_set() 里没有 ${key}`)
    out[name] = raw[key].replace(/var\(--([a-z0-9-]+)\)/g, (m, k) => {
      if (!t[k]) { missing.add(k); return m }
      return t[k]
    })
  }
  if (missing.size) throw new Error(`app.wxss 里缺这些令牌：${[...missing].join('、')}`)
  return out
}

async function main() {
  const svgs = bakedSvgs()
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
  const p = await (await b.newContext({
    viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: SCALE
  })).newPage()
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const rows = []
  for (const [name, svg] of Object.entries(svgs)) {
    await p.setContent(`<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent}
svg{display:block;width:${SIZE}px;height:${SIZE}px}</style>${svg}`, { waitUntil: 'load' })
    const file = path.join(OUT_DIR, `${name}.png`)
    await p.screenshot({ path: file, omitBackground: true })
    const raw = fs.statSync(file).size
    // 和屋檐一样量化：器物是平涂 + 少量渐变，255 色肉眼比不出差别
    execFileSync('python3', ['-c', `
from PIL import Image
p = ${JSON.stringify(file)}
im = Image.open(p).convert('RGBA')
im.quantize(colors=255, method=Image.FASTOCTREE).save(p, optimize=True)
`])
    rows.push({ 图标: name, 器物: MAP[name][1],
                KB: +(fs.statSync(file).size / 1024).toFixed(1),
                量化前: +(raw / 1024).toFixed(1) })
  }
  await b.close()

  // 指纹：令牌改了而图没重出，护栏就会红
  const fp = crypto.createHash('sha256')
    .update(JSON.stringify(svgs) + `|${SIZE}x${SCALE}`).digest('hex')
  fs.writeFileSync(HASH_FILE, fp + '\n')

  console.log(`✓ ${rows.length} 枚入口图标（${SIZE * SCALE}×${SIZE * SCALE}）`)
  console.table(rows)
  console.log(`  合计 ${rows.reduce((a, r) => a + r.KB, 0).toFixed(1)} KB`)
}

await main()
