#!/usr/bin/env node
/**
 * 工作台端口一致性门禁。
 *
 * 上一轮踩过的坑：nginx 示例反代 127.0.0.1:8200，而 studio-server 的默认端口是 8888，
 * 仓库里又没有任何地方为服务器设置 PORT=8200——线上能跑纯粹是因为有人手写了
 * 一份不在仓库里的 systemd unit。换台机器照着 README 起服务就是 502。
 *
 * 现在把三件事锁在一起：
 *   1) systemd unit 里的 PORT == nginx 示例里 proxy_pass 的端口
 *   2) Node 与 Python 两份实现的候选端口表完全一致
 *   3) 服务端不许出现 STUDIO_PORT_FALLBACK（端口必须确定，绑不上要响亮失败）
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const errs = []
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

/* ---------- 1) systemd unit ↔ nginx ---------- */
const unitRel = 'scripts/studio-server.service.example'
const nginxRel = 'scripts/nginx-exhibits-editor.conf.example'
const unit = read(unitRel)
const nginx = read(nginxRel)

const unitPort = unit.match(/^Environment=PORT=(\d+)\s*$/m)?.[1]
if (!unitPort) {
  errs.push(`${unitRel} 缺少 Environment=PORT=<端口>`)
}

const proxyPorts = [...nginx.matchAll(/proxy_pass\s+http:\/\/127\.0\.0\.1:(\d+)/g)].map(m => m[1])
if (proxyPorts.length === 0) {
  errs.push(`${nginxRel} 里没找到 proxy_pass http://127.0.0.1:<端口>`)
}
for (const p of new Set(proxyPorts)) {
  if (unitPort && p !== unitPort) {
    errs.push(`端口不一致：${nginxRel} 反代 ${p}，但 ${unitRel} 里是 PORT=${unitPort}`)
  }
}

/* ---------- 2) 两份实现的候选端口表 ---------- */
const mjs = read('exhibits/studio-port.mjs')
const py = read('exhibits/serve.py')

const mjsList = mjs.match(/export const PORT_CANDIDATES = Object\.freeze\(\[([^\]]+)\]\)/)?.[1]
const pyList = py.match(/^PORT_CANDIDATES = \(([^)]+)\)/m)?.[1]
if (!mjsList) errs.push('exhibits/studio-port.mjs 里没抠到 PORT_CANDIDATES')
if (!pyList) errs.push('exhibits/serve.py 里没抠到 PORT_CANDIDATES')
const nums = (s) => (s || '').split(',').map(x => x.trim()).filter(Boolean).join(',')
if (mjsList && pyList && nums(mjsList) !== nums(pyList)) {
  errs.push(`候选端口表不一致：\n  mjs = ${nums(mjsList)}\n  py  = ${nums(pyList)}`)
}

/* 端口文件路径也必须一致，否则启动器读的是另一个文件 */
const mjsFile = mjs.match(/export const PORT_FILE_REL = '([^']+)'/)?.[1]
const pyFile = py.match(/^PORT_FILE_REL = '([^']+)'/m)?.[1]
if (mjsFile !== pyFile) {
  errs.push(`端口文件路径不一致：mjs=${mjsFile} py=${pyFile}`)
}

/* ---------- 3) 服务端不许开回退 ---------- */
// 只看真正生效的 Environment= 行；注释里解释「为什么服务器不设它」是允许的
if (/^Environment=STUDIO_PORT_FALLBACK/m.test(unit)) {
  errs.push(`${unitRel} 不该设置 STUDIO_PORT_FALLBACK：服务器端口必须确定，` +
    '悄悄换端口会让 Nginx 反代到空处')
}

/* ---------- 4) 启动器：无显式端口时开回退，否则端口必须确定 ---------- */
const startBg = read('exhibits/_launch/start-bg.bat')
const ensureBat = read('exhibits/_launch/ensure-server.bat')
if (!/if defined PORT_EXPLICIT goto port_no_fallback/i.test(startBg)) {
  errs.push('exhibits/_launch/start-bg.bat 须在设置 STUDIO_PORT_FALLBACK 前检查 PORT_EXPLICIT')
}
if (!/set "STUDIO_PORT_FALLBACK=1"/i.test(startBg)) {
  errs.push('exhibits/_launch/start-bg.bat 在无 PORT_EXPLICIT 时应设置 STUDIO_PORT_FALLBACK=1')
}
if (!/PORT_EXPLICIT/i.test(ensureBat)) {
  errs.push('exhibits/_launch/ensure-server.bat 须向 start-server 传递 PORT_EXPLICIT')
}

/* ---------- 5) 服务窗口 bat 禁止 0x85 ----------
 * ExhibitsServer 是新建 cmd，默认 GBK。UTF-8 中文「仅/允/必」的字节里带 0x85，
 * cmd 会把它当换行，后半截 rem 就变成「不是内部或外部命令」。
 */
for (const rel of ['exhibits/_launch/start-bg.bat', 'exhibits/_launch/start-server.bat']) {
  const buf = fs.readFileSync(path.join(root, rel))
  if (buf.includes(0x85)) {
    errs.push(`${rel} 含字节 0x85：cmd 会当成换行。服务窗口里的 rem 请只用 ASCII`)
  }
}

if (errs.length) {
  console.error('check-studio-port 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log(`check-studio-port OK（服务端 ${unitPort}，候选表 ${nums(mjsList)}，端口文件 ${mjsFile}）`)
