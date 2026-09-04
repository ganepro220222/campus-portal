#!/usr/bin/env node
/**
 * 由 sql/knowledge/*.md 生成 sql/patch-builtin-knowledge.sql。
 *
 * 为什么要生成而不是手写 SQL：分段规则必须和后端 TextChunker 一模一样（500 字一段、
 * 50 字重叠），手写对不齐。对不齐的后果不是报错，而是**后台里编辑一次这篇文档，
 * 分段就会和内置的不一样**——同一篇资料在检索时表现前后不一致，且没有任何报错提示。
 *
 * 内置知识库解决的是「知识库空着时助手什么都答不上来」：现在的检索命中不了任何片段，
 * 助手只会反复说「没有找到相关资料」，而这一次照样扣用户的每日次数。
 *
 * 用法：
 *   node scripts/build-builtin-knowledge.js          # 写入 sql/patch-builtin-knowledge.sql
 *   node scripts/build-builtin-knowledge.js --check  # 只校验已生成文件是否与源文件一致
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const SRC_DIR = path.join(root, 'sql/knowledge')
const OUT_FILE = path.join(root, 'sql/patch-builtin-knowledge.sql')
const UPDATE_OUT = path.join(root, 'sql/patch-update-builtin-knowledge-kb-qa.sql')

/** 标题改过的篇：按旧标题也能更新已入库文档 */
const TITLE_ALIASES = {
  '08-ai-assistant.md': ['使用指南 · 书院助手使用说明']
}

/** 与后端保持一致：TextChunker.CHUNK_SIZE / OVERLAP */
const CHUNK_SIZE = 500
const OVERLAP = 50
/** 与后端保持一致：KnowledgeService.extractKeywords 取前 80 字 */
const KEYWORDS_LEN = 80

/**
 * Java 的 String.trim() 只去掉码位 <= U+0020 的字符，JS 的 trim() 去掉的是整个 Unicode
 * 空白集合（含全角空格 U+3000）。正文里出现一个全角空格，两边切出来的段就会差一个字符，
 * 而且不会有任何报错。这里照 Java 的语义实现。
 */
function javaTrim(s) {
  let start = 0
  let end = s.length
  while (start < end && s.charCodeAt(start) <= 0x20) start++
  while (end > start && s.charCodeAt(end - 1) <= 0x20) end--
  return s.slice(start, end)
}

/** 逐行对应 backend/src/main/java/com/shuyuan/backend/util/TextChunker.java#split */
function split(text) {
  if (text == null || javaTrim(text).length === 0) return []
  const normalized = javaTrim(text.replace(/\r\n/g, '\n'))
  const chunks = []
  let start = 0
  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length)
    chunks.push(javaTrim(normalized.slice(start, end)))
    if (end >= normalized.length) break
    start = Math.max(0, end - OVERLAP)
  }
  return chunks.filter((s) => javaTrim(s).length > 0)
}

/** MySQL 单引号字符串转义。反斜杠必须先转，否则会把后面转义出来的引号又拆开 */
function sqlStr(s) {
  return "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "''") + "'"
}

function loadDocs() {
  if (!fs.existsSync(SRC_DIR)) {
    throw new Error(`找不到源目录 ${SRC_DIR}`)
  }
  const files = fs.readdirSync(SRC_DIR).filter((n) => n.endsWith('.md')).sort()
  if (!files.length) {
    throw new Error(`${SRC_DIR} 下没有 .md 源文件`)
  }
  return files.map((name) => {
    const raw = fs.readFileSync(path.join(SRC_DIR, name), 'utf8').replace(/\r\n/g, '\n')
    /*
     * 标题写在正文首行的「# 」里，文件名保持纯 ASCII。
     * 别把中文标题放进文件名：Java 按 sun.jnu.encoding 读目录项，服务器上是 POSIX
     * locale 时中文文件名会读成乱码，而且不报错——这一条是被测试实测抓出来的。
     */
    const m = raw.match(/^#\s*(.+?)\s*\n/)
    if (!m) throw new Error(`${name} 首行必须是「# 标题」`)
    const title = m[1]
    const content = javaTrim(raw.slice(m[0].length))
    if (!content) throw new Error(`${name} 内容为空`)
    if (title.length > 200) throw new Error(`${name} 标题超过 200 字`)
    const parts = split(content)
    if (!parts.length) throw new Error(`${name} 切分后为空`)
    return { name, title: '使用指南 · ' + title, content, parts }
  })
}

function render(docs) {
  const lines = []
  lines.push('-- 内置知识库：云端书院小程序自身的介绍、功能与使用指南')
  lines.push('--')
  lines.push('-- 本文件由 scripts/build-builtin-knowledge.js 依据 sql/knowledge/*.md 生成，请勿手改；')
  lines.push('-- 要改内容请改 sql/knowledge/ 下的 .md 再重新生成（npm run build:builtin-knowledge）。')
  lines.push('--')
  lines.push('-- 为什么要内置：知识库空着的时候，知识问答检索不到任何片段，只会反复回答')
  lines.push('-- 「没有找到相关资料」。')
  lines.push('-- 校方与学院的文化资料我们无从代劳，但「这个小程序怎么用」是我们自己的交付物，')
  lines.push('-- 本来就该随系统一起给出。')
  lines.push('--')
  lines.push('-- 特性：')
  lines.push('--   * 可重复执行：按标题判重，已存在则跳过，不会产生重复文档')
  lines.push('--   * 后台可管：source_type=manual，与手工录入的资料同一套增删改查，可编辑可停用可删除')
  lines.push('--   * 分段与后端 TextChunker 完全一致（500 字一段、50 字重叠），')
  lines.push('--     后台编辑保存后重新分段的结果与此处相同')
  lines.push('--   * 不属于演示数据：sql/seed-dev-cleanup.sql 不会清除本文件写入的内容')
  lines.push('')
  lines.push('SET NAMES utf8mb4;')
  lines.push('')

  for (const doc of docs) {
    const t = sqlStr(doc.title)
    lines.push(`-- ---------- ${doc.title}（源文件 sql/knowledge/${doc.name}，${doc.parts.length} 段） ----------`)
    lines.push('INSERT INTO `knowledge_doc`')
    lines.push('  (`title`, `file_url`, `source_type`, `content`, `char_count`, `chunk_count`, `status`, `uploaded_by`)')
    lines.push('SELECT')
    lines.push(`  ${t},`)
    lines.push(`  ${sqlStr('builtin://' + doc.title)},`)
    lines.push("  'manual',")
    lines.push(`  ${sqlStr(doc.content)},`)
    lines.push(`  ${doc.content.length},`)
    lines.push(`  ${doc.parts.length},`)
    lines.push("  'ready',")
    lines.push('  NULL')
    lines.push('FROM DUAL')
    lines.push('WHERE NOT EXISTS (')
    lines.push(`  SELECT 1 FROM (SELECT 1 FROM \`knowledge_doc\` WHERE \`title\` = ${t} LIMIT 1) AS x`)
    lines.push(');')
    lines.push('')
    lines.push('SET @doc_id = (SELECT `id` FROM `knowledge_doc`')
    lines.push(`                WHERE \`title\` = ${t} ORDER BY \`id\` LIMIT 1);`)
    lines.push('')
    lines.push('-- 分段只在该文档尚无分段时写入，避免重复执行把段落插两遍')
    lines.push('SET @has_chunk = (SELECT COUNT(*) FROM `knowledge_chunk` WHERE `doc_id` = @doc_id);')
    lines.push('')
    doc.parts.forEach((part, i) => {
      const keywords = part.slice(0, KEYWORDS_LEN)
      lines.push('INSERT INTO `knowledge_chunk` (`doc_id`, `chunk_text`, `chunk_index`, `keywords`, `char_count`)')
      lines.push(`SELECT @doc_id, ${sqlStr(part)}, ${i}, ${sqlStr(keywords)}, ${part.length}`)
      lines.push('FROM DUAL WHERE @doc_id IS NOT NULL AND @has_chunk = 0;')
      lines.push('')
    })
  }

  lines.push('-- 自检：内置文档均应为 ready 且分段数与 chunk_count 一致')
  lines.push('SELECT d.`title`, d.`chunk_count`, COUNT(c.`id`) AS `actual_chunks`, d.`status`')
  lines.push('FROM `knowledge_doc` d')
  lines.push('LEFT JOIN `knowledge_chunk` c ON c.`doc_id` = d.`id`')
  lines.push("WHERE d.`file_url` LIKE 'builtin://%'")
  lines.push('GROUP BY d.`id`, d.`title`, d.`chunk_count`, d.`status`;')
  lines.push('')
  return lines.join('\n')
}

function renderUpdate(docs) {
  const lines = []
  lines.push('-- 将已入库的内置使用指南更新为当前口径；没有的篇会插入（可重复执行）')
  lines.push('-- 由 scripts/build-builtin-knowledge.js 生成，请勿手改。')
  lines.push('-- 按标题匹配已存在行并重建分段；新标题在本文件内插入。')
  lines.push('')
  lines.push('SET NAMES utf8mb4;')
  lines.push('')

  for (const doc of docs) {
    const aliases = TITLE_ALIASES[doc.name] || []
    const titles = [doc.title, ...aliases]
    const titleList = titles.map(sqlStr).join(', ')
    lines.push(`-- ---------- 更新或写入 ${doc.title} ----------`)
    lines.push('SET @doc_id = (SELECT `id` FROM `knowledge_doc`')
    lines.push(`                WHERE \`title\` IN (${titleList}) ORDER BY \`id\` LIMIT 1);`)
    lines.push('INSERT INTO `knowledge_doc`')
    lines.push('  (`title`, `file_url`, `source_type`, `content`, `char_count`, `chunk_count`, `status`, `uploaded_by`)')
    lines.push('SELECT')
    lines.push(`  ${sqlStr(doc.title)},`)
    lines.push(`  ${sqlStr('builtin://' + doc.title)},`)
    lines.push("  'manual',")
    lines.push(`  ${sqlStr(doc.content)},`)
    lines.push(`  ${doc.content.length},`)
    lines.push(`  ${doc.parts.length},`)
    lines.push("  'ready',")
    lines.push('  NULL')
    lines.push('FROM DUAL WHERE @doc_id IS NULL;')
    lines.push('SET @doc_id = (SELECT `id` FROM `knowledge_doc`')
    lines.push(`                WHERE \`title\` IN (${titleList}) ORDER BY \`id\` LIMIT 1);`)
    lines.push('UPDATE `knowledge_doc` SET')
    lines.push(`  \`title\` = ${sqlStr(doc.title)},`)
    lines.push(`  \`file_url\` = ${sqlStr('builtin://' + doc.title)},`)
    lines.push(`  \`content\` = ${sqlStr(doc.content)},`)
    lines.push(`  \`char_count\` = ${doc.content.length},`)
    lines.push(`  \`chunk_count\` = ${doc.parts.length}`)
    lines.push('WHERE `id` = @doc_id;')
    lines.push('DELETE FROM `knowledge_chunk` WHERE `doc_id` = @doc_id;')
    doc.parts.forEach((part, i) => {
      const keywords = part.slice(0, KEYWORDS_LEN)
      lines.push('INSERT INTO `knowledge_chunk` (`doc_id`, `chunk_text`, `chunk_index`, `keywords`, `char_count`)')
      lines.push(`SELECT @doc_id, ${sqlStr(part)}, ${i}, ${sqlStr(keywords)}, ${part.length}`)
      lines.push('FROM DUAL WHERE @doc_id IS NOT NULL;')
    })
    lines.push('')
  }

  lines.push("UPDATE `sys_config` SET `config_value` = '你好，可以基于平台知识库为你解答使用与学习相关的问题。'")
  lines.push("WHERE `config_key` = 'ai_assistant_welcome';")
  lines.push('')
  return lines.join('\n')
}

const docs = loadDocs()
const sql = render(docs)
const updateSql = renderUpdate(docs)

if (process.argv.includes('--check')) {
  if (!fs.existsSync(OUT_FILE)) {
    console.error('build-builtin-knowledge --check 失败：sql/patch-builtin-knowledge.sql 不存在')
    process.exit(1)
  }
  if (fs.readFileSync(OUT_FILE, 'utf8') !== sql) {
    console.error('build-builtin-knowledge --check 失败：')
    console.error('  ✖ sql/patch-builtin-knowledge.sql 与 sql/knowledge/*.md 不同步')
    console.error('    请执行 npm run build:builtin-knowledge 重新生成后再提交')
    process.exit(1)
  }
  if (!fs.existsSync(UPDATE_OUT) || fs.readFileSync(UPDATE_OUT, 'utf8') !== updateSql) {
    console.error('build-builtin-knowledge --check 失败：')
    console.error('  ✖ sql/patch-update-builtin-knowledge-kb-qa.sql 与源文件不同步')
    console.error('    请执行 npm run build:builtin-knowledge 重新生成后再提交')
    process.exit(1)
  }
  console.log(`build-builtin-knowledge --check OK（${docs.length} 篇，${docs.reduce((n, d) => n + d.parts.length, 0)} 段）`)
  process.exit(0)
}

fs.writeFileSync(OUT_FILE, sql)
fs.writeFileSync(UPDATE_OUT, updateSql)
console.log(`已生成 sql/patch-builtin-knowledge.sql：${docs.length} 篇文档，${docs.reduce((n, d) => n + d.parts.length, 0)} 段`)
console.log(`已生成 sql/patch-update-builtin-knowledge-kb-qa.sql`)
for (const d of docs) {
  console.log(`  ${d.title}  ${d.content.length} 字 / ${d.parts.length} 段`)
}
