#!/usr/bin/env node
/**
 * 路由组件的 <template> 必须只有一个根节点。
 *
 * AdminLayout 里 router-view 外面包着 `<transition name="fade-slide" mode="out-in">`，
 * 而 `<transition>` 只能处理单个根元素。路由组件写成多根（Vue 3 允许的 fragment）时：
 *
 *   - vue-tsc 通过，vite build 通过，页面首次打开也完全正常
 *   - 但从这个页面**跳走**时，transition 的 leave→enter 静默地做不完，正文直接空掉，
 *     必须刷新才能恢复，而且控制台**一条错误都不报**
 *
 * 真出过：师生账号页把 el-drawer 和删除确认框写到了 .page-card 的 </div> 外面，
 * 于是只要点进过这一页，再点侧边栏任何一栏都是白屏。
 *
 * 只查真正挂在路由上的组件——views 下的子组件（编辑弹窗之类）不受 transition 约束。
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const routerFile = 'admin/src/router/index.ts'
const errs = []

const routerSrc = fs.readFileSync(path.join(root, routerFile), 'utf8')

/** 从路由表里取出所有 component: () => import('@/views/xxx.vue') */
const routeComponents = [...routerSrc.matchAll(/component:\s*\(\)\s*=>\s*import\('@\/([^']+\.vue)'\)/g)]
  .map((m) => 'admin/src/' + m[1])

if (routeComponents.length === 0) {
  errs.push(`${routerFile} 里没解析到任何路由组件——正则可能已经和写法对不上了`)
}

/** HTML 里不需要闭合标签的元素 */
const VOID_TAGS = new Set([
  'br', 'hr', 'img', 'input', 'meta', 'link', 'source',
  'area', 'base', 'col', 'embed', 'param', 'track', 'wbr'
])

/** 抠出最外层 <template> 的内容（SFC 的顶层 template 一定顶格） */
function topLevelTemplate(src) {
  const m = src.match(/^<template>\r?\n([\s\S]*?)\r?\n<\/template>/m)
  return m ? m[1] : null
}

/** 数出 template 里的顶层节点名 */
function rootTags(tpl) {
  const text = tpl.replace(/<!--[\s\S]*?-->/g, '')
  const tagRe = /<(\/?)([A-Za-z][-A-Za-z0-9_.]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g
  let depth = 0
  const roots = []
  let m
  while ((m = tagRe.exec(text)) !== null) {
    const [, closing, tag, , selfClosing] = m
    if (closing) {
      depth--
      continue
    }
    if (depth === 0) {
      roots.push(tag)
    }
    if (!selfClosing && !VOID_TAGS.has(tag.toLowerCase())) {
      depth++
    }
  }
  return roots
}

for (const rel of routeComponents) {
  const abs = path.join(root, rel)
  if (!fs.existsSync(abs)) {
    errs.push(`路由指向的组件不存在：${rel}`)
    continue
  }
  const tpl = topLevelTemplate(fs.readFileSync(abs, 'utf8'))
  if (tpl === null) {
    errs.push(`${rel} 没解析到顶层 <template>`)
    continue
  }
  const roots = rootTags(tpl)
  if (roots.length !== 1) {
    errs.push(`${rel} 的 template 有 ${roots.length} 个根节点（${roots.join('、')}）`)
  }
}

if (errs.length) {
  console.error('check-view-single-root 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  console.error('')
  console.error('  router-view 外面包着 <transition mode="out-in">，只能处理单根组件。')
  console.error('  多根时页面首次打开正常，但从这一页跳走会白屏且控制台无报错。')
  console.error('  请把弹窗 / 抽屉等放进那唯一的根元素里面。')
  process.exit(1)
}
console.log(`check-view-single-root OK（${routeComponents.length} 个路由组件均为单根）`)
