#!/usr/bin/env node
/**
 * 护栏：烤成图片的那几枚图标，必须和当下的设计源、当下的令牌一致。
 *
 * 为什么需要这条：首页五个入口和问答浮标是 **PNG**，不是矢量也不是组件。
 * 走图片是被逼的——入口那五枚是多色填充的器物，icon 组件只吃单色；
 * 而 WXSS 的 background-image 不认本地路径，只能 <image src>。
 * 代价是**颜色被烤死在像素里**：app.wxss 的令牌改了，这几张图不会跟着变，
 * 设计稿的器物改了，这几张图也不会跟着变。改完不重出，页面就悄悄花了。
 *
 * 所以每个构建脚本都落一份指纹（scripts/*.hash），这条护栏把指纹重算一遍。
 * 重算的输入就是构建脚本自己的输入：**现取的令牌 + 现读的设计源**。
 * 对不上就说明源动过而图没重出，报出来并给出重出的命令。
 *
 * 之前 check:font-subset 吃过一次亏：它验了字体产物，却没验 app.wxss 到底
 * 有没有 @import —— 产物对、护栏绿、字压根没生效，白躺了一个周期。
 * 这里补上同一类检查：图对不对是一回事，**页面有没有真的引到它**是另一回事，
 * 两件都验。
 *
 * 用法：node scripts/check-baked-icons.mjs
 */
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const V2 = path.join(ROOT, 'design/demo/v2')
const errs = []
const notes = []

const rel = p => path.relative(ROOT, p)
const read = p => fs.readFileSync(p, 'utf8')

/** 取 app.wxss 里第一次出现的那批令牌（后面是备选方案的覆写，构建脚本也只取第一次） */
function tokens() {
  const t = {}
  for (const [, k, v] of read(path.join(ROOT, 'miniapp/app.wxss'))
    .matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{3,8});/g)) {
    if (!(k in t)) t[k] = v.toUpperCase()
  }
  return t
}

function py(code) {
  const out = execFileSync('python', ['-c',
    `import sys, json\nsys.path.insert(0, ${JSON.stringify(V2)})\nimport _ornaments as o\n${code}`],
    { encoding: 'utf8', maxBuffer: 16 << 20 })
  // Windows 会把 stdout 的 \\n 转成 \\r\\n，指纹必须按生成时的 LF 算
  return out.replace(/\r\n/g, '\n')
}

/** 指纹存在、且和现算的一致 */
function checkHash(name, hashFile, actual, rebuild) {
  if (!fs.existsSync(hashFile)) {
    errs.push(`${name}：找不到指纹 ${rel(hashFile)}，跑一次 \`${rebuild}\``)
    return
  }
  const want = read(hashFile).trim()
  if (want !== actual) {
    errs.push(`${name}：设计源或令牌变了，但图没重出\n` +
              `      指纹 ${want.slice(0, 12)}… → 现算 ${actual.slice(0, 12)}…\n` +
              `      跑 \`${rebuild}\` 重出，并把新图一起提交`)
  }
}

/** 图得在、得非空、得没胖到离谱 */
function checkPng(p, maxKB) {
  if (!fs.existsSync(p)) { errs.push(`缺图：${rel(p)}`); return }
  const kb = fs.statSync(p).size / 1024
  if (kb > maxKB) {
    errs.push(`${rel(p)}：${kb.toFixed(1)} KB，超过 ${maxKB} KB。` +
              `构建脚本里有量化（FASTOCTREE 255 色），别绕过它`)
  }
  notes.push(`${rel(p)} ${kb.toFixed(1)} KB`)
}

// ── 一、首页五入口 ───────────────────────────────────────────────
{
  const MAP = {                                   // 和 build-entry-icons.mjs 同一张表
    'entry-news': 'jiandu', 'entry-hall': 'huazhou', 'entry-course': 'jiangan',
    'entry-resource': 'shuhan', 'entry-enroll': 'bijian'
  }
  const raw = JSON.parse(py('sys.stdout.write(json.dumps(o.icon_set(), ensure_ascii=False))'))
  const t = tokens()
  const svgs = {}
  for (const [name, key] of Object.entries(MAP)) {
    if (!raw[key]) { errs.push(`设计稿的 icon_set() 里没有 ${key}`); continue }
    svgs[name] = raw[key].replace(/var\(--([a-z0-9-]+)\)/g, (m, k) => t[k] || m)
  }
  checkHash('首页五入口', path.join(ROOT, 'scripts/entry-icons.hash'),
    crypto.createHash('sha256').update(JSON.stringify(svgs) + '|56x3').digest('hex'),
    'node scripts/build-entry-icons.mjs')
  for (const name of Object.keys(MAP)) {
    checkPng(path.join(ROOT, `miniapp/assets/images/${name}.png`), 6)
  }

  // 真的引到了没有：homeNav.js 里那张 ENTRY_IMAGES 表，五个入口一个都不能少
  const nav = read(path.join(ROOT, 'miniapp/utils/homeNav.js'))
  for (const name of Object.keys(MAP)) {
    if (!nav.includes(`/assets/images/${name}.png`)) {
      errs.push(`homeNav.js 没有引 ${name}.png —— 图在包里躺着，首页却还在走兜底图标`)
    }
  }
  // 首页得真的把 iconImage 渲出来
  const wxml = read(path.join(ROOT, 'miniapp/pages/index/index.wxml'))
  if (!/<image[^>]*\bsrc="\{\{\s*item\.iconImage\s*\}\}"/.test(wxml)) {
    errs.push('pages/index/index.wxml 没有用 <image src="{{item.iconImage}}"> 渲入口图，' +
              '图和 homeNav 的表都白配了')
  }
}

// ── 二、首页卷首（青绿山水 + 满檐 + 书法题名）────────────────────
{
  const hero = await import('./build-hero.mjs')
  checkHash('首页卷首', path.join(ROOT, 'scripts/hero.hash'),
    hero.fingerprint(hero.bakedSvgs()),
    'node scripts/build-hero.mjs')
  for (const [name, [, , , maxKB]] of Object.entries(hero.PIECES)) {
    checkPng(path.join(ROOT, `miniapp/assets/images/${name}.png`), maxKB)
  }
  checkPng(path.join(ROOT, 'miniapp/assets/images', hero.BRAND.out), hero.BRAND.maxKB)

  // 书法字必须是**墨色版**。包里曾经躺着 academy-cn-navy.png（实心像素 #2B356E，
  // 旧调色板的 navy），护栏禁了这个色值却看不进 PNG 里，于是它在首页
  // 最显眼的位置待了整整一轮没人发现。这里直接比源文件，不比色值。
  if (!/academy-cn-ink\.png$/.test(hero.BRAND.src)) {
    errs.push(`build-hero.mjs 的 BRAND.src 不是 academy-cn-ink.png —— ` +
              `方案 A 的校名用墨色版，别又换回 navy/gold/cream`)
  }

  const wxml = read(path.join(ROOT, 'miniapp/pages/index/index.wxml'))
  for (const f of [...Object.keys(hero.PIECES), hero.BRAND.out.replace('.png', '')]) {
    if (!wxml.includes(`/assets/images/${f}.png`)) {
      errs.push(`pages/index/index.wxml 没有引 ${f}.png —— 卷首缺一件`)
    }
  }
}

// ── 三、问答悬浮标 ───────────────────────────────────────────────
{
  const src = read(path.join(ROOT, 'scripts/build-ai-fab.mjs'))
  const m = src.match(/^const CH = '(.+?)'/m)
  if (!m) errs.push('build-ai-fab.mjs 里读不到 CH，护栏没法知道该烤哪个字')
  else {
    const ch = m[1]
    const glyph = path.join(ROOT, 'design/brand/seal-script', `${ch}.svg`)
    if (!fs.existsSync(glyph)) errs.push(`找不到篆书字形 ${rel(glyph)}`)
    else {
      // 字形得是归一过的：1000 框、字身不带 fill。
      // 不归一的话玉牌给字上不了色（外层 <g fill> 被字身自己的 fill 盖掉），
      // 字库导出的水印也会显在牌面上。
      const g = read(glyph)
      const bad = []
      if (!/viewBox="0 0 1000 1000"/.test(g)) {
        bad.push(`${rel(glyph)}：viewBox 不是 0 0 1000 1000，字在牌面上会偏大偏小。` +
                 `跑 node scripts/normalize-seal-glyph.mjs <源文件> ${ch}`)
      }
      if (/\bfill="/.test(g.replace(/^<svg[^>]*>/, ''))) {
        bad.push(`${rel(glyph)}：字身里有写死的 fill，玉牌的阴刻上不了色。` +
                 `跑 node scripts/normalize-seal-glyph.mjs <源文件> ${ch}`)
      }
      errs.push(...bad)
      // 字形本身不合规就别再往下算指纹了：jade_medallion() 自己也会在
      // 写死 fill 上断言，那条 Python 异常会把这里的报错顶掉，
      // 留给人的就只剩一段栈，反而看不出该改什么。
      if (!bad.length) {
        const svg = py(`sys.stdout.write(o.jade_medallion(${JSON.stringify(ch)}))`)
        checkHash('问答悬浮标', path.join(ROOT, 'scripts/ai-fab.hash'),
          crypto.createHash('sha256').update(svg + `|${ch}|56x3`).digest('hex'),
          'node scripts/build-ai-fab.mjs')
      }
    }
  }
  checkPng(path.join(ROOT, 'miniapp/assets/images/ai-fab.png'), 12)

  const wxml = read(path.join(ROOT, 'miniapp/components/ai-assistant/index.wxml'))
  if (!wxml.includes('/assets/images/ai-fab.png')) {
    errs.push('ai-assistant/index.wxml 没有引 ai-fab.png，浮标还是旧的那枚')
  }
}

if (errs.length) {
  console.error('check-baked-icons 发现问题：')
  for (const e of errs) console.error('  ✗ ' + e)
  process.exit(1)
}
console.log('✓ 烤成图的图标与设计源、令牌一致，且页面确实引到了')
console.log('  ' + notes.join('；'))
