/**
 * 工作台写接口跨站防护单测
 * 运行：node studio-request-origin.test.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { authorityKey, denyStudioWriteReason, denyStudioWriteContentType } from './studio-request-origin.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

assert.equal(authorityKey('127.0.0.1:8888'), '127.0.0.1:8888')
assert.equal(authorityKey('example.com'), 'example.com')
assert.equal(authorityKey('example.com:443'), 'example.com')
assert.equal(authorityKey('EXAMPLE.COM:80'), 'example.com')
assert.equal(authorityKey('http://127.0.0.1:8888'), '127.0.0.1:8888')
assert.equal(authorityKey('https://api.example.com'), 'api.example.com')

assert.equal(denyStudioWriteReason({ host: '127.0.0.1:8888' }), '', '脚本不带 Origin 应放行')
assert.equal(denyStudioWriteReason({
  host: '127.0.0.1:8888',
  origin: 'http://127.0.0.1:8888',
}), '')
assert.equal(denyStudioWriteReason({
  host: 'api.example.com',
  origin: 'https://api.example.com',
}), '', '反代 HTTPS 与上游 Host 只比主机名')
assert.equal(denyStudioWriteReason({
  host: '127.0.0.1:8888',
  origin: 'http://127.0.0.1:8898',
}), 'origin-mismatch')
assert.equal(denyStudioWriteReason({
  host: '127.0.0.1:8888',
  origin: 'http://127.0.0.1:8898',
  'x-forwarded-host': '127.0.0.1:8898',
}), 'origin-mismatch', '不得靠 X-Forwarded-Host 放行')
assert.equal(denyStudioWriteReason({
  host: '127.0.0.1:8888',
  origin: 'http://127.0.0.1:8888',
  'sec-fetch-site': 'cross-site',
}), 'cross-site')
assert.equal(denyStudioWriteReason({
  host: '127.0.0.1:8888',
  'sec-fetch-site': 'cross-site',
}), 'cross-site')
assert.equal(denyStudioWriteReason({
  host: '127.0.0.1:8888',
  origin: 'null',
}), 'null-origin')
assert.equal(denyStudioWriteReason({
  host: '127.0.0.1:8888',
  origin: 'http://',
}), 'bad-origin')

assert.equal(denyStudioWriteContentType('application/json'), '')
assert.equal(denyStudioWriteContentType('application/json;charset=UTF-8'), '')
assert.equal(denyStudioWriteContentType('text/plain;charset=UTF-8'), 'content-type')
assert.equal(denyStudioWriteContentType(''), 'content-type')

const node = fs.readFileSync(path.join(ROOT, '_server', 'studio-server.mjs'), 'utf8')
assert.match(node, /denyStudioWriteReason/, 'Node 写接口必须走来源校验')
assert.match(node, /denyStudioWriteContentType/, 'Node 写接口必须拒绝非 JSON')
assert.match(node, /from '\.\.\/studio-request-origin\.mjs'/, '必须调用独立模块，不能再手写一遍')

const py = fs.readFileSync(path.join(ROOT, 'serve.py'), 'utf8')
assert.match(py, /deny_studio_write_reason/, 'Python 写接口必须走来源校验')
assert.match(py, /deny_studio_write_content_type/, 'Python 写接口必须拒绝非 JSON')
assert.doesNotMatch(py, /x-forwarded-host|X-Forwarded-Host/, 'Python 不得用转发 Host 放行')

const php = fs.readFileSync(path.join(ROOT, '_server', 'api.php'), 'utf8')
assert.match(php, /studio_deny_write_reason/, 'PHP 写接口必须走来源校验')
assert.match(php, /studio_deny_write_content_type/, 'PHP 写接口必须拒绝非 JSON')
assert.doesNotMatch(php, /HTTP_X_FORWARDED_HOST/, 'PHP 不得用转发 Host 放行')

function canRunPhp() {
  try {
    return execFileSync('php', ['-l', path.join(ROOT, '_server', 'api.php')], { encoding: 'utf8' })
      .includes('No syntax errors')
  } catch {
    return false
  }
}

if (canRunPhp()) {
  const phpCode = `define('STUDIO_API_LIB_ONLY', 1);`
    + `require ${JSON.stringify(path.join(ROOT, '_server', 'api.php'))};`
    + `echo studio_deny_write_reason('http://127.0.0.1:8898','','127.0.0.1:8888');`
  const out = execFileSync('php', ['-r', phpCode], { encoding: 'utf8' }).trim()
  assert.equal(out, 'origin-mismatch', 'PHP 与 Node 对跨端口 Origin 的判定必须一致')
}

console.log('[studio-request-origin.test] PASS')
