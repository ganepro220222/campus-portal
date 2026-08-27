#!/usr/bin/env node
/**
 * 内置知识库的几条约定，改错了不会报错、只会安静地失效。
 *
 * 1) 生成物必须与源文件同步（分段规则要和后端 TextChunker 一致，手改 SQL 必然对不齐）。
 * 2) 清场脚本不能连带删除它。seed-dev-cleanup 原来按 `id BETWEEN 1 AND 2` 删知识库，
 *    而内置文档用的是自增 id——在没跑过 seed-dev 的库上正好落到 1、2，
 *    交付前「清一下演示数据」就会把随系统一起给的使用指南也清掉。
 * 3) 内置内容会被 AI 原样引用给用户看，所以「新闻」这类按审核口径要回避的词
 *    在这里同样不能出现（check-subject-neutral 扫不到 .md/.sql）。
 * 4) 必须写入 content 列：后台编辑时靠它回填正文，缺了会显示成空白。
 *
 * 用法：node scripts/check-builtin-knowledge.js
 */
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

const errs = []

// ---------- 1) 生成物与源文件同步 ----------
const gen = spawnSync(process.execPath, [path.join(__dirname, 'build-builtin-knowledge.js'), '--check'], {
  encoding: 'utf8'
})
if (gen.status !== 0) {
  errs.push((gen.stdout + gen.stderr).trim() || 'build-builtin-knowledge --check 失败')
}

const patch = read('sql/patch-builtin-knowledge.sql')
const cleanupRaw = read('sql/seed-dev-cleanup.sql')
/* 先剥掉 -- 注释：解释「为什么不能按区间删」的那段注释里本来就会出现 BETWEEN 和 builtin://，
   连注释一起扫会把说明文字当成违规，这类自伤式误报之前已经吃过一次亏 */
const cleanup = cleanupRaw.replace(/--[^\n]*/g, '')

/** 取出针对某张表的 DELETE 语句本身（到分号为止），避免跨语句误匹配到下一条的 BETWEEN */
function deleteStatements(sql, table) {
  const re = new RegExp('DELETE\\s+FROM\\s+`' + table + '`[^;]*;', 'gi')
  return sql.match(re) || []
}

// ---------- 2) 清场脚本不能按 id 区间删知识库 ----------
for (const table of ['knowledge_doc', 'knowledge_chunk']) {
  const stmts = deleteStatements(cleanup, table)
  if (!stmts.length) {
    errs.push(`seed-dev-cleanup.sql 没有清理 \`${table}\` 的语句`)
    continue
  }
  if (stmts.some((s) => /BETWEEN/i.test(s))) {
    errs.push(`seed-dev-cleanup.sql 又按 id 区间删 \`${table}\` —— 会连带删掉内置使用指南，请按 file_url 定位`)
  }
}
if (!/manual:\/\/平台功能说明/.test(cleanup)) {
  errs.push('seed-dev-cleanup.sql 未按演示文档的 file_url 定位，无法与内置知识库区分')
}
if (/builtin:\/\//.test(cleanup)) {
  errs.push('seed-dev-cleanup.sql 的语句里出现了 builtin:// —— 内置知识库不属于演示数据，不该被清场')
}

// ---------- 3) 内置内容不得出现需回避的表述 ----------
const srcDir = path.join(root, 'sql/knowledge')
const sources = fs.existsSync(srcDir)
  ? fs.readdirSync(srcDir).filter((n) => n.endsWith('.md'))
  : []
if (!sources.length) {
  errs.push('sql/knowledge 下没有源文件')
}
for (const name of sources) {
  const text = read(path.join('sql/knowledge', name))
  if (text.includes('新闻')) {
    errs.push(`sql/knowledge/${name} 出现「新闻」——AI 会把这段原样念给用户和审核员，请改用「动态」`)
  }
  if (!/^#\s+\S/m.test(text)) {
    errs.push(`sql/knowledge/${name} 首行不是「# 标题」`)
  }
}
if (patch.includes('新闻')) {
  errs.push('sql/patch-builtin-knowledge.sql 出现「新闻」，请改源文件后重新生成')
}

// ---------- 4) 落库字段完整 ----------
if (!/INSERT INTO `knowledge_doc`[\s\S]{0,200}`content`/.test(patch)) {
  errs.push('patch-builtin-knowledge.sql 未写入 content 列，后台编辑时正文会回填成空白')
}
// 正文本身有近千字，`status` 和取值之间隔得很远，不能用「相隔多少字符」来找
if (!/^\s*'ready',\s*$/m.test(patch)) {
  errs.push('内置文档必须是 ready，否则 retrieve 只取 ready、根本检索不到')
}
if (!/WHERE NOT EXISTS/.test(patch)) {
  errs.push('patch-builtin-knowledge.sql 缺少幂等判重，重复执行会插出重复文档')
}
if (!/source_type[\s\S]{0,200}'manual'/.test(patch)) {
  errs.push("内置文档的 source_type 应为 manual，否则后台按手工录入的那套增删改查管不了它")
}

if (errs.length) {
  console.error('check-builtin-knowledge 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log(`check-builtin-knowledge OK（${sources.length} 篇源文件）`)
