#!/usr/bin/env node
/**
 * 拦「栏距类和横向外边距叠在同一个元素上」。
 *
 * 首页的栏距是靠 .wrap { padding: 0 32rpx } 给的。谁要是在**同一个元素**上
 * 再写一条横向 margin，这个元素的内容就会比它的兄弟们左右偏出去，
 * 而那点偏移在模拟器上不明显——真机上是段头那枚朱印和上下两段对不齐。
 *
 * 这条不是假想的：给「最新动态」补通栏暖纸时，我照着设计稿抄了
 * `margin: 4px -16px 0`。设计稿那一层是包在 .wrap **外面**的，
 * -16px 是用来抵消父级缩进；小程序这边 band 和 .wrap 在同一个元素上，
 * 而 .sheet 没有横向内边距、.section 本来就通栏，于是那对负外边距
 * 纯属多余：暖纸横跨到 -32rpx…屏宽+32rpx（两边各被裁掉 32rpx），
 * 内容整体左移 32rpx。量出来印的左边缘 展馆 16px / 动态 0px / 课程 16px。
 *
 * 要通栏出血就**别叠在栏距类上**：要么单开一层包在外面（设计稿的做法），
 * 要么像现在这样——元素本来就通栏，只加背景，一点 margin 都不要。
 *
 * 用法：node scripts/check-gutter-classes.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const MINI = path.join(ROOT, 'miniapp')

/** 哪些类是"给栏距的" —— 它们用 padding 定左右留白，别人不许再动 margin */
const GUTTER = ['wrap']

const errs = []
const files = []
;(function walk (d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) { if (!/node_modules|miniprogram_npm/.test(e.name)) walk(p); continue }
    if (/\.(wxml|wxss)$/.test(e.name)) files.push(p)
  }
})(MINI)

const wxss = files.filter((f) => f.endsWith('.wxss'))
const wxml = files.filter((f) => f.endsWith('.wxml'))
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')

/** 类名 → 它设过的横向 margin（有几条算几条），来源文件一并记着 */
function horizontalMargins () {
  const map = new Map()
  for (const f of wxss) {
    const css = strip(fs.readFileSync(f, 'utf8'))
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const sel = rule[1].trim()
      if (sel.startsWith('@')) continue
      const decls = []
      for (const d of rule[2].matchAll(/(^|;)\s*margin(-left|-right)?\s*:\s*([^;]+)/g)) {
        const side = d[2], val = d[3].trim()
        if (side) { if (!/^0\w*$/.test(val)) decls.push(`margin${side}: ${val}`); continue }
        // 简写：margin: a [b [c [d]]] —— 横向取第 2 个（只有一个值时取它自己）
        const parts = val.split(/\s+/)
        const h = parts.length === 1 ? parts[0] : parts[1]
        if (h && !/^0\w*$/.test(h) && h !== 'auto') decls.push(`margin: ${val}（横向 ${h}）`)
      }
      if (!decls.length) continue
      for (const one of sel.split(',')) {
        const last = one.trim().split(/[\s>+~]+/).pop() || ''
        if (/::/.test(last)) continue
        const cls = [...last.matchAll(/\.([A-Za-z][\w-]*)/g)].map((m) => m[1])
        if (cls.length !== 1) continue           // 只认单类选择器，状态类不算
        const rel = path.relative(MINI, f).split(path.sep).join('/')
        const cur = map.get(cls[0]) || []
        map.set(cls[0], cur.concat(decls.map((d) => ({ d, rel }))))
      }
    }
  }
  return map
}

const MARGINS = horizontalMargins()

for (const f of wxml) {
  const rel = path.relative(MINI, f).split(path.sep).join('/')
  const src = fs.readFileSync(f, 'utf8')
  for (const m of src.matchAll(/class="([^"]*)"/g)) {
    // {{…}} 里的名字也算数：三元里写死的类同样会落到这个元素上
    const names = m[1]
      .replace(/\{\{([^}]*)\}\}/g, (_, b) =>
        [...b.matchAll(/'([^']*)'|"([^"]*)"/g)].map((q) => q[1] ?? q[2]).join(' '))
      .split(/\s+/).filter(Boolean)
    const gutter = names.filter((n) => GUTTER.includes(n))
    if (!gutter.length) continue
    const line = src.slice(0, m.index).split('\n').length
    for (const n of names) {
      if (GUTTER.includes(n)) continue
      const hit = MARGINS.get(n)
      if (!hit) continue
      errs.push(`${rel}:${line} 的元素同时挂着 .${gutter[0]}（栏距）和 .${n}，` +
        `而 .${n} 在 ${hit[0].rel} 里设了 ${hit[0].d}\n` +
        `      栏距是 padding 给的，同一个元素再动横向 margin，` +
        `这一段的内容就会比兄弟段左右偏出去（段头那枚印会对不齐）。\n` +
        `      要通栏出血就单开一层包在外面，或者干脆别加 margin` +
        `——.sheet 没有横向内边距，.section 本来就通栏。`)
    }
  }
}

if (errs.length) {
  console.error('check-gutter-classes 发现问题：')
  for (const e of errs) console.error('  ✗ ' + e)
  process.exit(1)
}
console.log(`check-gutter-classes OK（栏距类 ${GUTTER.map((g) => '.' + g).join('/')}，` +
            `没有谁在同一个元素上再动横向 margin）`)
