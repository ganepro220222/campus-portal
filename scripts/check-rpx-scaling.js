#!/usr/bin/env node
/**
 * 屏幕适配单位检查 —— 拦「该用 rpx 的地方写了 px」。
 *
 * rpx 会按屏宽等比缩放（1rpx = 屏宽/750），px 不会。两者混用时，屏幕越宽，
 * px 写的那部分相对越小。这是真出过的：
 *
 *   components/icon/index.wxml 里 `style="width:{{size}}px;height:{{size}}px"`，
 *   于是 iPad Pro 10.5（834pt 宽）上，输入框由 54pt 长到 116pt，图标还是 18pt——
 *   图标相对尺寸从 0.33 掉到 0.16，顶栏和 tabBar 的图标看着都缩水了一半。
 *
 * 唯一该用 px 的是**状态栏 / 胶囊按钮几何**：这些值来自 wx.getWindowInfo /
 * getMenuButtonBoundingClientRect，本身就是 px，换算成 rpx 反而会错位。
 * 所以按变量名放行，而不是按文件放行。
 *
 * 检查项：
 *   A. .wxml 内联 style 里的 px，必须紧跟在允许的几何变量插值之后
 *   B. icon 组件必须按 rpx 渲染（这条单独钉死，它是全站图标的唯一出口）
 *
 * 用法：node scripts/check-rpx-scaling.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const miniappDir = path.join(root, 'miniapp')

/** 这些值来自基础库、单位本来就是 px，不能换成 rpx */
const PX_OK_VARS = ['statusBarHeight', 'navContentHeight', 'capsulePadding']

function walk(dir, ext, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) walk(full, ext, out)
    else if (name.endsWith(ext)) out.push(full)
  }
  return out
}

function lineOf(src, offset) {
  return src.slice(0, offset).split('\n').length
}

/** style="…" 里出现 px 的片段是否由允许的几何变量算出来 */
function isAllowedPx(decl) {
  return PX_OK_VARS.some((v) => new RegExp('\\{\\{[^}]*\\b' + v + '\\b[^}]*\\}\\}\\s*px').test(decl))
}

function checkInlineStyles() {
  const errs = []
  for (const file of walk(miniappDir, '.wxml')) {
    const src = fs.readFileSync(file, 'utf8')
    const rel = path.relative(root, file)
    const noComments = src.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '))
    for (const m of noComments.matchAll(/style="([^"]*)"/g)) {
      // 逐条声明看，避免同一个 style 里一条合法就整体放行
      for (const decl of m[1].split(';')) {
        if (!/[\d}]\s*px\b/.test(decl)) continue
        if (isAllowedPx(decl)) continue
        errs.push(`${rel}:${lineOf(noComments, m.index)}  内联 style 用了 px：${decl.trim()}\n` +
          `      px 不随屏宽缩放，宽屏上会相对变小；改成 rpx。` +
          `确属状态栏/胶囊几何的，请用 ${PX_OK_VARS.join(' / ')} 计算`)
      }
    }
  }
  return errs
}

function checkIconComponent() {
  const p = path.join(miniappDir, 'components/icon/index.wxml')
  const src = fs.readFileSync(p, 'utf8').replace(/<!--[\s\S]*?-->/g, '')
  const errs = []
  if (!/width:\s*\{\{[^}]+\}\}rpx/.test(src) || !/height:\s*\{\{[^}]+\}\}rpx/.test(src)) {
    errs.push('miniapp/components/icon/index.wxml  图标尺寸必须按 rpx 渲染；' +
      '用 px 会让宽屏机型上的图标相对缩水（全站 46 个图标共用这一个出口）')
  }
  const js = fs.readFileSync(path.join(miniappDir, 'components/icon/index.js'), 'utf8')
  if (!/boxRpx:\s*size\s*\*\s*2/.test(js)) {
    errs.push('miniapp/components/icon/index.js  boxRpx 应为 size * 2；' +
      '这样在 375pt 宽的机型上与旧的 px 写法逐像素一致，其它宽度才等比缩放')
  }
  return errs
}

function main() {
  const errs = [...checkInlineStyles(), ...checkIconComponent()]
  if (errs.length) {
    console.error('check-rpx-scaling 发现问题：')
    for (const e of errs) console.error('  ✗ ' + e)
    process.exit(1)
  }
  console.log('check-rpx-scaling OK（内联 style 无越界 px，图标按 rpx 渲染）')
}

main()
