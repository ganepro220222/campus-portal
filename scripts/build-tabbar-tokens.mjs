#!/usr/bin/env node
/**
 * 把自定义 tabBar 用到的那几个令牌，**复制一份**进 custom-tab-bar/index.wxss。
 *
 * ── 为什么非要复制 ────────────────────────────────────────────
 * 令牌定义在 app.wxss 的 `page { … }` 上，靠继承发到全页。
 * 页面里的组件（nav-bar、ai-assistant、icon）都是 page 的后代，
 * 继承照常，所以那些组件里的 var() 一直是好的。
 *
 * **自定义 tabBar 不是 page 的后代。** 它由客户端单独挂一层，
 * 和页面是并列的两棵树（ai-assistant 的注释里写过同一件事：
 * "页面里给再高的 z-index 也盖不住它"）。
 * 继承到不了，于是这个组件里每一处 var() 都解析失败：
 *
 *   background-color: var(--paper-card)  → 声明作废 → 整条栏**透明**
 *   background-image: var(--fret-cut)…   → 声明作废 → 回纹带不画
 *   border-top: 1rpx solid var(--line)   → 声明作废 → 连分隔线都没有
 *   color: var(--jin-70)                 → 声明作废 → 标签字回落成黑
 *
 * 真机上就是"底部导航变透明、雷纹不见了"。
 * 而且这不是新问题：旧标签栏的底色写的是字面量 rgba(255,255,255,.96)，
 * 正好把整条栏糊上了，另外那几处 var() 其实一直在默默失效，没人看得出来。
 * 上一轮把底色换成 var(--paper-card)，这层遮羞布没了，全露出来。
 *
 * ── 为什么不直接在组件里写死颜色 ──────────────────────────────
 * 写死就成了调色板的第二份副本，改一次要记得改两处，迟早对不上；
 * 而且 check-miniapp-design-tokens 的棘轮会（正确地）报它。
 * 所以走和角叶、纹理一样的路子：**从 app.wxss 现抄**，
 * 抄哪几个不用手维护 —— 扫组件自己用了哪些 var(--x) 就抄哪几个。
 *
 * 产物写在 .tabbar-wrap 上（组件自己的根节点），组件内部照常继承。
 *
 * 用法：node scripts/build-tabbar-tokens.mjs
 */
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const APP = path.join(ROOT, 'miniapp/app.wxss')
const WXSS = path.join(ROOT, 'miniapp/custom-tab-bar/index.wxss')
const HASH_FILE = path.join(ROOT, 'scripts/tabbar-tokens.hash')
const BEGIN = '/* ══ 令牌副本开始 · 由 scripts/build-tabbar-tokens.mjs 生成，勿手改 ══ */'
const END = '/* ══ 令牌副本结束 ══ */'

/** app.wxss 令牌区里所有 `--name: value;`（只取第一次出现的，和别处同一个约定） */
function appTokens() {
  const src = fs.readFileSync(APP, 'utf8').replace(/\r\n/g, '\n')
  const a = src.indexOf('/* ══ 令牌区开始')
  const b = src.indexOf('/* ══ 令牌区结束')
  if (a < 0 || b < 0) throw new Error('app.wxss 里找不到令牌区的起止标记')
  const block = src.slice(a, b)
  const out = {}
  for (const m of block.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    const k = m[1]
    if (!(k in out)) out[k] = m[2].split('\n').map(s => s.trim()).join(' ').trim()
  }
  return out
}

/**
 * 组件自己用到了哪些令牌。
 * 只扫**生成区以外**的部分——不然刚写进去的定义会被当成"用到了"，
 * 一轮一轮自我滚雪球。
 */
export function neededNames() {
  const src = fs.readFileSync(WXSS, 'utf8').replace(/\r\n/g, '\n')
  const i = src.indexOf(BEGIN)
  const j = src.indexOf(END)
  const body = (i >= 0 && j >= 0) ? src.slice(0, i) + src.slice(j + END.length) : src
  return [...new Set([...body.matchAll(/var\((--[a-z0-9-]+)\)/g)].map(m => m[1]))].sort()
}

export function tabbarTokens() {
  const all = appTokens()
  const need = neededNames()
  const out = {}
  const bad = []
  for (const n of need) {
    if (!(n in all)) { bad.push(`app.wxss 的令牌区里没有 ${n}`); continue }
    let v = all[n]
    // 令牌指向另一个令牌时要摊平：组件里继承链断了，var() 套 var() 一样解析不了
    for (let i = 0; i < 4 && /var\(--/.test(v); i++) {
      v = v.replace(/var\((--[a-z0-9-]+)\)/g, (m, k) => (k in all ? all[k] : m))
    }
    if (/var\(--/.test(v)) bad.push(`${n} 摊不平，还剩 var()：${v.slice(0, 60)}…`)
    if (/#[0-9A-Fa-f]{3,6}/.test(v) && v.includes('data:')) {
      bad.push(`${n} 是 data URI 却有没转义的 #，url() 会被截断`)
    }
    out[n] = v
  }
  if (!need.length) bad.push('组件里一个 var() 都没有，这个脚本没有存在的必要了')
  if (bad.length) throw new Error('令牌副本不合格：\n  ' + bad.join('\n  '))
  return out
}

export function fingerprint(t) {
  return crypto.createHash('sha256').update(JSON.stringify(t)).digest('hex')
}

export function block(t) {
  return [
    BEGIN,
    '/* 自定义 tabBar 是页面之外的独立层，继承不到 page 上的令牌，',
    '   所以在组件自己的根节点上补一份。值从 app.wxss 现抄，别手改。 */',
    '.tabbar-wrap {',
    ...Object.entries(t).map(([k, v]) => `  ${k}: ${v};`),
    '}',
    END
  ].join('\n')
}

export function currentBlock() {
  const src = fs.readFileSync(WXSS, 'utf8').replace(/\r\n/g, '\n')
  const i = src.indexOf(BEGIN)
  const j = src.indexOf(END)
  if (i < 0 || j < 0) return null
  return src.slice(i, j + END.length)
}

function main() {
  const t = tabbarTokens()
  let src = fs.readFileSync(WXSS, 'utf8')
  const i = src.indexOf(BEGIN)
  const j = src.indexOf(END)
  if (i >= 0 && j >= 0) {
    src = src.slice(0, i) + block(t) + src.slice(j + END.length)
  } else {
    // 第一次：插在文件头那段注释之后、第一条规则之前
    const anchor = '\n.tabbar-wrap {'
    if (!src.includes(anchor)) throw new Error('custom-tab-bar/index.wxss 里找不到 .tabbar-wrap')
    src = src.replace(anchor, '\n' + block(t) + '\n' + anchor)
  }
  fs.writeFileSync(WXSS, src)
  fs.writeFileSync(HASH_FILE, fingerprint(t) + '\n')
  const kb = Object.values(t).reduce((a, v) => a + v.length, 0) / 1024
  console.log(`✓ ${Object.keys(t).length} 个令牌抄进 custom-tab-bar（${kb.toFixed(1)} KB）`)
  for (const [k, v] of Object.entries(t)) {
    console.log(`  ${k}  ${v.length > 40 ? v.slice(0, 37) + '…' : v}`)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main()
