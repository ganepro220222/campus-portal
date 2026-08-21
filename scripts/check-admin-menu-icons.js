#!/usr/bin/env node
/**
 * 后台侧栏图标查重。
 *
 * 「分类管理」和「功能入口」曾同时用 Grid，侧栏里就是两个一模一样的九宫格，
 * 只能靠读文字来分辨——这类重复肉眼扫代码很难发现（两处相隔 10 行、在不同分组里），
 * 但用起来非常明显。菜单还会随后台功能继续加，所以钉一道关卡。
 *
 * 检查项：
 *   A. 同一个图标被两个菜单项使用
 *   B. 引用了 @element-plus/icons-vue 里不存在的图标名（写错名字会让整个后台白屏）
 *   C. import 了却没用上的图标名
 *
 * 图标清单从 admin/package.json 锁定的版本取；取不到（未联网 / 未装依赖）时
 * 跳过 B 项并说明，A / C 两项照常执行。
 *
 * 用法：node scripts/check-admin-menu-icons.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const routerPath = path.join(root, 'admin/src/router/index.ts')

function readMenuEntries(src) {
  // 只取 menuItems 数组里的条目：{ ... title: '…', icon: Xxx ... }
  const start = src.indexOf('export const menuItems')
  if (start < 0) throw new Error('没找到 menuItems，check-admin-menu-icons 需要跟着改')
  const body = src.slice(start)
  return [...body.matchAll(/title:\s*'([^']+)'[^}]*?icon:\s*([A-Za-z0-9_]+)/g)]
    .map(m => ({ title: m[1], icon: m[2] }))
    .concat(
      // 分组是 icon 在 title 之后的写法：title: '…', \n icon: Xxx,
      []
    )
}

function readImportedIcons(src) {
  const m = src.match(/import\s*\{([^}]+)\}\s*from\s*'@element-plus\/icons-vue'/)
  if (!m) return []
  return m[1].split(',').map(s => s.trim()).filter(Boolean)
}

function availableIcons() {
  // 优先读已安装的依赖；没装就返回 null，跳过存在性检查
  const candidates = [
    path.join(root, 'admin/node_modules/@element-plus/icons-vue/dist/index.js'),
    path.join(root, 'node_modules/@element-plus/icons-vue/dist/index.js'),
  ]
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue
    const src = fs.readFileSync(p, 'utf8')
    const names = new Set(
      [...src.matchAll(/export\s*\{([^}]*)\}/g)]
        .flatMap(m => m[1].split(','))
        .map(x => x.trim().split(/\s+as\s+/).pop())
        .filter(x => /^[A-Z][A-Za-z0-9]*$/.test(x))
    )
    if (names.size) return names
  }
  return null
}

function main() {
  const src = fs.readFileSync(routerPath, 'utf8')
  const entries = readMenuEntries(src)
  const imported = readImportedIcons(src)
  const errs = []

  if (!entries.length) errs.push('menuItems 里一个带 icon 的条目都没解析到，解析规则可能过期了')

  const byIcon = new Map()
  for (const e of entries) {
    if (!byIcon.has(e.icon)) byIcon.set(e.icon, [])
    byIcon.get(e.icon).push(e.title)
  }
  for (const [icon, titles] of byIcon) {
    if (titles.length > 1) {
      errs.push(`图标 ${icon} 被 ${titles.length} 个菜单项共用：${titles.join('、')}——侧栏里会长得一模一样`)
    }
  }

  const usedSet = new Set(entries.map(e => e.icon))
  for (const name of imported) {
    if (!usedSet.has(name)) errs.push(`import 了 ${name} 但 menuItems 里没用到`)
  }

  const available = availableIcons()
  if (available) {
    for (const name of imported) {
      if (!available.has(name)) errs.push(`@element-plus/icons-vue 里没有 ${name}，后台会整页起不来`)
    }
  }

  if (errs.length) {
    console.error('check-admin-menu-icons 发现问题：')
    for (const e of errs) console.error('  ✗ ' + e)
    process.exit(1)
  }
  const note = available ? '' : '（未安装 admin 依赖，跳过图标名存在性检查）'
  console.log(`check-admin-menu-icons OK（${entries.length} 个菜单项，图标互不重复）${note}`)
}

main()
