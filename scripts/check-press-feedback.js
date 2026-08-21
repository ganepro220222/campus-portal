#!/usr/bin/env node
/**
 * 按下反馈方向一致性检查（uibatch5 手工扫出来的规律，uibatch6 固化成关卡）。
 *
 * 全仓的可点面按下去都应该「变深」。此前 packageC/profile/list.wxss 的
 * .pl-retry 与 .pl-redownload 反着来——静息 --sky-2、按下却是更浅的 --sky-3，
 * 在下载记录/学习足迹页按下去像是弹起来，全 App 独此两处。
 * 这种错单看一条规则完全正常，只有横向比对才看得出来，所以要脚本盯。
 *
 * 规则：同一个 class 既有静息背景又有 :active 背景时，:active 必须更深。
 * 只比纯色（十六进制、var(--token)、rgba）；渐变跳过——渐变的「深浅」没有单一定义。
 * rgba 按叠在页面底色 #F5F8FC 上合成后再比，所以同色加大 alpha 也算变深。
 *
 * 用法：node scripts/check-press-feedback.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const miniappDir = path.join(root, 'miniapp')

/** app.wxss 里定义的设计变量；只需要会出现在背景色上的那些 */
function readTokens() {
  const src = fs.readFileSync(path.join(miniappDir, 'app.wxss'), 'utf8')
  const out = {}
  for (const m of src.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) out[m[1]] = m[2]
  return out
}

const PAGE_BG = [245, 248, 252] // --paper #F5F8FC，rgba 合成时的底色

function hexToRgb(h) {
  let s = h.replace('#', '')
  if (s.length === 3) s = [...s].map(c => c + c).join('')
  if (s.length === 8) s = s.slice(0, 6)
  const n = parseInt(s, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** 返回 [r,g,b]，解析不了返回 null */
function parseColor(raw, tokens) {
  const v = raw.trim()
  if (/gradient/i.test(v)) return null
  const varM = v.match(/var\(\s*(--[\w-]+)\s*\)/)
  if (varM) return tokens[varM[1]] ? hexToRgb(tokens[varM[1]]) : null
  const rgbaM = v.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/)
  if (rgbaM) {
    const [r, g, b] = [rgbaM[1], rgbaM[2], rgbaM[3]].map(Number)
    const a = rgbaM[4] === undefined ? 1 : Number(rgbaM[4])
    return [r, g, b].map((c, i) => c * a + PAGE_BG[i] * (1 - a))
  }
  const hexM = v.match(/#[0-9a-fA-F]{3,8}\b/)
  if (hexM) return hexToRgb(hexM[0])
  if (v === 'transparent' || v === 'none') return PAGE_BG.slice()
  return null
}

function luminance(rgb) {
  return rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114
}

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (name.endsWith('.wxss')) out.push(full)
  }
  return out
}

function backgroundsIn(src, tokens) {
  const base = {}
  const active = {}
  for (const m of src.matchAll(/\.([\w-]+)\s*\{([^}]*)\}/g)) {
    const decl = m[2].match(/background(?:-color)?\s*:\s*([^;]+);/)
    if (decl) base[m[1]] = parseColor(decl[1], tokens)
  }
  for (const m of src.matchAll(/\.([\w-]+):active\s*\{([^}]*)\}/g)) {
    const decl = m[2].match(/background(?:-color)?\s*:\s*([^;]+);/)
    if (decl) active[m[1]] = parseColor(decl[1], tokens)
  }
  return { base, active }
}

function main() {
  const tokens = readTokens()
  const files = walk(miniappDir)
  const errs = []
  let checked = 0

  for (const file of files) {
    const rel = path.relative(root, file)
    const { base, active } = backgroundsIn(fs.readFileSync(file, 'utf8'), tokens)
    for (const cls of Object.keys(active)) {
      if (!base[cls] || !active[cls]) continue
      checked++
      const delta = luminance(active[cls]) - luminance(base[cls])
      if (delta > 1) {
        errs.push(`${rel}  .${cls}:active 比静息更浅（亮度 +${delta.toFixed(1)}）——` +
          `全仓约定按下变深，别让它看起来像「弹起来」`)
      }
    }
  }

  if (errs.length) {
    console.error('check-press-feedback 发现问题：')
    for (const e of errs) console.error('  ✗ ' + e)
    process.exit(1)
  }
  console.log(`check-press-feedback OK（${checked} 处可点面，按下一律变深）`)
}

main()
