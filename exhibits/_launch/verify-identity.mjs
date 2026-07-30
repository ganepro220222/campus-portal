#!/usr/bin/env node
/**
 * Verify localhost:PORT serves this exhibits root (not another copy).
 * Exit 0 = rootHash match; 2 = no runtime/deps; 4 = mismatch or foreign service.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { computeRootHash } from '../_server/studio-identity.mjs'

const port = Number(process.argv[2] || 8199)
const root = path.resolve(process.argv[3] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'))
const url = `http://127.0.0.1:${port}/studio-api/identity`

const headers = {}
const pass = process.env.STUDIO_PASS || ''
if (pass) {
  const user = process.env.STUDIO_USER || 'admin'
  headers.Authorization = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')
}

let res
try {
  res = await fetch(url, { cache: 'no-store', headers, signal: AbortSignal.timeout(5000) })
} catch (e) {
  console.error('[ERROR] 无法连接 http://127.0.0.1:' + port + ' — ' + e.message)
  process.exit(4)
}

if (!res.ok) {
  console.error('[ERROR] 端口 ' + port + ' 上的服务不是 3D 工作台（identity HTTP ' + res.status + '）')
  process.exit(4)
}

let body
try {
  body = await res.json()
} catch {
  console.error('[ERROR] 端口 ' + port + ' 响应不是有效的工作台 identity JSON')
  process.exit(4)
}

const remote = body.rootHash || body.instanceId
const local = computeRootHash(root)
if (!remote || local !== remote) {
  console.error('')
  console.error('[ERROR] 端口 ' + port + ' 已被另一份 exhibits 工作台占用。')
  console.error('  当前目录 rootHash：' + local)
  console.error('  占用端口 rootHash：' + (remote || '?'))
  console.error('')
  console.error('请先在本目录运行「停止服务.bat」，或关闭占用端口的旧副本，再重新打开工作台。')
  console.error('也可指定其他端口：打开工作台.bat 8280')
  process.exit(4)
}

process.exit(0)
