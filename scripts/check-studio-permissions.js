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
const helper = read('scripts/chown-exhibit-content-dir.sh')
const sudoers = read('scripts/studio-exhibits-chown.sudoers.example')

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
if (/^NoNewPrivileges=true/m.test(unit)) {
  errs.push('studio-server.service.example 不能 NoNewPrivileges=true（否则无法 sudo 移交新建展品属主）')
}
if (!/^NoNewPrivileges=false/m.test(unit)) {
  errs.push('studio-server.service.example 应写 NoNewPrivileges=false 并说明原因')
}
if (!/FILEBROWSER_UID=1000/.test(unit)) {
  errs.push('studio-server.service.example 应设置 FILEBROWSER_UID（与 File Browser 内容属主一致）')
}
if (!/EXHIBITS_CHOWN_HELPER=\/usr\/local\/sbin\/chown-exhibit-content-dir/.test(unit)) {
  errs.push('studio-server.service.example 应指向固定 chown helper')
}
if (!/^ProtectHome=yes/m.test(unit)) {
  errs.push('studio-server.service.example 在允许 sudo helper 时应 ProtectHome=yes')
}
if (!/chown "\$UID_NUM:\$GID_NUM" "\$TARGET"/.test(helper) || /chown\s+-R/.test(helper)) {
  errs.push('chown-exhibit-content-dir.sh 只能 chown 单个内容目录 inode，禁止 chown -R')
}
if (!/只允许 craft-\* 或 共享背景/.test(helper)) {
  errs.push('chown-exhibit-content-dir.sh 必须限制目录名为 craft-* / 共享背景')
}
if (!/NOPASSWD: \/usr\/local\/sbin\/chown-exhibit-content-dir/.test(sudoers)) {
  errs.push('studio-exhibits-chown.sudoers.example 只能放行固定 helper')
}
if (/NOPASSWD:\s+ALL/.test(sudoers)) {
  errs.push('studio-exhibits-chown.sudoers.example 不得 NOPASSWD: ALL')
}
if (!/staging ECS 用 Docker/.test(fb)) {
  errs.push('filebrowser.service.example 须注明 staging 用 Docker（勿误装 systemd unit）')
}
if (!/staging.*Docker|Docker.*staging/i.test(fbDocker)) {
  errs.push('deploy/filebrowser-docker.md 应描述 staging Docker 部署')
}
if (!/chown-exhibit-content-dir|Studio 新建/.test(fbDocker)) {
  errs.push('deploy/filebrowser-docker.md 应说明 Studio 新建展品后 File Browser 如何删除')
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
if (!/as_studio_available/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 缺少 as_studio_available 前置检查')
}
if (/if ! as_studio[\s\S]{0,160}rc=\$\?/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 不得在 if ! as_studio 后用 rc=$? 取退出码')
}
if (/setfacl[^\n]*\|\| true/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh setfacl 不得 || true（ACL 失败会假 OK）')
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
if (!/setfacl -d -m "u:\$\{NGX\}:rX" "\$EX"/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 应给 exhibits 根设 default ACL（删后重传才不会 403）')
}
if (/repair_content_other_read/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 不应保留 dead repair_content_other_read')
}
if (!/FILEBROWSER_USER/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 应支持 FILEBROWSER_USER 加入写组')
}
if (!/FILEBROWSER_UID/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 应支持 Docker File Browser 的 FILEBROWSER_UID')
}
if (!/verify_content_delete_gate/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 应验证可删除 craft-* / 共享背景且不能删代码')
}
if (!/install_content_handoff_helper/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 应安装 Studio→File Browser 属主移交 helper')
}
if (!/verify_studio_handoff_gate/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 应验证 Studio 新建目录可被 File Browser 删除')
}
if (!/chmod 3775 "\$EX"/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 应将 exhibits 根设为 3775（组写+sticky，才能删展品夹）')
}
if (/chmod 755 "\$EX"/.test(perms)) {
  errs.push('fix-exhibits-permissions.sh 不得把 exhibits 根锁成 755（否则删不掉 craft-*）')
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
