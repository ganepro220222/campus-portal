#!/usr/bin/env node
/** Excel 导入：每行 REQUIRES_NEW；单个新增：insertSingle 与 API 同事务 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const importSvc = path.join(root, 'backend/src/main/java/com/shuyuan/backend/service/MemberRowImportService.java')
const adminSvc = path.join(root, 'backend/src/main/java/com/shuyuan/backend/service/AdminMemberService.java')

const importSrc = fs.readFileSync(importSvc, 'utf8')
const adminSrc = fs.readFileSync(adminSvc, 'utf8')
const errs = []

if (!/insertImportRow/.test(importSrc) || !/Propagation\.REQUIRES_NEW/.test(importSrc)) {
  errs.push('MemberRowImportService 缺少 insertImportRow + REQUIRES_NEW')
}
if (!/insertSingle/.test(importSrc) || !/public Long insertSingle/.test(importSrc)) {
  errs.push('MemberRowImportService 缺少 insertSingle（默认 REQUIRED）')
}
if (!/memberRowImportService\.insertImportRow/.test(adminSrc)) {
  errs.push('importExcel 须调用 insertImportRow')
}
if (!/memberRowImportService\.insertSingle/.test(adminSrc)) {
  errs.push('create 须调用 insertSingle')
}
if (/memberRowImportService\.insertRow/.test(adminSrc)) {
  errs.push('AdminMemberService 仍调用已废弃的 insertRow')
}
if (/@Transactional\s*\n\s*public MemberImportResult importExcel/.test(adminSrc)) {
  errs.push('importExcel 仍包在外层 @Transactional 中')
}

if (errs.length) {
  console.error('check-member-import-transaction 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log('check-member-import-transaction OK')
