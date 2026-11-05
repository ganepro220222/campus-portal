#!/usr/bin/env node
/**
 * seed-dev-cleanup.sql 必须覆盖 seed-dev.sql 插入的每一张表，
 * 并清掉演示账号测试期间在任何表里留下的行。
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
const purgeMapper = read('backend/src/main/java/com/shuyuan/backend/mapper/MemberPurgeMapper.java')

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
 * 一个人名下的表，以后台「删除师生账号」的 MemberPurgeMapper 为准。
 * 演示账号测试时会往这些表写行（报名、收藏、点赞……），种子没插也得按账号清。
 */
const MEMBER_TABLES = new Set([
  ...[...purgeMapper.matchAll(/FROM\s+(\w+)\s+WHERE\s+member_id\s*=/g)].map((m) => m[1]),
  ...(/DELETE\s+FROM\s+ai_message\b/.test(purgeMapper) ? ['ai_message'] : [])
])
/* 账号三件套在最后单独删 */
for (const t of ['member_account', 'member_profile']) MEMBER_TABLES.delete(t)
if (MEMBER_TABLES.size < 10) {
  errs.push(`从 MemberPurgeMapper 只读出 ${MEMBER_TABLES.size} 张表，解析规则多半失效了`)
}
for (const table of MEMBER_TABLES) {
  const byAccount = table === 'ai_message'
    ? new RegExp('DELETE\\s+FROM\\s+`ai_message`[\\s\\S]*?`member_id`\\s+IN\\s+\\(1,\\s*@demo_teacher\\)')
    : new RegExp('DELETE\\s+FROM\\s+`' + table + '`\\s+WHERE\\s+`member_id`\\s+IN\\s+\\(1,\\s*@demo_teacher\\)')
  if (!byAccount.test(cleanup)) {
    errs.push(`seed-dev-cleanup.sql 没按两个演示账号清 \`${table}\`（应为 member_id IN (1, @demo_teacher)）`)
  }
}

/**
 * 存成数字的计数：演示账号的记录删之前，要先从这些数里减掉，
 * 否则清场后活动名额、点赞 / 收藏数、下载次数还多着演示账号那几个。
 */
const COUNTERS = [
  ['activity', 'enrolled_count', 'enroll'],
  ['news', 'favorite_count', 'favorite'],
  ['news', 'like_count', 'like_record'],
  ['resource', 'download_count', 'download_record']
]
for (const [owner, col, table] of COUNTERS) {
  const fix = cleanup.search(new RegExp('UPDATE\\s+`' + owner + '`[^;]*FROM\\s+`' + table + '`[^;]*SET\\s+t\\.`' + col + '`'))
  const del = cleanup.search(new RegExp('DELETE\\s+FROM\\s+`' + table + '`\\s+WHERE\\s+`member_id`'))
  if (fix < 0) {
    errs.push(`seed-dev-cleanup.sql 删 \`${table}\` 前没把 ${owner}.${col} 减回去`)
  } else if (del >= 0 && fix > del) {
    errs.push(`seed-dev-cleanup.sql 先删了 \`${table}\` 才减 ${owner}.${col}，那时已经数不到了`)
  }
}

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
  if (!inserted.has(table) && !MEMBER_TABLES.has(table)) {
    errs.push(`seed-dev-cleanup.sql 清了 \`${table}\`，但 seed-dev.sql 并没往里插数据——多余或写错表名`)
  }
}

/* 两道护栏必须在：少了任何一道，这个脚本在生产库上跑一次就是灾难 */
if (!/@wipe_demo/.test(cleanup)) {
  errs.push('seed-dev-cleanup.sql 缺少 @wipe_demo 显式确认护栏')
}
if (!/'202600000001'/.test(cleanup) || !/'202600000001'/.test(seed)) {
  errs.push('seed 标记行须同时写在 seed-dev.sql 和 seed-dev-cleanup.sql（member id=1、学号 202600000001）')
}
/* 绑过微信 openid 就换了、昵称本人能改：认演示账号只能靠学号 / 工号 */
const marker = (cleanup.match(/CREATE PROCEDURE _assert_demo_seed[\s\S]*?END\$\$/) || [''])[0]
if (/openid|nickname/.test(marker.replace(/--[^\n]*/g, ''))) {
  errs.push('seed-dev-cleanup.sql 的标记行不能按 openid / 昵称认：测试时绑过微信或改过昵称，清理就会中止')
}
if (/'9000001'/.test(seed) && !/`student_no`\s*=\s*'9000001'/.test(cleanup)) {
  errs.push('seed-dev.sql 有测试教师 9000001，seed-dev-cleanup.sql 要按工号找到他再清')
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
