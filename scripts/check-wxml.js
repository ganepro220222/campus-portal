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

function main() {
  const icons = definedIcons()
  const files = walk(miniappDir)
  const errs = files.flatMap(f => checkFile(f, icons))
  if (errs.length) {
    console.error('check-wxml 发现问题：')
    for (const e of errs) console.error('  ✗ ' + e)
    process.exit(1)
  }
  console.log(`check-wxml OK（${files.length} 个 wxml，${icons.size} 个图标）`)
}

main()
