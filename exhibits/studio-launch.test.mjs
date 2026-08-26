import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import net from 'node:net'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { computeRootHash } from './_server/studio-identity.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const LAUNCH = path.join(ROOT, '_launch')

const tests = []
function test(name, fn) { tests.push({ name, fn }) }

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer()
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address()
      s.close(() => resolve(port))
    })
    s.on('error', reject)
  })
}

function waitForPort(port, ms = 8000) {
  const t0 = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const s = net.createConnection({ port, host: '127.0.0.1' })
      s.once('connect', () => { s.destroy(); resolve() })
      s.once('error', () => {
        s.destroy()
        if (Date.now() - t0 > ms) reject(new Error('port timeout'))
        else setTimeout(tick, 80)
      })
    }
    tick()
  })
}

async function withStudioServer(fn) {
  const port = await freePort()
  const child = spawn(process.execPath, [path.join(ROOT, '_server', 'studio-server.mjs')], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(port),
      STUDIO_PASS: 'local-test',
      STUDIO_USER: 'admin',
    },
    stdio: 'pipe',
  })
  try {
    await waitForPort(port)
    await fn(port, child)
  } finally {
    child.kill()
  }
}

async function fetchHead(url) {
  const res = await fetch(url, { headers: studioAuthHeaders() })
  return { status: res.status, cc: res.headers.get('cache-control') || '' }
}

function studioAuthHeaders() {
  const token = Buffer.from('admin:local-test').toString('base64')
  return { Authorization: `Basic ${token}` }
}

console.log('studio-launch tests')

test('verify-identity.mjs exits 0 on matching rootHash', async () => {
  await withStudioServer(async (port) => {
    const r = spawnSync(process.execPath, [path.join(LAUNCH, 'verify-identity.mjs'), String(port), ROOT], {
      cwd: ROOT, encoding: 'utf8',
    })
    assert.equal(r.status, 0, r.stderr || r.stdout)
  })
})

test('verify-identity.mjs exits 4 on rootHash mismatch', async () => {
  await withStudioServer(async (port) => {
    const other = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-other-'))
    try {
      const r = spawnSync(process.execPath, [path.join(LAUNCH, 'verify-identity.mjs'), String(port), other], {
        cwd: ROOT, encoding: 'utf8',
      })
      assert.equal(r.status, 4, r.stderr || r.stdout)
    } finally {
      fs.rmSync(other, { recursive: true, force: true })
    }
  })
})

test('verify-identity.mjs works with STUDIO_PASS when credentials provided', async () => {
  const port = await freePort()
  const child = spawn(process.execPath, [path.join(ROOT, '_server', 'studio-server.mjs')], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), STUDIO_PASS: 'secret' },
    stdio: 'pipe',
  })
  try {
    await waitForPort(port)
    const good = spawnSync(process.execPath, [path.join(LAUNCH, 'verify-identity.mjs'), String(port), ROOT], {
      cwd: ROOT, encoding: 'utf8', env: { ...process.env, STUDIO_USER: 'admin', STUDIO_PASS: 'secret' },
    })
    assert.equal(good.status, 0, good.stderr || good.stdout)
  } finally {
    child.kill()
  }
})

test('verify-identity.py exits 0 on matching rootHash', async () => {
  const py = spawnSync('python', ['--version'], { encoding: 'utf8' })
  if (py.status !== 0) return 'skip'
  await withStudioServer(async (port) => {
    const r = spawnSync('python', [path.join(LAUNCH, 'verify-identity.py'), String(port), ROOT], {
      cwd: ROOT, encoding: 'utf8',
    })
    assert.equal(r.status, 0, r.stderr || r.stdout)
  })
})

test('Node server: config.json no-store, leader-geom.js cacheable', async () => {
  await withStudioServer(async (port) => {
    const cfg = await fetchHead(`http://127.0.0.1:${port}/craft-001/config.json`)
    const js = await fetchHead(`http://127.0.0.1:${port}/leader-geom.js`)
    assert.match(cfg.cc, /no-store/)
    assert.equal(js.cc, '', 'static JS should not get Cache-Control: no-store')
  })
})

test('Node server create API works end-to-end', async () => {
  const EX = 'craft-99886'
  fs.rmSync(path.join(ROOT, EX), { recursive: true, force: true })
  try {
    await withStudioServer(async (port) => {
      const create = await fetch(`http://127.0.0.1:${port}/studio-api/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...studioAuthHeaders() },
        body: JSON.stringify({ dir: '99886', title: 'Node smoke', subtitle: '' }),
      })
      const created = await create.json()
      assert.equal(create.status, 200, JSON.stringify(created))
      assert.equal(created.ok, true)
      assert.ok(fs.existsSync(path.join(ROOT, EX, 'config.json')))
      const list = await (await fetch(`http://127.0.0.1:${port}/studio-api/list`, { headers: studioAuthHeaders() })).json()
      const row = list.exhibits.find(e => e.dir === EX)
      assert.equal(row?.hasPano, false)
      const assets = path.join(ROOT, EX, 'assets')
      fs.mkdirSync(assets, { recursive: true })
      fs.writeFileSync(path.join(assets, 'panorama.jpg'), 'x')
      const list2 = await (await fetch(`http://127.0.0.1:${port}/studio-api/list`, { headers: studioAuthHeaders() })).json()
      assert.equal(list2.exhibits.find(e => e.dir === EX)?.hasPano, true)
    })
  } finally {
    fs.rmSync(path.join(ROOT, EX), { recursive: true, force: true })
  }
})

test('Node identity endpoint allows localhost without STUDIO_PASS', async () => {
  const port = await freePort()
  const child = spawn(process.execPath, [path.join(ROOT, '_server', 'studio-server.mjs')], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), STUDIO_PASS: 'secret' },
    stdio: 'pipe',
  })
  try {
    await waitForPort(port)
    const res = await fetch(`http://127.0.0.1:${port}/studio-api/identity`)
    assert.equal(res.status, 200)
    const body = await res.json()
    assert.equal(body.rootHash, computeRootHash(ROOT))
  } finally {
    child.kill()
  }
})

test('ensure-server.bat returns 4 when another exhibits root owns the port', async () => {
  if (process.platform !== 'win32') return 'skip'
  const port = await freePort()
  const child = spawn(process.execPath, [path.join(ROOT, '_server', 'studio-server.mjs')], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), STUDIO_PASS: 'secret' },
    stdio: 'pipe',
  })
  const copyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-copy-'))
  fs.cpSync(path.join(ROOT, '_launch'), path.join(copyRoot, '_launch'), { recursive: true })
  try {
    await waitForPort(port)
    const r = spawnSync('cmd.exe', ['/c', 'call _launch\\ensure-server.bat', String(port)], {
      cwd: copyRoot, encoding: 'utf8',
    })
    assert.equal(r.status, 4, r.stdout + r.stderr)
  } finally {
    child.kill()
    fs.rmSync(copyRoot, { recursive: true, force: true })
  }
})

test('runtime.bat verify_identity returns 4 without swallowing exit code', async () => {
  if (process.platform !== 'win32') return 'skip'
  await withStudioServer(async (port) => {
    const other = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-other-'))
    try {
      const r = spawnSync('cmd.exe', ['/c', 'call _launch\\runtime.bat verify_identity', String(port), other], {
        cwd: ROOT, encoding: 'utf8',
      })
      assert.equal(r.status, 4, r.stdout + r.stderr)
    } finally {
      fs.rmSync(other, { recursive: true, force: true })
    }
  })
})

test('new-exhibit.bat uses CRLF for Windows cmd parsing', () => {
  const bat = fs.readFileSync(path.join(LAUNCH, 'new-exhibit.bat'), 'utf8')
  assert.ok(bat.includes('\r\n'), 'new-exhibit.bat must use CRLF')
  assert.doesNotMatch(bat, /EnableDelayedExpansion/i, 'must not expand ! in forwarded args')
})

test('all exhibits launcher bat files use CRLF', () => {
  if (process.platform !== 'win32') return 'skip'
  const bats = fs.readdirSync(ROOT).filter(n => n.endsWith('.bat'))
    .concat(fs.readdirSync(LAUNCH).filter(n => n.endsWith('.bat')).map(n => `_launch/${n}`))
  for (const rel of bats) {
    const raw = fs.readFileSync(path.join(ROOT, rel))
    const lfOnly = raw.filter(b => b === 0x0a).length - raw.filter((b, i, a) => b === 0x0a && a[i - 1] === 0x0d).length
    assert.ok(raw.includes('\r\n'), `${rel} must use CRLF`)
    assert.equal(lfOnly, 0, `${rel} must not use LF-only line endings`)
  }
})

test('new-exhibit.bat runs under cmd without batch line corruption', () => {
  if (process.platform !== 'win32') return 'skip'
  const r = spawnSync('cmd.exe', ['/c', 'call _launch\\new-exhibit.bat 99996'], {
    cwd: ROOT,
    encoding: 'utf8',
    input: '\r\n',
    timeout: 15_000,
  })
  const out = (r.stdout || '') + (r.stderr || '')
  assert.doesNotMatch(out, /'OOT"'|'evel'|'RROR\]'/)
  assert.match(out, /展品名称不能为空|\[ERROR\]/)
})

test('new-exhibit.bat preserves exclamation marks in CLI args', () => {
  if (process.platform !== 'win32') return 'skip'
  const ex = 'craft-99894'
  const exPath = path.join(ROOT, ex)
  if (fs.existsSync(exPath)) fs.rmSync(exPath, { recursive: true, force: true })
  const title = '时代之声!'
  const subtitle = 'A!UNDEFINED!B'
  try {
    const r = spawnSync(
      'cmd.exe',
      ['/d', '/s', '/c', `call _launch\\new-exhibit.bat 99894 ${title} ${subtitle}`],
      { cwd: ROOT, encoding: 'utf8', input: '\r\n', timeout: 30_000 },
    )
    const out = (r.stdout || '') + (r.stderr || '')
    assert.match(out, /\[OK\]|已创建/, out)

    const cfgPath = path.join(exPath, 'config.json')
    assert.ok(fs.existsSync(cfgPath), 'exhibit should be created')
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
    assert.equal(cfg.i18n.zh.title, title)
    assert.equal(cfg.i18n.zh.subtitle, subtitle)
  } finally {
    if (fs.existsSync(exPath)) fs.rmSync(exPath, { recursive: true, force: true })
  }
})

test('launcher bat files avoid parenthetical if blocks', () => {
  const bats = fs.readdirSync(ROOT).filter(n => n.endsWith('.bat'))
    .concat(fs.readdirSync(LAUNCH).filter(n => n.endsWith('.bat')).map(n => `_launch/${n}`))
  for (const rel of bats) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim()
      if (!/^if /i.test(t)) continue
      if (/^echo /i.test(t)) continue
      assert.doesNotMatch(t, /\(\s*$/, `${rel}: parenthetical if breaks paths with (2)`)
    }
  }
})

test('start-bg.bat enables fallback only without PORT_EXPLICIT', () => {
  const bat = fs.readFileSync(path.join(LAUNCH, 'start-bg.bat'), 'utf8')
  assert.match(bat, /if defined PORT_EXPLICIT goto port_no_fallback/i)
  assert.match(bat, /set "STUDIO_PORT_FALLBACK=1"/i)
})

test('open launcher uses explicit CLI port without overwriting studio-port.txt', () => {
  for (const rel of ['打开工作台.bat', '_launch/open.bat']) {
    const bat = fs.readFileSync(path.join(ROOT, rel), 'utf8')
    assert.match(bat, /:url_port_explicit/i, `${rel} must branch URL port on explicit arg`)
    assert.doesNotMatch(bat, /if not "%~1"=="" set "PORT=%~1"/i,
      `${rel} must not overwrite PORT after reading studio-port.txt`)
  }
})

test('ensure-server.bat passes PORT_EXPLICIT to start-server', () => {
  const bat = fs.readFileSync(path.join(LAUNCH, 'ensure-server.bat'), 'utf8')
  assert.match(bat, /set PORT_EXPLICIT=%PORT_EXPLICIT%/i)
})

test('ensure-server.bat uses shorter wait when PORT_EXPLICIT', () => {
  const bat = fs.readFileSync(path.join(LAUNCH, 'ensure-server.bat'), 'utf8')
  assert.match(bat, /if defined PORT_EXPLICIT goto wait_port_explicit/i)
  assert.match(bat, /:wait_port_explicit[\s\S]*wait_port_file 10/i)
  assert.match(bat, /wait_port_file 45/i)
})

test('start-bg.bat enables local insecure mode when STUDIO_PASS unset', () => {
  const bat = fs.readFileSync(path.join(LAUNCH, 'start-bg.bat'), 'utf8')
  assert.match(bat, /if not defined STUDIO_PASS set "STUDIO_ALLOW_INSECURE=1"/i)
})

test('staging deploy scripts do not enable STUDIO_ALLOW_INSECURE', () => {
  const apply = fs.readFileSync(path.join(ROOT, '..', 'scripts', 'apply-staging-editor.sh'), 'utf8')
  assert.doesNotMatch(apply, /STUDIO_ALLOW_INSECURE/)
})

test('serve.py binds loopback in insecure local mode', () => {
  const py = fs.readFileSync(path.join(ROOT, 'serve.py'), 'utf8')
  assert.match(py, /bind_host = '127\.0\.0\.1' if \(not PASS and os\.environ\.get\('STUDIO_ALLOW_INSECURE'\) == '1'\)/)
})

test('studio-server binds loopback in insecure local mode', () => {
  const node = fs.readFileSync(path.join(ROOT, '_server', 'studio-server.mjs'), 'utf8')
  assert.match(node, /STUDIO_ALLOW_INSECURE === '1'\) \? '127\.0\.0\.1'/)
})

test('ensure-server.bat avoids trailing-backslash cd paths', () => {
  const bat = fs.readFileSync(path.join(LAUNCH, 'ensure-server.bat'), 'utf8')
  assert.doesNotMatch(bat, /cd \/d \\"%ROOT%\\"/, 'trailing backslash breaks quoted cd on Windows')
  assert.doesNotMatch(bat, /\.\.\\"/, 'path ending in ..\\ before quote breaks cmd')
  assert.doesNotMatch(bat, /\\"%%~fI/, 'escaped full path breaks cmd when path has spaces')
  assert.match(bat, /\/D "%%~fI"/, 'must use start /D for exhibits root')
})

test('open launcher calls ensure-server without default PORT when no CLI arg', () => {
  for (const rel of ['打开工作台.bat', '_launch/open.bat']) {
    const bat = fs.readFileSync(path.join(ROOT, rel), 'utf8')
    assert.match(bat, /if not "%~1"=="" goto ensure_with_port/i,
      `${rel} must branch on empty arg without passing default PORT`)
    assert.match(bat, /goto ensure_done[\s\S]*:ensure_with_port[\s\S]*call "_launch\\ensure-server\.bat" "%~1"/i,
      `${rel} must pass explicit port only in ensure_with_port branch`)
    assert.doesNotMatch(bat, /call "_launch\\ensure-server\.bat"\s+%PORT%/i,
      `${rel} must not pass default PORT to ensure-server (breaks studio-port.txt reuse)`)
  }
})

test('subscribe_outbox retention index defined in init.sql', () => {
  const sql = fs.readFileSync(path.join(ROOT, '..', 'sql', 'init.sql'), 'utf8')
  assert.match(sql, /idx_status_created.*status.*create_time/i)
})

test('deleteByStatusBefore orders by create_time for stable retention batches', () => {
  const java = fs.readFileSync(
    path.join(ROOT, '..', 'backend', 'src', 'main', 'java', 'com', 'shuyuan', 'backend', 'mapper', 'SubscribeOutboxMapper.java'),
    'utf8',
  )
  assert.match(java, /ORDER BY create_time/)
})

test('open launcher only opens browser on ensure-server RC 0', () => {
  for (const rel of ['打开工作台.bat', '_launch/open.bat']) {
    const bat = fs.readFileSync(path.join(ROOT, rel), 'utf8')
    assert.match(bat, /if not "%RC%"=="0"/i, `${rel} must gate browser on RC==0`)
    assert.match(bat, /err_unknown|server check failed|启动检查失败/i, `${rel} must handle unknown RC`)
  }
})

test('internal launchers do not pause; top-level entry bats do', () => {
  for (const rel of ['_launch/install.bat', '_launch/new-exhibit.bat', '_launch/stop.bat']) {
    const bat = fs.readFileSync(path.join(ROOT, rel), 'utf8')
    assert.doesNotMatch(bat, /\bpause\b/i, `${rel} must not pause (caller owns UX)`)
  }
  for (const rel of ['安装便携环境.bat', '新建展品.bat', '停止服务.bat', '打开工作台.bat']) {
    const bat = fs.readFileSync(path.join(ROOT, rel), 'utf8')
    assert.match(bat, /\bpause\b/i, `${rel} must pause once for double-click users`)
  }
})

test('install.bat runs under cmd when cwd path contains parentheses', () => {
  if (process.platform !== 'win32') return 'skip'
  const tmp = path.join(os.tmpdir(), `exhibits-paren-${Date.now()}(2)`)
  fs.rmSync(tmp, { recursive: true, force: true })
  fs.mkdirSync(path.join(tmp, '_launch'), { recursive: true })
  fs.copyFileSync(path.join(LAUNCH, 'install.bat'), path.join(tmp, '_launch', 'install.bat'))
  fs.copyFileSync(path.join(LAUNCH, 'install-python.ps1'), path.join(tmp, '_launch', 'install-python.ps1'))
  try {
    const r = spawnSync('cmd.exe', ['/c', 'call _launch\\install.bat'], {
      cwd: tmp,
      encoding: 'utf8',
      timeout: 120_000,
    })
    const out = (r.stdout || '') + (r.stderr || '')
    assert.doesNotMatch(out, /此时不应有|unexpected at this time/i, out)
    assert.notEqual(r.status, 255, `cmd parse error: ${out}`)
    assert.ok(fs.existsSync(path.join(tmp, '_runtime', 'python', 'python.exe')), out)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

let pass = 0, fail = 0, skip = 0
for (const t of tests) {
  try {
    const r = await t.fn()
    if (r === 'skip') { skip++; console.log(' skip', t.name); continue }
    pass++; console.log('  ok', t.name)
  } catch (e) {
    fail++; console.error(' FAIL', t.name, e.message)
  }
}
console.log('')
if (fail) {
  console.error(`studio-launch: ${pass} passed, ${fail} failed, ${skip} skipped`)
  process.exit(1)
}
console.log(`studio-launch: ${pass} passed${skip ? `, ${skip} skipped` : ''}`)
