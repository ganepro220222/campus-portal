#!/usr/bin/env node
/**
 * WXML 静态检查 —— 拦「会被用户看见」的模板写法错误。
 *
 * 这三条都是真出过的：
 *   - packageD/poster/generate.wxml 里 `保存时将加载\n小程序码`，WXML 文本节点不解析
 *     反斜杠转义，屏幕上直接显示出一个 `\n`；
 *   - packageB/course/player.wxml 首行是 `// packageB/course/player.wxml — …`，
 *     WXML 没有 `//` 注释，整行当正文渲染在页面最顶上；
 *   - <icon name="xxx"> 写了 icons.js 里没有的名字时，图标组件静默渲染成空白。
 *
 * 检查项：
 *   A. 文本节点里的 \n / \t / \r 字面转义（{{ }} 内是 JS 字符串，合法，跳过）
 *   B. 文本节点里以 // 开头或出现 /* 的 JS 式注释
 *   C. 静态 <icon name="..."> 引用了 components/icon/icons.js 未定义的图标
 *   D. 标签闭合不匹配
 *
 * 用法：node scripts/check-wxml.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const miniappDir = path.join(root, 'miniapp')

// 自闭合 / 无子节点的内置组件；<canvas> 有显式闭合标签，不在此列
const VOID_TAGS = new Set(['input', 'image', 'icon', 'import', 'include', 'wxs', 'br'])

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) walk(full, out)
    else if (name.endsWith('.wxml')) out.push(full)
  }
  return out
}

function definedIcons() {
  const src = fs.readFileSync(path.join(miniappDir, 'components/icon/icons.js'), 'utf8')
  return new Set([...src.matchAll(/^\s*['"]([\w-]+)['"]\s*:\s*\{/gm)].map(m => m[1]))
}

/** 掏出所有文本节点（标签之外的内容），并抹掉 {{ }} 里的表达式 */
function textNodes(src) {
  const noComments = src.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ' '))
  const out = []
  let idx = 0
  const re = /<[^>]*>/g
  let m
  while ((m = re.exec(noComments))) {
    if (m.index > idx) out.push({ at: idx, text: noComments.slice(idx, m.index) })
    idx = m.index + m[0].length
  }
  if (idx < noComments.length) out.push({ at: idx, text: noComments.slice(idx) })
  return out.map(n => ({ ...n, text: n.text.replace(/\{\{[\s\S]*?\}\}/g, '') }))
}

function lineOf(src, offset) {
  return src.slice(0, offset).split('\n').length
}

function checkFile(file, icons) {
  const src = fs.readFileSync(file, 'utf8')
  const rel = path.relative(root, file)
  const errs = []

  for (const node of textNodes(src)) {
    const esc = node.text.match(/\\[ntr]/)
    if (esc) {
      errs.push(`${rel}:${lineOf(src, node.at)}  文本节点里的 "${esc[0]}" 会原样显示；` +
        `换行请拆成多个 <text>，或写进 {{ }} 里的 JS 字符串`)
    }
    const cmt = node.text.match(/(^|\n)\s*\/\/|\/\*/)
    if (cmt) {
      errs.push(`${rel}:${lineOf(src, node.at)}  文本节点里有 JS 式注释；WXML 注释是 <!-- -->`)
    }
  }

  const noComments = src.replace(/<!--[\s\S]*?-->/g, '')
  for (const m of noComments.matchAll(/<icon\b[^>]*\bname="([^"{}]+)"/g)) {
    if (!icons.has(m[1])) errs.push(`${rel}  <icon name="${m[1]}"> 在 icons.js 里没有定义，会渲染成空白`)
  }

  const stack = []
  for (const m of noComments.matchAll(/<\/?([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
    const [full, tag, , selfClose] = m
    if (full.startsWith('</')) {
      const top = stack.pop()
      if (top !== tag) {
        errs.push(`${rel}:${lineOf(noComments, m.index)}  </${tag}> 对不上，当前未闭合的是 <${top || '(无)'}>`)
        break
      }
    } else if (selfClose !== '/' && !VOID_TAGS.has(tag)) {
      stack.push(tag)
    }
  }
  if (stack.length) errs.push(`${rel}  标签未闭合：<${stack.join('>, <')}>`)

  return errs
}

/*
 * E. 导航栏方案一致性。
 *
 * 用原生导航栏（页面 json 没写 navigationStyle: custom）时，标题由微信客户端绘制：
 * 字号跟随「微信 → 我 → 设置 → 通用 → 字体大小」缩放，栏高却是固定的，
 * 调大字体后标题下缘会被切掉——页面 WXSS 完全干预不了。自绘 nav-bar 走 rpx，没这问题。
 * 全站已统一到自绘顶栏，这条拦住「新页面忘了写 navigationStyle」。
 *
 * 两个例外，必须留原生导航（原因写在这里，别顺手删）：
 *   - packageC/college/webview：根节点是 <web-view>，属原生组件，层级永远压在自绘顶栏之上；
 *   - packageB/course/player：<video> 同样是原生组件，且要走全屏，固定顶栏会和它抢层级。
 */
const NATIVE_NAV_ALLOWED = new Set([
  'packageC/college/webview',
  'packageB/course/player'
])

function checkNavStyle() {
  const errs = []
  for (const wxml of walk(miniappDir)) {
    const jsonPath = wxml.replace(/\.wxml$/, '.json')
    if (!fs.existsSync(jsonPath)) continue          // 组件没有独立的导航栏配置
    let cfg
    try {
      cfg = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    } catch (e) {
      errs.push(`${path.relative(root, jsonPath)}  不是合法 JSON：${e.message}`)
      continue
    }
    if (cfg.component) continue                     // 自定义组件
    const id = path.relative(miniappDir, wxml).replace(/\.wxml$/, '').split(path.sep).join('/')
    const src = fs.readFileSync(wxml, 'utf8')
    const drawsOwnBar = /<nav-bar\b/.test(src) || /statusBarHeight/.test(src)

    if (cfg.navigationStyle === 'custom') {
      if (!drawsOwnBar) {
        errs.push(`${id}  声明了 navigationStyle: custom，却没画顶栏：` +
          `加 <nav-bar title="…" />，否则整页会顶到状态栏下面`)
      }
    } else if (!NATIVE_NAV_ALLOWED.has(id)) {
      errs.push(`${id}  还在用原生导航栏；标题字号会随微信字体设置放大而被切掉。` +
        `请在 json 里加 "navigationStyle": "custom" 并在 wxml 顶部加 <nav-bar title="…" />；` +
        `确有必要保留原生导航的，写进 check-wxml.js 的 NATIVE_NAV_ALLOWED 并注明原因`)
    }
  }
  return errs
}

/*
 * F. 图标视觉居中机制还在。
 *
 * icons.js 里每个图标可以带一个 c: [dx, dy]，把手写路径的墨迹推回 viewBox 中心；
 * 没有它，首页那排功能入口就会像截图里那样一高一低（「展馆展示」与「课程中心」
 * 的墨迹中心差 2.5 个 viewBox 单位）。这里只做"机制没被删、数值没写飞"的体检——
 * 真正的居中测量要跑真实 SVG 引擎，见 scripts/measure-icon-centering.mjs（不进 preflight）。
 */
function checkIconCentering() {
  const src = fs.readFileSync(path.join(miniappDir, 'components/icon/icons.js'), 'utf8')
  const errs = []
  if (!/const \[dx, dy\] = def\.c \|\| \[0, 0\]/.test(src) ||
      !/viewBox="' \+ \(-dx\) \+ ' ' \+ \(-dy\)/.test(src)) {
    errs.push('components/icon/icons.js  buildSrc 不再应用 c 视觉居中修正；' +
      '删掉它首页功能入口那排图标会一高一低')
  }
  for (const m of src.matchAll(/'([\w-]+)':\s*\{[^}]*?\bc:\s*\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]/g)) {
    const [, name, dx, dy] = m
    // 修正量本质是"把墨迹挪回中心"，超过 viewBox 的 1/8 基本可以断定是写错了
    if (Math.abs(+dx) > 3 || Math.abs(+dy) > 3) {
      errs.push(`components/icon/icons.js  ${name} 的 c: [${dx}, ${dy}] 超出合理范围（±3）；` +
        '跑 node scripts/measure-icon-centering.mjs 重新量')
    }
  }
  return errs
}

function main() {
  const icons = definedIcons()
  const files = walk(miniappDir)
  const errs = files.flatMap(f => checkFile(f, icons)).concat(checkNavStyle()).concat(checkIconCentering())
  if (errs.length) {
    console.error('check-wxml 发现问题：')
    for (const e of errs) console.error('  ✗ ' + e)
    process.exit(1)
  }
  console.log(`check-wxml OK（${files.length} 个 wxml，${icons.size} 个图标）`)
}

main()
