#!/usr/bin/env node
/**
 * 生成首页卷首的三张图：
 *   miniapp/assets/images/hero-shan.png   青绿山水（通栏出血的那幅画）
 *   miniapp/assets/images/hero-eave.png   满檐（压在画上的那道屋檐）
 *   miniapp/assets/images/home-title-calligraphy.png  校名书法字（墨色版）
 *
 * 书法字那张是**现成字标的裁切**，不是画出来的，所以走另一条路子。
 * 两件事要改：
 *   ① 换版本。包里原来那张和 design/brand/logo/extracted/academy-cn-navy.png
 *      逐字节相同（md5 309c8691…），实心像素是 #2B356E —— 旧调色板的 navy。
 *      护栏禁了这个色值，却看不进 PNG 里，所以它在首页最显眼的位置躺了整轮。
 *      方案 A 用的是 academy-cn-ink.png（墨色，均色 #251B18）。
 *   ② 缩到该有的尺寸。源图 1300×239，而卷首题名只有 40px 高，
 *      3 倍图也才 120px —— 源图纵向多了一倍，白扛 73 KB。
 *
 * 为什么是两张而不是一张合成图：
 * **檐的位置跟着机型走。** 檐要挂在胶囊下面，而状态栏高度各机型不同
 * （刘海屏 44pt、老机型 20pt），合成一张就把檐钉死在某一个偏移上了。
 * 分开之后画铺满整个卷首、檐在文档流里排在状态栏和胶囊让位之后，
 * 换机型只是画被拉高一点，檐始终贴着胶囊。
 *
 * 为什么是 PNG 而不是 SVG：和 nav-eave.png 同一个理由——
 * WXML 不渲染内联 SVG，WXSS 的 background-image 不收本地路径。
 * 山水那张 SVG 31 KB、檐那张 61 KB，转 data URI 塞进主包每开一页都要解析一遍；
 * 烤成 3 倍图的 PNG 量化之后一共 45 KB，没有解析开销。
 *
 * 尺寸的来历（都量自设计稿 shuyuan.css）：
 *   · .hero 高 368px，qinglv 的 viewBox 是 375×330，
 *     用 preserveAspectRatio="none" 拉满——所以这里按 375×368 渲，
 *     小程序那边 mode="scaleToFill"，和设计稿同一种拉法。
 *   · 满檐 eave() 的 viewBox 是 375×62。顶栏组件用的是矮一档的
 *     eave(height=46, sub=True)，那是二级页的；卷首要的是满檐，两张不能混用。
 *
 * 颜色从 miniapp/app.wxss 的令牌现取现烤（PNG 里解析不了 var()），
 * 和屋檐、入口图一个做法，同样落指纹，由 check:baked-icons 复核。
 *
 * 用法：node scripts/build-hero.mjs
 */
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const V2 = path.join(ROOT, 'design/demo/v2')
const OUT_DIR = path.join(ROOT, 'miniapp/assets/images')
const HASH_FILE = path.join(ROOT, 'scripts/hero.hash')
const SCALE = 3

/** 画出来的那两张：名字 → [生成表达式, 宽, 高, 量化后的上限 KB] */
export const PIECES = {
  'hero-shan': ['o.qinglv()', 375, 368, 40],
  'hero-eave': ['o.eave()', 375, 62, 32]
}

/** 字标裁切的那一张：源文件、目标高度（px，= 设计稿 40px × 3 倍图）、上限 KB */
export const BRAND = {
  out: 'home-title-calligraphy.png',
  src: 'design/brand/logo/extracted/academy-cn-ink.png',
  h: 120,
  maxKB: 40
}

export function tokens() {
  const src = fs.readFileSync(path.join(ROOT, 'miniapp/app.wxss'), 'utf8')
  const t = {}
  for (const [, k, v] of src.matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{3,8});/g)) {
    if (!(k in t)) t[k] = v.toUpperCase()      // 只取第一次出现的，后面是备选方案的覆写
  }
  return t
}

/** 调设计源出 SVG，再把 var(--x) 换成字面色值 */
export function bakedSvgs() {
  const exprs = Object.entries(PIECES).map(([k, [e]]) => `${JSON.stringify(k)}: ${e}`).join(', ')
  const raw = JSON.parse(execFileSync('python', ['-c', `
import sys, json
sys.path.insert(0, ${JSON.stringify(V2)})
import _ornaments as o
sys.stdout.write(json.dumps({${exprs}}, ensure_ascii=False))
`], { encoding: 'utf8', maxBuffer: 32 << 20 }).replace(/\r\n/g, '\n'))

  const t = tokens()
  const missing = new Set()
  const out = {}
  for (const [name, svg] of Object.entries(raw)) {
    out[name] = svg.replace(/var\(--([a-z0-9-]+)\)/g, (m, k) => {
      if (!t[k]) { missing.add(k); return m }
      return t[k]
    })
  }
  if (missing.size) throw new Error(`app.wxss 里缺这些令牌，卷首烤不出来：${[...missing].join('、')}`)
  return out
}

/** 书法字那张的指纹按**源文件内容**算，源素材换了这里就对不上 */
export function brandFingerprint() {
  return crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(ROOT, BRAND.src)))
    .update(JSON.stringify(BRAND))
    .digest('hex')
}

export function fingerprint(svgs) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(svgs) + '|' + JSON.stringify(PIECES) + `|x${SCALE}`)
    .update('|' + brandFingerprint())
    .digest('hex')
}

/** 把书法字缩到卷首要的高度，顺手量化 */
function buildBrand() {
  const src = path.join(ROOT, BRAND.src)
  const out = path.join(OUT_DIR, BRAND.out)
  if (!fs.existsSync(src)) throw new Error(`找不到字标源文件 ${BRAND.src}`)
  const before = fs.existsSync(out) ? fs.statSync(out).size : 0
  execFileSync('python', ['-c', `
from PIL import Image
import collections
im = Image.open(${JSON.stringify(src)}).convert('RGBA')
w = round(im.width * ${BRAND.h} / im.height)
im = im.resize((w, ${BRAND.h}), Image.LANCZOS)

# 这张书法字实际上是**单色墨迹**：实心像素里 73% 恰好是 #231916，
# 全图饱和度差最大只有 15，没有朱印之类的彩色元素。
# 也就是说 RGB 三个通道不携带信息，笔锋、飞白、浓淡全在 alpha 里。
# 于是把 RGB 压平成那一个主色、形状整个交给 alpha —— 肉眼没有区别，
# 文件从 46 KB 掉到 26 KB（PNG 对常量色面的压缩率高得多）。
#
# 不走 quantize()：它会连 alpha 一起量化，笔锋边缘会被啃出锯齿。
src_px = [p for p in im.getdata() if p[3] > 200]
ink = collections.Counter((p[0], p[1], p[2]) for p in src_px).most_common(1)[0][0]
flat = Image.new('RGB', im.size, ink)
flat.putalpha(im.getchannel('A'))
flat.save(${JSON.stringify(out)}, optimize=True)
print('ink=#%02X%02X%02X' % ink)
`], { encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'] })
  const kb = fs.statSync(out).size / 1024
  if (kb > BRAND.maxKB) throw new Error(`${BRAND.out} 有 ${kb.toFixed(1)} KB，超过 ${BRAND.maxKB} KB`)
  return { 图: BRAND.out.replace('.png', ''), 尺寸: `?×${BRAND.h}`,
           KB: +kb.toFixed(1), 量化前: +(before / 1024).toFixed(1) }
}

async function main() {
  // Playwright 只在真正烤图时才加载。护栏会 import 本文件算指纹，
  // 不能在模块顶层去拉 Linux 路径上的浏览器。
  const { chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')
  const svgs = bakedSvgs()
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const rows = []
  for (const [name, svg] of Object.entries(svgs)) {
    const [, w, h, maxKB] = PIECES[name]
    const p = await (await b.newContext({
      viewport: { width: w, height: h }, deviceScaleFactor: SCALE
    })).newPage()
    await p.setContent(`<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent}
svg{display:block;width:${w}px;height:${h}px}</style>${svg}`, { waitUntil: 'load' })
    const file = path.join(OUT_DIR, `${name}.png`)
    await p.screenshot({ path: file, omitBackground: true })
    await p.close()
    const raw = fs.statSync(file).size
    // 和屋檐、入口图同一档量化。255 色和 128 色在这幅画上误差完全一样
    // （最大单通道差 28、平均 1.46），说明 255 已经够用；64 色误差翻倍，不取。
    execFileSync('python', ['-c', `
from PIL import Image
p = ${JSON.stringify(file)}
im = Image.open(p).convert('RGBA')
im.quantize(colors=255, method=Image.FASTOCTREE).save(p, optimize=True)
`])
    const kb = fs.statSync(file).size / 1024
    if (kb > maxKB) throw new Error(`${name}.png 量化后仍有 ${kb.toFixed(1)} KB，超过 ${maxKB} KB`)
    rows.push({ 图: name, 尺寸: `${w * SCALE}×${h * SCALE}`,
                KB: +kb.toFixed(1), 量化前: +(raw / 1024).toFixed(1) })
  }
  await b.close()
  rows.push(buildBrand())
  fs.writeFileSync(HASH_FILE, fingerprint(svgs) + '\n')
  console.log('✓ 卷首三张图')
  console.table(rows)
  console.log(`  合计 ${rows.reduce((a, r) => a + r.KB, 0).toFixed(1)} KB`)
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
