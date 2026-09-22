#!/usr/bin/env node
/**
 * 把登录页那朵祥云的令牌写进 miniapp/app.wxss。
 *
 * 原来它是 8 个 view 摞出来的：三个圆瓣 + 一道横条，金的垫底、朱的在上。
 * 外形对，但**两道内卷没搬**——当时的理由是"换算过来 1.8rpx，
 * 这个尺寸上 CSS 画不出来"。而设计稿 ruyi_divider() 的注释恰恰写着：
 *
 *     中间先画成"如意云头"，怎么调都是一颗心：
 *     如意头的辨识度靠两侧的内卷，光靠三个圆瓣区分不开。
 *
 * 也就是说，被跳过的正是这个图形赖以成立的那一件。
 * 落到屏幕上就是一坨红团——这就是"红云还是没对"。
 *
 * CSS 画不了 0.9 设计单位宽的弧，SVG 能。所以改走和角叶、纹样同一条路：
 * 生成 data URI 当令牌，页面上只留一个盒子铺背景，顺带从 8 个节点降到 1 个。
 *
 * ⚠ data URI 里 `#` 必须写成 %23（裸 # 会把 url() 提前截断），
 *   而 var() 在 data URI 里根本不解析，所以颜色只能是字面量。
 *   取值与令牌表一致，下面会逐个验。
 *
 * 用法：node scripts/build-ruyi-token.mjs
 */
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const V2 = path.join(ROOT, 'design/demo/v2')
const WXSS = path.join(ROOT, 'miniapp/app.wxss')
const HASH_FILE = path.join(ROOT, 'scripts/ruyi.hash')
const BEGIN = '  /* ══ 祥云开始 · 由 scripts/build-ruyi-token.mjs 生成，勿手改 ══ */'
const END = '  /* ══ 祥云结束 ══ */'

/** 令牌表里这三个色，data URI 里必须和它们一模一样 */
const MUST = {
  '%23CBA86B': '--gold',
  '%239E2B25': '--zhu',
  '%23F9EEDC': '--wood-pale（＝设计稿 --wood-10）'
}

export function ruyiToken() {
  const raw = JSON.parse(execFileSync('python', ['-c', `
import sys, json
sys.path.insert(0, ${JSON.stringify(V2)})
import _ornaments as o
sys.stdout.write(json.dumps(o.ruyi_cloud_token(), ensure_ascii=False))
`], { encoding: 'utf8', maxBuffer: 4 << 20 }).replace(/\r\n/g, '\n'))

  const v = raw['--ruyi'] || ''
  const bad = []
  if (!v.startsWith('url("data:image/svg+xml,')) bad.push('--ruyi 不是 data URI')
  if (/#[0-9A-Fa-f]{3,6}/.test(v)) bad.push('里面有没转义的 #，data URI 会被截断')
  for (const [hex, name] of Object.entries(MUST)) {
    if (!v.includes(hex)) bad.push(`少了 ${name} ${hex}`)
  }
  // 内卷就是这件东西的辨识度所在，少了等于白改
  const curls = (v.match(/a2\.0,2\.0 0 1,[01]/g) || []).length
  if (curls !== 2) bad.push(`内卷应当是两道，数到 ${curls} 道`)
  // 金在下、朱在上：金那一组必须先出现，否则描边被盖住
  if (v.indexOf('%23CBA86B') > v.indexOf('%239E2B25')) {
    bad.push('朱画在金前面了——金是垫在底下当描边用的，顺序反了就没有边')
  }
  if (!/--ruyi-w/.test(Object.keys(raw).join()) || !/--ruyi-h/.test(Object.keys(raw).join())) {
    bad.push('缺 --ruyi-w / --ruyi-h，页面没法定尺寸')
  }
  if (bad.length) throw new Error('祥云令牌不合格：\n  ' + bad.join('\n  '))
  return raw
}

export function fingerprint(t) {
  return crypto.createHash('sha256').update(JSON.stringify(t)).digest('hex')
}

export function block(t) {
  return [BEGIN,
    ...Object.entries(t).map(([k, v]) => `  ${k}: ${v};`),
    END].join('\n')
}

export function currentBlock() {
  const src = fs.readFileSync(WXSS, 'utf8').replace(/\r\n/g, '\n')
  const i = src.indexOf(BEGIN)
  const j = src.indexOf(END)
  if (i < 0 || j < 0) return null
  return src.slice(i, j + END.length)
}

function main() {
  const t = ruyiToken()
  let src = fs.readFileSync(WXSS, 'utf8')
  const i = src.indexOf(BEGIN)
  const j = src.indexOf(END)
  if (i >= 0 && j >= 0) {
    src = src.slice(0, i) + block(t) + src.slice(j + END.length)
  } else {
    // 第一次注入：放在令牌区的收尾花括号之前（令牌得留在 page{} 里面）
    const anchor = '}\n/* ══ 令牌区结束 ══ */'
    if (!src.includes(anchor)) throw new Error('app.wxss 里找不到令牌区的收尾')
    src = src.replace(anchor, '\n' + block(t) + '\n' + anchor)
  }
  fs.writeFileSync(WXSS, src)
  fs.writeFileSync(HASH_FILE, fingerprint(t) + '\n')
  console.log(`✓ 祥云令牌写进 app.wxss（${(t['--ruyi'].length / 1024).toFixed(1)} KB，` +
              `${t['--ruyi-w']} × ${t['--ruyi-h']}，含两道内卷）`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
