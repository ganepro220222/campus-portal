#!/usr/bin/env node
/**
 * 护栏：横排卡片里的裱框缩略图不能被卡片拉高。
 *
 * 由来：课程列表卡片是横排 flex，默认 align-items: stretch。
 * 缩略图只给里层 .mount-art 定了高，外层 .mount 没定高，
 * 标题一折成两行、卡片变高，木框跟着拉长，照片底下露出一截木头。
 * 活动报名页同样。首页、动态页的卡片写了 align-items: center，所以没事。
 *
 * 规则：父元素是横排 flex 时，.mount 自己要有 height 或 align-self，
 * 或者父元素的 align-items 不是 stretch。只认写死的 class，{{ }} 里的不算。
 *
 * 用法：node scripts/check-mount-stretch.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const miniappDir = path.join(root, 'miniapp')
const VOID_TAGS = new Set(['input', 'image', 'icon', 'import', 'include', 'wxs', 'br'])
const NOT_STRETCH = /^(flex-start|flex-end|center|baseline|start|end|self-start|self-end)$/

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (e.name !== 'node_modules' && e.name !== 'miniprogram_npm') walk(path.join(dir, e.name), out)
    } else if (e.name.endsWith('.wxml')) out.push(path.join(dir, e.name))
  }
  return out
}

/** 只取写死的 class，去掉 {{ }} */
function staticClasses(attr) {
  return (attr || '').replace(/\{\{[\s\S]*?\}\}/g, ' ').split(/\s+/).filter(Boolean)
}

/** 每个 .mount 元素和它父元素的 class */
function mountsWithParent(src) {
  src = src.replace(/<!--[\s\S]*?-->/g, '')
  const stack = [{ classes: [] }]
  const out = []
  const re = /<(\/?)([\w-]+)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g
  let m
  while ((m = re.exec(src))) {
    const [, close, tag, attrs, selfClose] = m
    if (close) {
      while (stack.length > 1 && stack[stack.length - 1].tag !== tag) stack.pop()
      if (stack.length > 1) stack.pop()
      continue
    }
    const cm = attrs.match(/\sclass\s*=\s*("([^"]*)"|'([^']*)')/)
    const node = { tag, classes: staticClasses(cm ? (cm[2] ?? cm[3]) : '') }
    if (node.classes.includes('mount')) out.push({ mount: node.classes, parent: stack[stack.length - 1].classes })
    if (!selfClose && !VOID_TAGS.has(tag)) stack.push(node)
  }
  return out
}

/** 单类选择器（含逗号并列）→ 声明；后写的覆盖先写的 */
function classDecls(css) {
  const map = new Map()
  css = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const r of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decls = {}
    for (const d of r[2].split(';')) {
      const i = d.indexOf(':')
      if (i > 0) decls[d.slice(0, i).trim()] = d.slice(i + 1).trim()
    }
    for (const sel of r[1].split(',').map((s) => s.trim())) {
      const one = sel.match(/^\.([\w-]+)$/)
      if (one) map.set(one[1], Object.assign(map.get(one[1]) || {}, decls))
    }
  }
  return map
}

function merged(map, classes) {
  return classes.reduce((acc, c) => Object.assign(acc, map.get(c) || {}), {})
}

function main() {
  const appCss = fs.readFileSync(path.join(miniappDir, 'app.wxss'), 'utf8')
  const errs = []
  let checked = 0
  for (const file of walk(miniappDir)) {
    const wxss = file.replace(/\.wxml$/, '.wxss')
    const map = classDecls(appCss + '\n' + (fs.existsSync(wxss) ? fs.readFileSync(wxss, 'utf8') : ''))
    for (const { mount, parent } of mountsWithParent(fs.readFileSync(file, 'utf8'))) {
      const p = merged(map, parent)
      if (p.display !== 'flex' || /column/.test(p['flex-direction'] || '')) continue
      checked++
      const self = merged(map, mount)
      if (self.height || NOT_STRETCH.test(self['align-self'] || '')) continue
      if (NOT_STRETCH.test(p['align-items'] || '')) continue
      const rel = path.relative(root, file)
      errs.push(`${rel}：.${parent.join('.')} 里的 .${mount.join('.')} 会被卡片拉高，标题折行时照片底下露木框。` +
        `\n    给缩略图加 align-self: flex-start，或给 .mount 定高`)
    }
  }
  if (errs.length) {
    console.error('✗ 裱框缩略图会被拉高：\n  ' + errs.join('\n  '))
    process.exit(1)
  }
  console.log(`✓ 横排卡片里的裱框缩略图都不会被拉高（${checked} 处）`)
}

main()
