#!/usr/bin/env node
/** fix-exhibits-permissions.sh 结构 + 可选 Linux 集成断言 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const shPath = path.join(dir, 'fix-exhibits-permissions.sh')
const sh = fs.readFileSync(shPath, 'utf8')

assert.doesNotMatch(sh, /STAGING_INSECURE/, 'must not offer world-writable mode')
assert.doesNotMatch(sh, /chgrp -R "\$GID" "\$EX"/, 'must not chgrp entire exhibits tree')
assert.match(sh, /harden_code_tree/)
assert.match(sh, /apply_content_tree/)
assert.match(sh, /remove_nginx_from_write_group/)
assert.match(sh, /gpasswd -d|deluser/)
assert.match(sh, /chmod 2775/)
assert.match(sh, /craft-\*/)
assert.match(sh, /shuyuan-exhibits/)
assert.match(sh, /echo "1000"/)

function bashAvailable() {
  const r = spawnSync('bash', ['--version'], { encoding: 'utf8' })
  return r.status === 0
}

function runIntegration() {
  if (process.platform === 'win32') {
    console.log('fix-exhibits-permissions.test: integration skip (win32)')
    return
  }
  if (!bashAvailable()) {
    console.log('fix-exhibits-permissions.test: integration skip (no bash)')
    return
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-perms-'))
  const ex = path.join(tmp, 'exhibits')
  fs.mkdirSync(path.join(ex, '_server'), { recursive: true })
  fs.writeFileSync(path.join(ex, '_server', 'studio-server.mjs'), '// code\n')
  fs.mkdirSync(path.join(ex, 'craft-001'), { recursive: true })
  fs.writeFileSync(path.join(ex, 'craft-001', 'config.json'), '{}\n')
  fs.writeFileSync(path.join(ex, 'studio.html'), '<html></html>\n')

  const gid = process.getgid?.() ?? 1000
  const r = spawnSync('bash', [shPath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      EXHIBITS_ROOT: ex,
      EXHIBITS_GROUP: String(gid),
      NGINX_USER: 'nobody',
      STUDIO_USER: 'nobody',
    },
  })
  assert.equal(r.status, 0, r.stderr || r.stdout)

  const codeStat = fs.statSync(path.join(ex, '_server', 'studio-server.mjs'))
  assert.equal(codeStat.mode & 0o777, 0o644, '_server file must be 644')

  const contentStat = fs.statSync(path.join(ex, 'craft-001', 'config.json'))
  assert.equal(contentStat.mode & 0o777, 0o664, 'craft content file must be 664')

  const codeDirStat = fs.statSync(path.join(ex, '_server'))
  assert.equal(codeDirStat.mode & 0o777, 0o755, '_server dir must be 755')

  fs.rmSync(tmp, { recursive: true, force: true })
  console.log('fix-exhibits-permissions.test: integration OK')
}

runIntegration()
console.log('fix-exhibits-permissions.test: PASS')
