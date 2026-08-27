#!/usr/bin/env node
/** Excel 导入：每行独立事务，禁止外层吞异常后整批 commit 半成品 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const importSvc = path.join(root, 'backend/src/main/java/com/shuyuan/backend/service/MemberRowImportService.java')
const adminSvc = path.join(root, 'backend/src/main/java/com/shuyuan/backend/service/AdminMemberService.java')

const importSrc = fs.readFileSync(importSvc, 'utf8')
const adminSrc = fs.readFileSync(adminSvc, 'utf8')
const errs = []

if (!/Propagation\.REQUIRES_NEW/.test(importSrc)) {
  errs.push('MemberRowImportService 缺少 REQUIRES_NEW')
}
if (!/memberRowImportService\.insertRow/.test(adminSrc)) {
  errs.push('AdminMemberService 未调用 memberRowImportService.insertRow')
}
if (/@Transactional\s*\n\s*public MemberImportResult importExcel/.test(adminSrc)) {
  errs.push('importExcel 仍包在外层 @Transactional 中')
}
if (/private Long insertMemberAccount/.test(adminSrc)) {
  errs.push('AdminMemberService 仍保留 private insertMemberAccount')
}

if (errs.length) {
  console.error('check-member-import-transaction 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log('check-member-import-transaction OK')
