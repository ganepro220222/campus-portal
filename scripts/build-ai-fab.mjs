#!/usr/bin/env node
/**
 * 生成问答悬浮标的本体：miniapp/assets/images/ai-fab.png
 *
 * 形制是**金镶玉圆牌**：鎏金外箍 + 青白玉牌面 + 当中阴刻一个小篆字。
 *
 * 来历：早先有过一版"金镶玉瓦当"做首页五个入口的圆框，后来取消了，
 * 取消的理由是那一小块区域里塞了四种装饰，装饰和内容抢注意力。
 * 但悬浮标不一样——它就一枚，没有人和它抢，
 * 所以"圆 + 篆字"的形制在这里反而是合适的。按审看意见**去掉瓦当的花纹，
 * 换成玉石的质感**：水头、绺、阴刻，三件把玉和塑料分开。
 *
 * 上一版是 112rpx 的蓝色渐变圆 + 白色机器人图标 + 金色脉冲环，
 * 和这套配色完全不搭；而且"机器人"是 AI 的国际符号，不是这套东西。
 *
 * 字形取自 design/brand/seal-script/（校方素材那一套的小篆）。
 * 用「问」——校方给了篆体的「問」字形。早先临时用过「闻」，
 * 理由是库里只有那一枚现成的矢量；既然「問」到位了就换回来，
 * 这枚浮标点开是问答，字面对上功能比"朝闻道"的巧劲更要紧。
 * 外来字形不能直接放进那个目录，先跑 scripts/normalize-seal-glyph.mjs 归一
 * （洗水印、去烤死的 fill、统一到 1000 框居中 760 墨迹），
 * 否则玉牌给字上不了色、水印会显在牌面上。
 *
 * 用法：node scripts/build-ai-fab.mjs
 */
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs'
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'miniapp/assets/images/ai-fab.png')
const HASH_FILE = path.join(ROOT, 'scripts/ai-fab.hash')
const CH = '问'
const SIZE = 56          // .ai-fab 是 112rpx = 56px
const SCALE = 3

function svg() {
  const py = `
import sys
sys.path.insert(0, ${JSON.stringify(path.join(ROOT, 'design/demo/v2'))})
import _ornaments as o
sys.stdout.write(o.jade_medallion(${JSON.stringify(CH)}))
`
  return execFileSync('python3', ['-c', py], { encoding: 'utf8', maxBuffer: 8 << 20 })
}

async function main() {
  const s = svg()
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
  const p = await (await b.newContext({
    viewport: { width: SIZE, height: SIZE }, deviceScaleFactor: SCALE
  })).newPage()
  await p.setContent(`<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent}
svg{display:block;width:${SIZE}px;height:${SIZE}px}</style>${s}`, { waitUntil: 'load' })
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  await p.screenshot({ path: OUT, omitBackground: true })
  await b.close()
  const raw = fs.statSync(OUT).size
  execFileSync('python3', ['-c', `
from PIL import Image
p = ${JSON.stringify(OUT)}
im = Image.open(p).convert('RGBA')
im.quantize(colors=255, method=Image.FASTOCTREE).save(p, optimize=True)
`])
  fs.writeFileSync(HASH_FILE,
    crypto.createHash('sha256').update(s + `|${CH}|${SIZE}x${SCALE}`).digest('hex') + '\n')
  const kb = (n) => (n / 1024).toFixed(1)
  console.log(`✓ ${path.relative(ROOT, OUT)}  ${SIZE * SCALE}×${SIZE * SCALE}  ` +
              `${kb(fs.statSync(OUT).size)} KB（量化前 ${kb(raw)} KB）  字「${CH}」`)
}

await main()
