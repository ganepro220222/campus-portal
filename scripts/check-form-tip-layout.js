#!/usr/bin/env node
/**
 * 表单字段说明文字必须独占一行。
 *
 * 真出过的问题：「动态管理 → 正文」下面两条提示挤在同一行，还一高一低错开 6px。
 * 原因是两层的：
 *   1) Element Plus 的 .el-form-item__content 是 flex 容器
 *      （display:flex; flex-wrap:wrap; align-items:center），提示作为 flex item
 *      默认与兄弟节点并排，而不是像普通块级元素那样往下堆；
 *   2) FieldHint 渲染的是 <p>，浏览器默认给它 margin:1em 0。.form-tip 若只覆盖
 *      margin-top，<p> 还留着 1em 下外边距，与同排 <div> 的外边距盒高度不同，
 *      在 align-items:center 下中线错开——就是那 6px。
 *
 * 所以锁两件事：
 *   * .form-tip 必须有 flex:0 0 100% 且 margin 写全（不能只写 margin-top）
 *   * 同一个 el-form-item 里不许出现两条以上提示（全站约定是一个字段一条）
 *
 * 用法：node scripts/check-form-tip-layout.js
 */
const fs = require('node:fs')
const path = require('node:path')

const root = process.env.FORM_TIP_CHECK_ROOT || path.resolve(__dirname, '..')
const errs = []

// ---------- 1) 全局样式 ----------
const globalScss = path.join(root, 'admin/src/styles/global.scss')
const scss = fs.readFileSync(globalScss, 'utf8')
const block = scss.match(/\.form-tip\s*\{[^}]*\}/)
if (!block) {
  errs.push('global.scss 里找不到 .form-tip 规则')
} else {
  const rule = block[0]
  if (!/flex:\s*0\s+0\s+100%/.test(rule)) {
    errs.push('.form-tip 缺少 flex: 0 0 100% —— 在 el-form-item 的 flex 布局里会与兄弟节点并排')
  }
  if (/margin-top\s*:/.test(rule) && !/margin\s*:/.test(rule)) {
    errs.push('.form-tip 只写了 margin-top —— <p> 残留的默认下外边距会让同排提示错位，请写全 margin')
  }
}

// ---------- 2) 一个字段一条提示 ----------
function* vueFiles(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* vueFiles(full)
    else if (entry.name.endsWith('.vue')) yield full
  }
}

for (const file of vueFiles(path.join(root, 'admin/src'))) {
  const src = fs.readFileSync(file, 'utf8')
  for (const m of src.matchAll(/<el-form-item\b[\s\S]*?<\/el-form-item>/g)) {
    const tips = m[0].match(/class="form-tip"|<FieldHint\b/g) || []
    if (tips.length >= 2) {
      const line = src.slice(0, m.index).split('\n').length
      const label = (m[0].match(/label="([^"]*)"/) || [])[1] || '?'
      errs.push(
        `${path.relative(root, file)}:${line}（label=${label}）同一字段挂了 ${tips.length} 条提示，` +
        '请合并成一条 FieldHint'
      )
    }
  }
}

if (errs.length) {
  console.error('check-form-tip-layout 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log('check-form-tip-layout OK')
