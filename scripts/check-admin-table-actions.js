#!/usr/bin/env node
/**
 * 后台表格的两条约定。
 *
 * 1) 弹窗里的表格不许拖列宽。
 *    Element Plus 的列默认 resizable，只要表格开了 border 就自带拖拽手柄——
 *    全项目 23 张表带 border，却没有一处写过 resizable，也就是说这个行为
 *    从来没人主动选择过，是跟着 border 白送的。
 *
 *    在列表页它有用（长姓名、长标题拖宽一列能救急），但在编辑弹窗里是纯负担：
 *    弹窗宽度写死，列宽已经调好，列里装的是上传块和输入框，不存在「内容被截断
 *    需要加宽」的需求。实测把「图片」列往右拖 260px，操作列会被顶出容器 186px，
 *    虽然表体内层的 el-scrollbar__wrap 还能滚过去（按钮没真丢），
 *    但那个滚动条是 hidden-default，不悬停根本不显形——
 *    用户看到的就是「删除」被生生裁掉一半，且没有任何提示说可以横向滚。
 *
 * 2) 表格里的删除按钮统一写「删除」，不写单字「删」。
 *    全项目 10 处已经是「删除」，只有三个编辑弹窗写了「删」。实测「删除」按钮
 *    只有 34px 宽，70px 的操作列（去掉内边距还剩 ~53px）放得下，不需要为文案加宽。
 *
 * 用法：node scripts/check-admin-table-actions.js
 */
const fs = require('node:fs')
const path = require('node:path')

const root = process.env.ADMIN_TABLE_CHECK_ROOT || path.resolve(__dirname, '..')
const viewsDir = path.join(root, 'admin/src/views')

const errs = []

/** 递归收集 .vue */
function collect(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) collect(full, out)
    else if (entry.name.endsWith('.vue')) out.push(full)
  }
  return out
}

const files = collect(viewsDir)
const isDialog = (file) => /Dialog\.vue$/.test(path.basename(file))

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  const rel = path.relative(root, file)

  // ---------- 1) 弹窗表格：每一列都要关掉拖动 ----------
  if (isDialog(file) && /<el-table\b/.test(src)) {
    const cols = src.match(/<el-table-column\b[^>]*>/g) || []
    const loose = cols.filter((c) => !/:resizable="false"/.test(c))
    if (loose.length) {
      errs.push(
        `${rel}：弹窗表格有 ${loose.length} 列没写 :resizable="false" —— ` +
        '拖宽任意一列都会把操作列顶出可视区，而滚动条默认不显形'
      )
    }
  }

  // ---------- 2) 不许出现单字「删」按钮 ----------
  if (/>\s*删\s*<\/el-button>/.test(src)) {
    errs.push(`${rel}：表格里出现单字「删」按钮 —— 全项目统一写「删除」`)
  }

  // ---------- 3) 列表页的操作列要 fixed，别被横向滚动带走 ----------
  if (!isDialog(file)) {
    const actionCols = src.match(/<el-table-column\b[^>]*label="操作"[^>]*>/g) || []
    const unfixed = actionCols.filter((c) => !/\bfixed\b/.test(c))
    if (unfixed.length) {
      errs.push(`${rel}：列表页的「操作」列缺少 fixed —— 列多时会被横向滚动带出视野`)
    }
  }
}

if (errs.length) {
  console.error('check-admin-table-actions 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log('check-admin-table-actions OK')
