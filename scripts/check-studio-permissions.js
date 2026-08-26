#!/usr/bin/env node
/**
 * systemd 用户/组与权限脚本一致性门禁（独立于 check-studio-port.js）。
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const errs = []
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

const unit = read('scripts/studio-server.service.example')
const perms = read('scripts/fix-exhibits-permissions.sh')

if (/^Group=shuyuan-exhibits/m.test(unit)) {
  errs.push('studio-server.service.example 不应写死 Group=shuyuan-exhibits（GID 1000 在云主机常已是 ubuntu）')
}
if (!/^User=studio/m.test(unit)) {
  errs.push('studio-server.service.example 缺少 User=studio')
}
if (!/^Group=studio/m.test(unit)) {
  errs.push('studio-server.service.example 应使用 Group=studio 作为固定主组')
}
if (!/groupadd --system studio/.test(unit)) {
  errs.push('studio-server.service.example 应说明 groupadd --system studio')
}
if (!/verify_studio_gate/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 缺少 verify_studio_gate 部署门禁')
}
if (!/as_studio/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 缺少 as_studio 辅助函数')
}

if (errs.length) {
  console.error('check-studio-permissions 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log('check-studio-permissions OK')
