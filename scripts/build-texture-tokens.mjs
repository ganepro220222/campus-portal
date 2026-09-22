#!/usr/bin/env node
/**
 * 把设计稿里那几张**纹理贴图**搬进 miniapp/app.wxss。清单见下面的 SRCS。
 *
 * 大半是 feTurbulence 生成的噪声，各 ~365 字符的 data URI。
 * 它们是"平涂色块"和"一块木头/一张纸"之间的全部差别 —— 少了这几张，
 * 匾就是两块棕色矩形、入口区就是一块杏色方块，颜色对了、材质没了。
 * 棂格和回纹是另一路：规则线条，不是噪声，但同样只能从设计稿搬。
 *
 * 为什么搬而不是自己另写一套：design/demo/v2/shuyuan.css 是令牌的唯一出处，
 * 这里只做搬运。自己在小程序侧另写一份，两边迟早对不上。
 *
 * 退化行为：老安卓的 X5 内核对 feTurbulence 支持不稳。滤镜画不出来时
 * 这层 background-image 就是空的，底下的 background-color 照常显示 ——
 * 退化成"没有纹理的纯色"，不会糊成一团，所以可以放心用。
 *
 * ⚠ `%23` 同一个坑：`#` 在 data URI 里必须转义，否则 url() 被提前截断。
 * 这三张里 filter 的引用写成 url(%23f)，正是这个原因。
 *
 * 用法：node scripts/build-texture-tokens.mjs
 */
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC = path.join(ROOT, 'design/demo/v2/shuyuan.css')
const WXSS = path.join(ROOT, 'miniapp/app.wxss')
const HASH_FILE = path.join(ROOT, 'scripts/textures.hash')
const BEGIN = '  /* ══ 纹理开始 · 由 scripts/build-texture-tokens.mjs 生成，勿手改 ══ */'
const END = '  /* ══ 纹理结束 ══ */'

/**
 * 每张贴图从哪儿取、怎么验。
 *
 *   from: 'root'          —— 设计稿 :root 里的同名 custom property
 *         ['规则', n]     —— 某条规则的 background-image 里第 n 个 url()
 *   want: 值里必须出现的特征串，取错了值时用它兜住
 *
 * 为什么要 want：几张贴图长得都像「一长串 data URI」，肉眼看不出取没取对。
 * 横纹和竖纹只差 baseFrequency 的两个分量，回纹的受光面和刻痕只差一个色，
 * 复制粘贴写反了不会报错，只会画歪。
 */
const SRCS = {
  'fiber-page': { from: 'root', want: 'feTurbulence' },   // 纸纤维 · 浓（书页、登录页的纸底，opacity .14）
  'fiber':      { from: 'root', want: 'feTurbulence' },   // 纸纤维 · 淡（标签栏那层纸，opacity .05）
  'wood-fig':   { from: 'root', want: 'feTurbulence' },   // 木射线 · 横（匾心）
  'wood-fig-v': { from: 'root', want: 'feTurbulence' },   // 木射线 · 竖（匾框、裱边）
  'speckle':    { from: 'root', want: 'feTurbulence' },   // 石面的麻点（登录页那枚石青次按钮）
  'lattice':    { from: ['.login-lattice', 0], want: 'stroke=' },  // 棂格（登录页的底纹）
  /* 回纹（雷纹）带。设计稿里同一组纹样画两遍：深色是刻痕，浅色往下错 1.1px
     当受光面——少了任何一层就不是「刻」出来的，是贴上去的。
     所以这里必须是两枚令牌，不能合成一枚。 */
  'fret-cut':   { from: ['.fret', 0], want: "stroke='%237A5626'" },   // 刻痕（深）
  'fret-lit':   { from: ['.fret', 1], want: "stroke='%23F6E9D2'" }    // 受光面（浅）
}

export const NAMES = Object.keys(SRCS)

/**
 * 从设计稿里取这几张。
 *
 * shuyuan.css 有**两个** :root：前一个放颜色（15~251 行），
 * 后一个专放纹理贴图（301~362 行）。所以不能只扫第一个——
 * 第一版就是这么写的，直接报"找不到 --fiber-page"。
 * 这里把所有 :root 按出现顺序拼起来，每个名字取**第一次**出现的值，
 * 和搬颜色令牌时同一个约定（后面的是备选方案的覆写，不取）。
 */
export function textureTokens() {
  const css = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n')
  const blocks = []
  for (const m of css.matchAll(/(?:^|\n):root\s*\{/g)) {
    const j = css.indexOf('\n}', m.index)
    if (j > 0) blocks.push(css.slice(m.index, j))
  }
  if (!blocks.length) throw new Error('shuyuan.css 里一个 :root 都找不到')
  const block = blocks.join('\n')

  /* 有几张在设计稿里没有独立令牌，是写死在某条规则的 background-image 里的
     （棂格在 .login-lattice，回纹在 .fret）。与其在小程序侧另抄一份
     （抄错了没人发现），不如从那条规则里按顺序取 url()。 */
  const fromRule = (sel, idx) => {
    const rule = css.match(new RegExp(`\\${sel}\\s*\\{[^}]*\\}`))
    if (!rule) return null
    const urls = [...rule[0].matchAll(/url\("data:[^"]+"\)/g)].map(m => m[0])
    return urls[idx] ? [null, urls[idx]] : null
  }

  const out = {}
  const bad = []
  for (const [n, spec] of Object.entries(SRCS)) {
    const m = spec.from === 'root'
      ? block.match(new RegExp(`--${n}:\\s*([^;]+);`))
      : fromRule(spec.from[0], spec.from[1])
    if (!m) {
      bad.push(spec.from === 'root'
        ? `shuyuan.css 的 :root 里取不到 --${n}`
        : `shuyuan.css 的 ${spec.from[0]} 里取不到第 ${spec.from[1] + 1} 个 url()`)
      continue
    }
    const v = m[1].split('\n').map(s => s.trim()).join(' ').trim()
    if (!v.startsWith('url("data:image/svg+xml,')) bad.push(`--${n} 不是 data URI`)
    if (/#[0-9A-Fa-f]{3,6}/.test(v)) bad.push(`--${n} 里有没转义的 #，data URI 会被截断`)
    if (!v.includes(spec.want)) bad.push(`--${n} 里没有 ${spec.want}，大概取错了值`)
    out[`--${n}`] = v
  }
  if (bad.length) throw new Error('纹理不合格：\n  ' + bad.join('\n  '))
  // 必须互不相同：上面那几对只差一两个字符，取重了不会报错，只会画糊
  if (new Set(Object.values(out)).size !== NAMES.length) throw new Error('几张纹理里有重复的')
  return out
}

export function fingerprint(t) {
  return crypto.createHash('sha256').update(JSON.stringify(t)).digest('hex')
}

export function block(t) {
  return [BEGIN, ...Object.entries(t).map(([k, v]) => `  ${k}: ${v};`), END].join('\n')
}

export function currentBlock() {
  const src = fs.readFileSync(WXSS, 'utf8').replace(/\r\n/g, '\n')
  const i = src.indexOf(BEGIN)
  const j = src.indexOf(END)
  if (i < 0 || j < 0) return null
  return src.slice(i, j + END.length)
}

function main() {
  const t = textureTokens()
  let src = fs.readFileSync(WXSS, 'utf8')
  const i = src.indexOf(BEGIN)
  const j = src.indexOf(END)
  if (i >= 0 && j >= 0) {
    src = src.slice(0, i) + block(t) + src.slice(j + END.length)
  } else {
    const anchor = '}\n/* ══ 令牌区结束 ══ */'
    if (!src.includes(anchor)) throw new Error('app.wxss 里找不到令牌区的收尾')
    src = src.replace(anchor, '\n' + block(t) + '\n' + anchor)
  }
  fs.writeFileSync(WXSS, src)
  fs.writeFileSync(HASH_FILE, fingerprint(t) + '\n')
  const kb = Object.values(t).reduce((a, v) => a + v.length, 0) / 1024
  console.log(`✓ ${Object.keys(t).length} 张纹理写进 app.wxss（合计 ${kb.toFixed(1)} KB）`)
  for (const [k, v] of Object.entries(t)) console.log(`  ${k}  ${v.length} 字符`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
