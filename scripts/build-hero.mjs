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

/** 画出来的那几张：名字 → [生成表达式, 宽, 高, 量化后的上限 KB] */
export const PIECES = {
  'hero-shan': ['o.qinglv()', 375, 368, 40],
  /* 二级页（动态详情）的卷首：同一支笔，矮一档。
     不能拿 hero-shan 缩着用——它是 368 高，压到 268 就是把山压扁 27%，
     山头变矮、点景的树变墩。设计稿那边是同一个 svg 按 268 现画的
     （preserveAspectRatio="none"，viewBox 250 → 268，只有 7% 的拉伸）。 */
  'hero-shan-art': ['o.qinglv(h=268)', 375, 268, 32],
  'hero-eave': ['o.eave()', 375, 62, 32],
  /* 轮播的兜底图：一幅横幅小青绿，和卷首同一支笔、另一个 seed。
     参数抄自设计稿 post_process() 里注入 .card.banner 的那一行。
     这条还没传封面图时它顶上，传了就整张退到图下面（不出现）。 */
  'banner-shan': ['o.qinglv(w=343, h=176, seed=20261101, step_k=1.15)', 343, 176, 24]
}

/**
 * 现成字标裁切出来的那几张：源文件、目标高度（px，= 设计稿高度 × 3 倍图）、上限 KB。
 *
 * 这几张都是**单色 + alpha**：校名墨迹 73% 的实心像素是 #231916，
 * 朱印更彻底，100% 是 #540B0F。也就是说 RGB 三个通道不携带信息，
 * 笔锋、飞白、印泥的斑驳全在 alpha 里。所以下面统一把 RGB 压平成主色、
 * 形状整个交给 alpha —— 肉眼没区别，PNG 对常量色面的压缩率高得多。
 */
export const BRANDS = [
  { out: 'home-title-calligraphy.png',
    src: 'design/brand/logo/extracted/academy-cn-ink.png',
    h: 120, maxKB: 40 },            // 卷首题名，设计稿 40px
  { out: 'seal-zhu.png',
    src: 'design/brand/logo/extracted/mark-maroon.png',
    h: 72, maxKB: 12 }              // 段头小印 22px / 匾上那枚 23px，取 24px × 3
]

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

/** 字标那几张的指纹按**源文件内容**算，源素材换了这里就对不上 */
export function brandFingerprint() {
  const h = crypto.createHash('sha256')
  for (const b of BRANDS) {
    h.update(fs.readFileSync(path.join(ROOT, b.src))).update(JSON.stringify(b))
  }
  return h.digest('hex')
}

export function fingerprint(svgs) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(svgs) + '|' + JSON.stringify(PIECES) + `|x${SCALE}`)
    .update('|' + brandFingerprint())
    .digest('hex')
}

/** 把一张字标缩到要的高度、压平成单色，顺手量化 */
function buildBrand(b) {
  const src = path.join(ROOT, b.src)
  const out = path.join(OUT_DIR, b.out)
  if (!fs.existsSync(src)) throw new Error(`找不到字标源文件 ${b.src}`)
  const before = fs.existsSync(out) ? fs.statSync(out).size : 0
  execFileSync('python', ['-c', `
from PIL import Image
import collections
im = Image.open(${JSON.stringify(src)}).convert('RGBA')
w = round(im.width * ${b.h} / im.height)
im = im.resize((w, ${b.h}), Image.LANCZOS)

# 单色 + alpha：把 RGB 压平成出现最多的那个主色，形状整个交给 alpha。
# 不走 quantize()：它会连 alpha 一起量化，笔锋和印边会被啃出锯齿。
src_px = [p for p in im.getdata() if p[3] > 200]
ink = collections.Counter((p[0], p[1], p[2]) for p in src_px).most_common(1)[0][0]
flat = Image.new('RGB', im.size, ink)
flat.putalpha(im.getchannel('A'))
flat.save(${JSON.stringify(out)}, optimize=True)
print('  %s 主色 #%02X%02X%02X' % (${JSON.stringify(b.out)}, *ink))
`], { encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'] })
  const kb = fs.statSync(out).size / 1024
  if (kb > b.maxKB) throw new Error(`${b.out} 有 ${kb.toFixed(1)} KB，超过 ${b.maxKB} KB`)
  return { 图: b.out.replace('.png', ''), 尺寸: `?×${b.h}`,
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
  for (const b of BRANDS) rows.push(buildBrand(b))
  fs.writeFileSync(HASH_FILE, fingerprint(svgs) + '\n')
  console.log(`✓ 首页烤图 ${rows.length} 张`)
  console.table(rows)
  console.log(`  合计 ${rows.reduce((a, r) => a + r.KB, 0).toFixed(1)} KB`)
}

if (import.meta.url === `file://${process.argv[1]}`) await main()
