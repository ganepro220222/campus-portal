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
const fb = read('scripts/filebrowser.service.example')
const fbDocker = read('deploy/filebrowser-docker.md')
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
if (!/staging ECS 用 Docker/.test(fb)) {
  errs.push('filebrowser.service.example 须注明 staging 用 Docker（勿误装 systemd unit）')
}
if (!/staging.*Docker|Docker.*staging/i.test(fbDocker)) {
  errs.push('deploy/filebrowser-docker.md 应描述 staging Docker 部署')
}
if (!/proxy_pass http:\/\/127\.0\.0\.1:8081;/.test(fbDocker)) {
  errs.push('deploy/filebrowser-docker.md 应含正确的 /fm/ Nginx proxy_pass')
}
if (!/^User=filebrowser/m.test(fb)) {
  errs.push('filebrowser.service.example 必须以非 root 用户运行 (User=filebrowser)')
}
if (!/^Group=filebrowser/m.test(fb)) {
  errs.push('filebrowser.service.example 应使用 Group=filebrowser')
}
if (!/UMask=0022/m.test(fb)) {
  errs.push('filebrowser.service.example 应设置 UMask=0022')
}
if (!/verify_studio_gate/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 缺少 verify_studio_gate 部署门禁')
}
if (!/verify_studio_process_groups/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 应在附加组变更后验证/重启 studio-server')
}
if (!/as_studio/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 缺少 as_studio 辅助函数')
}
if (!/缺少 runuser 或 sudo/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh as_studio 应在无工具时准确失败')
}
if (!/setfacl -R -d -m "u:\$\{NGX\}:rX"/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh default ACL 应为 rX（新目录需 traverse）')
}
if (/repair_content_other_read/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 不应保留 dead repair_content_other_read')
}
if (!/FILEBROWSER_USER/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 应支持 FILEBROWSER_USER 加入写组')
}
if (!/EXHIBITS_GROUP 不能为 0/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 应拒绝 EXHIBITS_GROUP=0')
}

if (errs.length) {
  console.error('check-studio-permissions 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log('check-studio-permissions OK')
