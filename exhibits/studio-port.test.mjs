import assert from 'node:assert/strict'
import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import {
  PORT_CANDIDATES, PORT_FILE_REL, portAttempts, isFallbackEnabled,
  isPortUnavailableError, isValidPort, writePortFile, removePortFile,
} from './studio-port.mjs'

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}
async function testAsync(name, fn) {
  try { await fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}

console.log('studio-port tests')

test('候选表跨不同段位，且默认端口排第一', () => {
  assert.equal(PORT_CANDIDATES[0], 8888)
  assert.ok(PORT_CANDIDATES.length >= 3)
  for (const p of PORT_CANDIDATES) assert.ok(isValidPort(p), `${p} 非法`)
  assert.equal(new Set(PORT_CANDIDATES).size, PORT_CANDIDATES.length, '候选端口不该重复')
  // 一整段被系统保留时不能全军覆没：至少跨两个千位段
  const thousands = new Set(PORT_CANDIDATES.map(p => Math.floor(p / 1000)))
  assert.ok(thousands.size >= 3, '候选端口过于集中：' + [...thousands].join(','))
})

/* 这条是服务器安全性的关键：systemd 里写死 PORT=8200，绑不上必须失败，
   悄悄换到别的端口会让 Nginx 反代打到空处，比直接报错难查得多。 */
test('默认不回退：只尝试首选端口', () => {
  assert.deepEqual(portAttempts(8200), [8200])
  assert.deepEqual(portAttempts(8200, { fallback: false }), [8200])
})

test('开启回退后按候选表补齐，首选永远排第一且不重复', () => {
  const a = portAttempts(8200, { fallback: true })
  assert.equal(a[0], 8200)
  assert.equal(new Set(a).size, a.length)
  for (const p of PORT_CANDIDATES) assert.ok(a.includes(p), `候选 ${p} 应在尝试列表里`)
})

test('首选端口非法时回落到候选表首项', () => {
  for (const bad of [0, -1, 70000, NaN, undefined, null, 'x']) {
    assert.equal(portAttempts(bad, { fallback: true })[0], PORT_CANDIDATES[0], `bad=${bad}`)
    assert.deepEqual(portAttempts(bad), [PORT_CANDIDATES[0]], `bad=${bad}`)
  }
})

test('回退开关只认 STUDIO_PORT_FALLBACK=1', () => {
  assert.equal(isFallbackEnabled({}), false)
  assert.equal(isFallbackEnabled({ STUDIO_PORT_FALLBACK: '0' }), false)
  assert.equal(isFallbackEnabled({ STUDIO_PORT_FALLBACK: 'true' }), false)
  assert.equal(isFallbackEnabled({ STUDIO_PORT_FALLBACK: '1' }), true)
})

test('只有端口被占/被拒才换端口，其它错误如实抛出', () => {
  assert.ok(isPortUnavailableError({ code: 'EADDRINUSE' }))
  assert.ok(isPortUnavailableError({ code: 'EACCES' }))
  assert.ok(!isPortUnavailableError({ code: 'EADDRNOTAVAIL' }))
  assert.ok(!isPortUnavailableError({ code: 'ENOTFOUND' }))
  assert.ok(!isPortUnavailableError(null))
  assert.ok(!isPortUnavailableError(undefined))
})

test('端口文件可写可删，目录不存在时自动建', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-port-'))
  try {
    const file = writePortFile(root, 8888)
    assert.equal(file, path.join(root, PORT_FILE_REL))
    assert.equal(fs.readFileSync(file, 'utf8'), '8888')
    removePortFile(root)
    assert.ok(!fs.existsSync(file))
    // 删两次不该抛
    removePortFile(root)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('端口文件写不进去时静默降级，不影响服务启动', () => {
  // 用一个文件当「目录」，mkdir 必然失败
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'studio-port-'))
  try {
    const fakeRoot = path.join(tmp, 'not-a-dir')
    fs.writeFileSync(fakeRoot, 'x')
    assert.equal(writePortFile(fakeRoot, 8888), '')
    removePortFile(fakeRoot)   // 也不该抛
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

/* 真开一个 socket 占住端口，验证「占用 → 回退到下一个」这条路真的走得通，
   而不是只测了纯函数。 */
await testAsync('端口被真实占用时，按尝试列表落到下一个可用端口', async () => {
  const blocker = net.createServer()
  await new Promise((resolve, reject) => {
    blocker.once('error', reject)
    blocker.listen(0, '127.0.0.1', resolve)
  })
  const taken = blocker.address().port
  try {
    const attempts = [taken, 0]           // 0 = 让系统分配，必定可用
    const bound = await new Promise((resolve, reject) => {
      // 每次尝试用新的 server 实例：listen 失败过的实例再 listen 行为不稳
      const tryAt = (i) => {
        const srv = net.createServer()
        const onErr = (e) => {
          srv.removeListener('error', onErr)
          srv.close()
          if (isPortUnavailableError(e) && i + 1 < attempts.length) return tryAt(i + 1)
          reject(e)
        }
        srv.once('error', onErr)
        srv.listen(attempts[i], '127.0.0.1', () => {
          srv.removeListener('error', onErr)
          const p = srv.address().port
          srv.close(() => resolve({ port: p, index: i }))
        })
      }
      tryAt(0)
    })
    assert.equal(bound.index, 1, '应当落到第二个候选')
    assert.notEqual(bound.port, taken)
  } finally {
    await new Promise(r => blocker.close(r))
  }
})

console.log('')
if (fail) {
  console.error(`studio-port: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`studio-port: ${pass} passed`)
