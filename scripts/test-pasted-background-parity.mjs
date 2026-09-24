#!/usr/bin/env node
/**
 * 白底过滤：后台和小程序两份实现必须一模一样。
 *
 * 为什么会有两份：小程序是独立的 CommonJS 包，构建时不参与 admin 的 Vite，
 * 两边 import 不到对方。复制就有走偏的风险——后台改了阈值、小程序没改，
 * 结果是「新发的干净、旧的还脏」或者反过来，而这种偏差不会有任何报错。
 * 所以拿同一张用例表逐条比对，顺便把行为本身钉死。
 *
 * 用法：node scripts/test-pasted-background-parity.mjs
 */
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

const mini = require(path.join(ROOT, 'miniapp/utils/content.js'))
const admin = await import(pathToFileURL(path.join(ROOT, 'admin/src/utils/pastedBackground.mjs')).href)

/** [说明, 输入, 期望输出] —— 期望是写死的，不是拿另一边的结果当答案 */
const CASES = [
  ['纯白简写',
    '<p style="background:#fff;text-align:justify">正文</p>',
    '<p style="text-align:justify">正文</p>'],
  ['纯白 background-color',
    '<p style="background-color: #FFFFFF">正文</p>',
    '<p>正文</p>'],
  ['rgb() 形式的白',
    '<span style="background-color: rgb(255, 255, 255)">正文</span>',
    '<span>正文</span>'],
  ['rgba() 形式的白',
    "<span style='background:rgba(255,255,255,0.9)'>正文</span>",
    '<span>正文</span>'],
  ['关键字 white',
    '<section style="background:white;line-height:1.75">正文</section>',
    '<section style="line-height:1.75">正文</section>'],
  ['近白 #FAFAFA 也算',
    '<p style="background-color:#FAFAFA">正文</p>',
    '<p>正文</p>'],
  ['#fff 三位简写',
    '<p style="background:#FFF">正文</p>',
    '<p>正文</p>'],
  // —— 以下是不该动的 ——
  ['黄色荧光笔：有意的排版，留着',
    '<span style="background-color:#FFFF00">重点</span>',
    '<span style="background-color:#FFFF00">重点</span>'],
  ['淡但不中性的底色：留着',
    '<span style="background:#FFF0F0">提示</span>',
    '<span style="background:#FFF0F0">提示</span>'],
  ['不够浅的灰：留着',
    '<p style="background:#EEEEEE">引文</p>',
    '<p style="background:#EEEEEE">引文</p>'],
  ['背景图：一概不碰',
    '<p style="background:#fff url(a.png) no-repeat">正文</p>',
    '<p style="background:#fff url(a.png) no-repeat">正文</p>'],
  ['字色里有白：只看背景，不碰 color',
    '<p style="color:#ffffff;background:#333">反白标题</p>',
    '<p style="color:#ffffff;background:#333">反白标题</p>'],
  ['没有 style 的原样返回',
    '<p>正文</p>',
    '<p>正文</p>'],
  ['多个节点各管各的',
    '<p style="background:#fff">一</p><p style="background:#FFFF00">二</p>',
    '<p>一</p><p style="background:#FFFF00">二</p>'],
  ['我们自己注入的插图纸托 #F6F2E6 不能被吃掉',
    '<img style="background:#F6F2E6;border:1rpx solid #E6DCC8" src="a.png">',
    '<img style="background:#F6F2E6;border:1rpx solid #E6DCC8" src="a.png">'],
  ['空值',
    '', ''],
]

let failed = 0
for (const [name, input, want] of CASES) {
  for (const [side, fn] of [['小程序', mini.dropPastedBackgrounds], ['后台', admin.dropPastedBackgrounds]]) {
    const got = fn(input)
    if (got !== want) {
      failed++
      console.error(`  ✗ ${side}｜${name}\n      入 ${input}\n      得 ${got}\n      期 ${want}`)
    }
  }
}

/* 阈值本身也对一遍：页面的几张纸都得留住，纯白得走 */
const TOKENS = [
  ['--paper #F7F3E8', '#F7F3E8', false],
  ['--paper-card #FFFBF2', '#FFFBF2', false],
  ['--paper-1 #F6F2E6', '#F6F2E6', false],
  ['纯白 #FFFFFF', '#FFFFFF', true],
]
for (const [name, hex, want] of TOKENS) {
  for (const [side, fn] of [['小程序', mini.isPastedWhite], ['后台', admin.isPastedWhite]]) {
    if (fn(hex) !== want) {
      failed++
      console.error(`  ✗ ${side}｜${name} 判成 ${fn(hex)}，应当是 ${want}`)
    }
  }
}

/* 两份源码的核心实现应当逐字相同（注释可以各写各的） */
const body = (src) => {
  const i = src.indexOf('function isPastedWhite')
  const j = src.indexOf('}\n', src.indexOf('return out ? '))
  return src.slice(i, j)
    .replace(/\/\*[\s\S]*?\*\//g, '')          // 注释各写各的，不比
    .replace(/\/\/[^\n]*/g, '')
    .replace(/^export /gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}
const a = body(fs.readFileSync(path.join(ROOT, 'miniapp/utils/content.js'), 'utf8'))
const b = body(fs.readFileSync(path.join(ROOT, 'admin/src/utils/pastedBackground.mjs'), 'utf8'))
if (a !== b) {
  failed++
  console.error('  ✗ 两边的函数体已经不一样了——改了一边就得改另一边\n' +
                `      小程序：${a.slice(0, 120)}…\n      后台：  ${b.slice(0, 120)}…`)
}

if (failed) {
  console.error(`test-pasted-background-parity: ${failed} 处不符`)
  process.exit(1)
}
console.log(`test-pasted-background-parity OK（${CASES.length} 条用例 × 两端，阈值与函数体一致）`)
