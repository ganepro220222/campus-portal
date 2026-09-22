#!/usr/bin/env node
/**
 * 小程序「我的」菜单的图标查重。
 *
 * 后台侧栏早有同款检查（check-admin-menu-icons.js），理由写得很清楚：
 * 两个菜单项用同一枚图标，侧栏里就是两个一模一样的九宫格，只能靠读文字分辨。
 * 小程序这边一直没上，于是同样的事悄悄发生了两次：
 *   「问答历史」和「意见反馈」都用 chat（信札）
 *   「关联小程序」和「关于云端书院」都用 grid（棂格）
 * 九项里有四项撞车。
 *
 * 之前没人看出来，是因为那一列图标各自套在**彩色方块**里
 * （.mi-blue / .mi-gold / .mi-slate），颜色替图形分担了辨识。
 * 这一轮把那三种彩块收成统一的纸钮（旧蓝紫是"色调不对"的主要来源），
 * 辨识全压回图形本身，重复立刻就露出来了。
 *
 * 也就是说：这条重复**一直都在**，只是被一层颜色盖着。和网格那次
 * （min-width 靠 overflow: hidden 的副作用压着）是同一类账。
 *
 * 顺带验图标名真实存在 —— 写错名字 buildSrc 会拿不到字形，
 * 那一格就是个空白，wxml 语法却完全合法。
 *
 * 用法：node scripts/check-miniapp-menu-icons.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WXML = path.join(ROOT, 'miniapp/pages/profile/index.wxml')

const src = fs.readFileSync(WXML, 'utf8')
const errs = []

// 菜单项：<view class="menu-item" …> … <view class="mi-ic"><icon name="X" …
const items = [...src.matchAll(
  /class="menu-item"[\s\S]*?class="mi-ic"><icon name="([a-z0-9-]+)"[\s\S]*?class="mi-tx">([^<]+)</g
)].map(m => ({ icon: m[1], title: m[2].trim() }))

if (items.length < 5) {
  errs.push(`只解析到 ${items.length} 个菜单项，"我的"页至少有 9 项 —— ` +
            '结构大概改了，这条检查要跟着改，不能默默放行')
}

// A. 图标不许重复
const byIcon = new Map()
for (const it of items) {
  if (!byIcon.has(it.icon)) byIcon.set(it.icon, [])
  byIcon.get(it.icon).push(it.title)
}
for (const [icon, titles] of byIcon) {
  if (titles.length > 1) {
    errs.push(`图标 ${icon} 被 ${titles.length} 项共用：${titles.join('、')}\n` +
              '      这一列图标没有颜色区分，重复了就只能靠读文字辨认')
  }
}

// B. 图标名要真实存在
let known = null
try {
  const icons = require(path.join(ROOT, 'miniapp/components/icon/icons.js'))
  // buildSrc 拿不到字形时返回空串，用这个判存在最贴近运行时的真实行为
  known = (name) => !!icons.buildSrc(name, 20, '#000', 0)
} catch (e) {
  errs.push('读不到 components/icon/icons.js：' + e.message)
}
if (known) {
  for (const it of items) {
    if (!known(it.icon)) {
      errs.push(`「${it.title}」用的图标名 ${it.icon} 在 icons.js 里不存在 —— ` +
                '那一格会是空白，而 wxml 语法完全合法')
    }
  }
}

if (errs.length) {
  console.error('check-miniapp-menu-icons 发现问题：')
  for (const e of errs) console.error('  ✗ ' + e)
  process.exit(1)
}
console.log(`✓「我的」菜单 ${items.length} 项，图标互不重复且都存在`)
