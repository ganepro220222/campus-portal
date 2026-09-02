#!/usr/bin/env node
/**
 * 校验 SQL 初始化清单与 Docker compose / 文档接线一致。
 * 用法：node scripts/check-sql-init.js
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

const manifestPath = 'sql/sql-init-manifest.json'
const manifest = JSON.parse(read(manifestPath))
const errs = []

function mustExist(rel) {
  const full = path.join(root, rel)
  if (!fs.existsSync(full)) {
    errs.push(`缺少文件：${rel}`)
  }
}

for (const list of [manifest.devFreshDb, manifest.prodFreshDb, manifest.requiredAllEnv]) {
  for (const rel of list) {
    mustExist(rel)
  }
}

for (const name of fs.readdirSync(path.join(root, 'sql')).filter((item) => item.endsWith('.sql'))) {
  const rel = `sql/${name}`
  if (/^\s*USE\s+/im.test(read(rel))) {
    errs.push(`${rel} 不得写死 USE；请由执行命令显式选择目标数据库`)
  }
}

const compose = read('docker-compose.dev.yml')
for (const mount of manifest.dockerComposeDevMounts) {
  if (!compose.includes(mount)) {
    errs.push(`docker-compose.dev.yml 缺少挂载：${mount}`)
  }
}

const seedIdx = compose.indexOf('02-seed-dev.sql')
const builtinIdx = compose.indexOf('03-builtin-knowledge.sql')
if (seedIdx === -1 || builtinIdx === -1 || seedIdx > builtinIdx) {
  errs.push('docker-compose.dev.yml 中 seed-dev 必须排在 builtin-knowledge 之前')
}

const devTail = manifest.devFreshDb.slice(-1)[0]
const prodTail = manifest.prodFreshDb.slice(-1)[0]
if (devTail !== 'sql/patch-builtin-knowledge.sql' || prodTail !== 'sql/patch-builtin-knowledge.sql') {
  errs.push('manifest 必须以 patch-builtin-knowledge.sql 作为 fresh DB 最后一步')
}

const readme = read('sql/README.md')
const rootReadme = read('README.md')
const deployManual = read('docs/运维/部署手册_V1.0.md')

for (const rel of manifest.requiredAllEnv) {
  const base = path.basename(rel)
  if (!readme.includes(base)) {
    errs.push(`sql/README.md 未提及 ${base}`)
  }
  if (!deployManual.includes(base)) {
    errs.push(`部署手册未提及 ${base}`)
  }
}

const upgradePatches = manifest.upgradePatches || []
for (const rel of upgradePatches) {
  mustExist(rel)
  const base = path.basename(rel)
  if (!readme.includes(base)) {
    errs.push(`sql/README.md 未提及升级补丁 ${base}`)
  }
  if (!deployManual.includes(base)) {
    errs.push(`部署手册未提及升级补丁 ${base}`)
  }
  const checklistPath = path.join(root, 'docs/运维/上线分工checklist_V1.0.md')
  if (fs.existsSync(checklistPath)) {
    const checklist = fs.readFileSync(checklistPath, 'utf8')
    if (!checklist.includes(base)) {
      errs.push(`上线 checklist 未提及升级补丁 ${base}`)
    }
  }
}

if (!rootReadme.includes('patch-builtin-knowledge.sql')) {
  errs.push('根 README Fresh DB 说明未包含 patch-builtin-knowledge.sql')
}

if (!readme.includes('03-builtin-knowledge.sql') && !readme.includes('03-patch-builtin-knowledge')) {
  if (!readme.includes('patch-builtin-knowledge.sql')) {
    errs.push('sql/README.md Docker 自动初始化未列出 patch-builtin-knowledge.sql')
  }
}

if (errs.length) {
  console.error('check-sql-init 失败：')
  errs.forEach((e) => console.error('  - ' + e))
  process.exit(1)
}

console.log('check-sql-init OK')
