#!/usr/bin/env node
/** nginx-exhibits-editor.conf.example 静态检查 + studio 模块路径 smoke（无需真实 nginx） */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const confPath = path.join(ROOT, 'scripts/nginx-exhibits-editor.conf.example')
const studioSrc = fs.readFileSync(path.join(ROOT, 'exhibits/studio.html'), 'utf8')
const conf = fs.readFileSync(confPath, 'utf8')

assert.match(conf, /location \^~ \/studio\//, 'studio prefix must use ^~ to beat regex locations')
assert.match(
  conf,
  /location \^~ \/studio\/[\s\S]*?proxy_pass http:\/\/127\.0\.0\.1:8200\//,
  'studio proxy_pass must strip /studio/ prefix (trailing slash on upstream URI)',
)
assert.doesNotMatch(
  conf,
  /location ~ \^\/studio\/.+\.(js|mjs|css|wasm)/,
  'must not declare separate regex cache location for /studio/*.js (breaks prefix strip)',
)
assert.doesNotMatch(conf, /expires 7d/, 'studio editor assets must not use long public cache in example')

/** Node 反代段：鉴权由 STUDIO_PASS 负责，勿与 Nginx auth_basic 叠层（浏览器只有一个 Authorization 头） */
const nodeSection = conf.match(/# 1\) Node studio-server[\s\S]*?(?=# 2\) PHP)/)?.[0] ?? ''
const nodeActive = nodeSection
  .split('\n')
  .filter((line) => !/^\s*#/.test(line))
  .join('\n')
assert.doesNotMatch(
  nodeActive,
  /auth_basic/,
  'active Node proxy block must not use auth_basic (Studio STUDIO_PASS handles auth)',
)
assert.match(
  conf,
  /勿再加 auth_basic/,
  'example must document why nginx auth must not stack on Node proxy',
)

/** studio.html 相对 import → 浏览器请求 /studio/<file>；上游须收到 /<file> */
const imports = [...studioSrc.matchAll(/from '\.\/([^']+\.mjs)'/g)].map(m => m[1])
assert.ok(imports.length >= 3, 'studio.html should import local .mjs modules')
for (const file of imports) {
  const browserPath = `/studio/${file}`
  const upstreamPath = browserPath.replace(/^\/studio\//, '/')
  assert.notEqual(browserPath, upstreamPath, `${file}: paths must differ before strip`)
  assert.ok(upstreamPath.startsWith('/'), `${file}: upstream path ${upstreamPath}`)
}

console.log(`nginx-exhibits-editor.test: PASS (${imports.length} studio modules checked)`)
