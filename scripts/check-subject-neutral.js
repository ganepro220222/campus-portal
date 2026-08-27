#!/usr/bin/env node
/**
 * 拦「新闻」出现在会展示给用户的文字里。
 *
 * 小程序备案主体是贵州云漫科技有限公司，按微信审核口径，内容表述要避开「新闻」类框架
 * （见 sql/README.md 的 patch-subject-neutral-config.sql 一节）。全站对 news 模块的
 * 叫法统一是「动态」：后台菜单是「动态管理」，小程序搜索页 mock 里写的也是「动态」。
 *
 * 但后端返回的标签一度是「新闻」——SearchService.typeLabel() 把它发给小程序搜索结果页，
 * 也就是审核员会点开的那一页。本地跑 mock 永远看不到，因为 mock 里写的是「动态」。
 *
 * check-ui-copy.js 只扫 .vue 的 template 和 .wxml，够不到 Java 字符串，所以单独加这一条。
 *
 * 扫描范围：Java 字符串字面量、admin 的 .vue/.ts、miniapp 的 .js/.wxml/.json。
 * 注释一律剔除——注释里写「为什么不叫新闻」正是应该的。
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const BANNED = '新闻'
const SUGGEST = '动态'

/** 只看会展示出来的文字，扫不到的目录直接跳过 */
const TARGETS = [
  { dir: 'backend/src/main/java', exts: ['.java'] },
  { dir: 'admin/src', exts: ['.vue', '.ts'] },
  { dir: 'miniapp', exts: ['.js', '.wxml', '.json'] }
]

const SKIP_DIRS = new Set(['node_modules', 'dist', 'target', '.git', 'miniprogram_npm'])

/**
 * 面向开发者、不进交付界面的位置，允许保留原词。
 * Swagger 分组名只在接口文档里出现，不会渲染给老师或审核员。
 */
const ALLOW = [
  { file: 'backend/src/main/java/com/shuyuan/backend/controller/admin/AdminNewsController.java',
    reason: 'Swagger @Tag，仅接口文档可见' },
  { file: 'backend/src/main/java/com/shuyuan/backend/controller/api/NewsController.java',
    reason: 'Swagger @Tag，仅接口文档可见' }
]

function* walk(dir, exts) {
  const abs = path.join(root, dir)
  if (!fs.existsSync(abs)) return
  const stack = [abs]
  while (stack.length) {
    const cur = stack.pop()
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const full = path.join(cur, entry.name)
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) stack.push(full)
      } else if (exts.some((e) => entry.name.endsWith(e))) {
        yield full
      }
    }
  }
}

/** 去掉行注释与块注释，只留代码本身 */
function stripComments(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/^\s*\*.*$/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '')
}

const errs = []
for (const { dir, exts } of TARGETS) {
  for (const file of walk(dir, exts)) {
    const rel = path.relative(root, file).split(path.sep).join('/')
    if (ALLOW.some((a) => a.file === rel)) continue
    const lines = stripComments(fs.readFileSync(file, 'utf8')).split('\n')
    lines.forEach((line, i) => {
      if (line.includes(BANNED)) {
        errs.push(`${rel}:${i + 1}  ${line.trim().slice(0, 100)}`)
      }
    })
  }
}

if (errs.length) {
  console.error(`check-subject-neutral 失败：界面文字里出现「${BANNED}」，应统一用「${SUGGEST}」`)
  for (const e of errs) console.error('  ✖ ' + e)
  console.error('')
  console.error('  小程序备案主体非学校，按微信审核口径要避开「新闻」类框架；')
  console.error('  全站对 news 模块的叫法是「动态」（后台菜单即「动态管理」）。')
  console.error('  确属开发者可见、不进交付界面的位置，请加进本脚本的 ALLOW 并写明理由。')
  process.exit(1)
}
console.log(`check-subject-neutral OK（界面文字未出现「${BANNED}」）`)
