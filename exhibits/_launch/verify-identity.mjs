#!/usr/bin/env node
/**
 * Verify localhost:PORT serves this exhibits root (not another copy).
 * Exit 0 = match; 2 = not our API; 4 = ID mismatch / foreign instance.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readInstanceId } from '../_server/studio-identity.mjs'

const port = Number(process.argv[2] || 8199)
const root = path.resolve(process.argv[3] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'))
const url = `http://127.0.0.1:${port}/studio-api/identity`

let res
try {
  res = await fetch(url, { cache: 'no-store' })
} catch (e) {
  console.error('[ERROR] 无法连接 http://127.0.0.1:' + port + ' — ' + e.message)
  process.exit(4)
}

if (!res.ok) {
  console.error('[ERROR] 端口 ' + port + ' 上的服务不是 3D 工作台（identity HTTP ' + res.status + '）')
  process.exit(4)
}

let remote
try {
  remote = (await res.json()).instanceId
} catch {
  console.error('[ERROR] 端口 ' + port + ' 响应不是有效的工作台 identity JSON')
  process.exit(4)
}

const local = readInstanceId(root)
if (!local || local !== remote) {
  console.error('')
  console.error('[ERROR] 端口 ' + port + ' 已被另一份 exhibits 工作台占用。')
  console.error('  当前目录实例 ID：' + (local || '(尚未启动过本目录服务)'))
  console.error('  占用端口实例 ID：' + (remote || '?'))
  console.error('')
  console.error('请先在本目录运行「停止服务.bat」，或关闭占用端口的旧副本，再重新打开工作台。')
  console.error('也可指定其他端口：打开工作台.bat 8280')
  process.exit(4)
}

process.exit(0)
