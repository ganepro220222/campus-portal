#!/usr/bin/env node
/**
 * 把如意云头角叶的四个令牌写进 miniapp/app.wxss。
 *
 * 角叶是装裱的护角，设计稿里每一个图片框（轮播、展馆封面、资讯缩略图）
 * 四角都有。它一直只存在于 design/demo/v2/shuyuan.css —— 小程序这边
 * 一个都没有，所以线上的图片框是光板的圆角矩形。
 * check-corner-brackets.mjs 量的是**设计稿页面**，量不到小程序，
 * 所以这个缺口一直没人报。
 *
 * 为什么是 CSS 令牌而不是 PNG：角叶要贴在四个角上、跟着框的尺寸缩放，
 * 而且三档尺寸只靠改一个 --bj 调边长。data URI 能直接进 background，
 * PNG 反而要四个 <image> 绝对定位，挡点击还多四个节点。
 * 四张一共 12.6 KB，只在 app.wxss 里存一份。
 *
 * ⚠ `%23` 这个坑踩过四次：`#` 在 data URI 里必须写成 %23，
 * 但**只有在 data URI 内部**才会被解码成 `#`；写成内联 SVG 就是字面量 %23，
 * 颜色直接失效。_ornaments.py 的注入口有断言挡这个，这里再验一道。
 *
 * 用法：node scripts/build-jiaoye-tokens.mjs
 */
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const V2 = path.join(ROOT, 'design/demo/v2')
const WXSS = path.join(ROOT, 'miniapp/app.wxss')
const HASH_FILE = path.join(ROOT, 'scripts/jiaoye.hash')
const BEGIN = '  /* ══ 角叶开始 · 由 scripts/build-jiaoye-tokens.mjs 生成，勿手改 ══ */'
const END = '  /* ══ 角叶结束 ══ */'

export function jiaoyeTokens() {
  const raw = JSON.parse(execFileSync('python', ['-c', `
import sys, json
sys.path.insert(0, ${JSON.stringify(V2)})
import _ornaments as o
sys.stdout.write(json.dumps(o.jiaoye_tokens(), ensure_ascii=False))
`], { encoding: 'utf8', maxBuffer: 16 << 20 }).replace(/\r\n/g, '\n'))

  const names = Object.keys(raw)
  const bad = []
  if (names.length !== 4) bad.push(`应当是四个角，拿到 ${names.length} 个`)
  for (const [k, v] of Object.entries(raw)) {
    if (!v.startsWith('url("data:image/svg+xml,')) bad.push(`${k} 不是 data URI`)
    // 颜色必须是 %23 而不是裸 #：裸 # 会把 url() 提前截断
    if (/#[0-9A-Fa-f]{3,6}/.test(v)) bad.push(`${k} 里有没转义的 #，data URI 会被截断`)
    if (!/%23/.test(v)) bad.push(`${k} 里一个 %23 都没有，颜色大概没写进去`)
  }
  // 四个角是分别生成的，翻转复用会把投影方向也翻过去 —— 必须互不相同
  if (new Set(Object.values(raw)).size !== names.length) bad.push('四个角里有重复的图')
  if (bad.length) throw new Error('角叶不合格：\n  ' + bad.join('\n  '))
  return raw
}

export function fingerprint(t) {
  return crypto.createHash('sha256').update(JSON.stringify(t)).digest('hex')
}

/** 生成要写进 app.wxss 的那一段（护栏也用它来比对） */
export function block(t) {
  return [BEGIN,
    ...Object.entries(t).map(([k, v]) => `  ${k}: ${v};`),
    END].join('\n')
}

export function currentBlock() {
  // Windows 检出常是 CRLF，比对按 LF，否则四个角叶明明一样也会报对不上
  const src = fs.readFileSync(WXSS, 'utf8').replace(/\r\n/g, '\n')
  const i = src.indexOf(BEGIN)
  const j = src.indexOf(END)
  if (i < 0 || j < 0) return null
  return src.slice(i, j + END.length)
}

function main() {
  const t = jiaoyeTokens()
  let src = fs.readFileSync(WXSS, 'utf8')
  const i = src.indexOf(BEGIN)
  const j = src.indexOf(END)
  if (i >= 0 && j >= 0) {
    src = src.slice(0, i) + block(t) + src.slice(j + END.length)
  } else {
    // 第一次注入：放在 :root 的收尾花括号之前（令牌得留在 :root 里面，
    // 那行 `══ 令牌区结束 ══` 的标记在花括号之外）
    const anchor = '}\n/* ══ 令牌区结束 ══ */'
    if (!src.includes(anchor)) throw new Error('app.wxss 里找不到令牌区的收尾')
    src = src.replace(anchor, '\n' + block(t) + '\n' + anchor)
  }
  fs.writeFileSync(WXSS, src)
  fs.writeFileSync(HASH_FILE, fingerprint(t) + '\n')
  const kb = Object.values(t).reduce((a, v) => a + v.length, 0) / 1024
  console.log(`✓ 四个角叶令牌写进 app.wxss（合计 ${kb.toFixed(1)} KB）`)
  for (const [k, v] of Object.entries(t)) console.log(`  ${k}  ${(v.length / 1024).toFixed(1)} KB`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
