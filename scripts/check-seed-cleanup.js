#!/usr/bin/env node
/**
 * seed-dev-cleanup.sql 必须覆盖 seed-dev.sql 插入的每一张表。
 *
 * 这两个文件天然会漂移：往 seed-dev 里加一段演示数据是顺手的事，回头补清理脚本
 * 却总被忘掉。漏一张表的后果不是报错，而是交付前「清场」以后，后台某个列表里
 * 还剩着几条演示数据——甲方老师第一眼看到的就是它。
 *
 * 这里只做「表级」覆盖校验：id 区间对不对得由人核，但少了一整张表机器能拦住。
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

const seed = read('sql/seed-dev.sql')
const cleanup = read('sql/seed-dev-cleanup.sql')

const errs = []

/** seed-dev 里 INSERT 的目标表 */
const inserted = new Set(
  [...seed.matchAll(/INSERT\s+(?:IGNORE\s+)?INTO\s+`(\w+)`/gi)].map((m) => m[1])
)

/** cleanup 里 DELETE 的目标表 */
const deleted = new Set(
  [...cleanup.matchAll(/DELETE\s+FROM\s+`(\w+)`/gi)].map((m) => m[1])
)

/**
 * 刻意不清的表。
 *
 * sys_user / sys_role 的行来自 init.sql，seed-dev 只是 UPDATE 了名称和密码；
 * 删掉就没人能登录后台了。
 */
const INTENTIONALLY_KEPT = new Set(['sys_user', 'sys_role'])

for (const table of inserted) {
  if (INTENTIONALLY_KEPT.has(table)) continue
  if (!deleted.has(table)) {
    errs.push(`seed-dev.sql 往 \`${table}\` 插了演示数据，但 seed-dev-cleanup.sql 没清它`)
  }
}

for (const table of deleted) {
  if (!inserted.has(table)) {
    errs.push(`seed-dev-cleanup.sql 清了 \`${table}\`，但 seed-dev.sql 并没往里插数据——多余或写错表名`)
  }
}

/* 两道护栏必须在：少了任何一道，这个脚本在生产库上跑一次就是灾难 */
if (!/@wipe_demo/.test(cleanup)) {
  errs.push('seed-dev-cleanup.sql 缺少 @wipe_demo 显式确认护栏')
}
if (!/acct:2021001/.test(cleanup)) {
  errs.push('seed-dev-cleanup.sql 缺少 seed 标记行校验（member id=1 / acct:2021001）')
}
if (!/SIGNAL SQLSTATE '45000'/.test(cleanup)) {
  errs.push('seed-dev-cleanup.sql 的护栏必须用 SIGNAL 中止，不能只打印警告')
}

/* 压测清理脚本同样按 id 区间删数据，必须先核对身份 */
const loadtest = read('sql/patch-loadtest-cleanup.sql')
if (!/SIGNAL SQLSTATE '45000'/.test(loadtest)) {
  errs.push('patch-loadtest-cleanup.sql 缺少护栏：它按 member_id 101-150 删数据，'
    + '这个区间在生产库上是真实师生')
}
if (!/\^loadtest_/.test(loadtest)) {
  errs.push('patch-loadtest-cleanup.sql 的护栏应校验 openid 是否为 loadtest_ 开头')
}

if (errs.length) {
  console.error('check-seed-cleanup 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log(`check-seed-cleanup OK（演示数据 ${inserted.size} 张表，清理脚本覆盖 ${deleted.size} 张）`)
