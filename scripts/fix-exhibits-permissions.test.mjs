#!/usr/bin/env node
/** fix-exhibits-permissions.sh 结构 + Docker 隔离 Linux 集成断言 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dir, '..')
const shPath = path.join(dir, 'fix-exhibits-permissions.sh')
const integrationSh = path.join(dir, 'fix-exhibits-permissions.integration.sh')
const sh = fs.readFileSync(shPath, 'utf8')

assert.doesNotMatch(sh, /STAGING_INSECURE/, 'must not offer world-writable mode')
assert.doesNotMatch(sh, /chgrp -R "\$GID" "\$EX"/, 'must not chgrp entire exhibits tree')
assert.doesNotMatch(sh, /repair_content_other_read/, 'dead repair helper removed')
assert.match(sh, /EXHIBITS_GROUP 不能为 0/)
assert.match(sh, /harden_code_tree/)
assert.match(sh, /apply_content_tree/)
assert.match(sh, /remove_nginx_from_write_group/)
assert.match(sh, /add_user_to_write_group/)
assert.match(sh, /FILEBROWSER_USER/)
assert.match(sh, /gpasswd -d|deluser/)
assert.match(sh, /chmod 2775/)
assert.match(sh, /craft-\*/)
assert.match(sh, /shuyuan-exhibits/)
assert.match(sh, /SET_CONTENT_ACL:-1/)
assert.match(sh, /setfacl -R -d -m "u:\$\{NGX\}:rX"/)
assert.match(sh, /verify_studio_gate/)
assert.match(sh, /verify_studio_process_groups/)
assert.match(sh, /as_studio/)
assert.match(sh, /缺少 runuser 或 sudo/)

function dockerAvailable() {
  const r = spawnSync('docker', ['info'], { encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'] })
  return r.status === 0
}

function runIntegration() {
  if (process.platform === 'win32') {
    console.log('fix-exhibits-permissions.test: integration skip (win32)')
    return
  }
  if (!dockerAvailable()) {
    console.log('fix-exhibits-permissions.test: integration skip (no docker)')
    return
  }
  assert.ok(fs.existsSync(integrationSh), 'missing fix-exhibits-permissions.integration.sh')

  const r = spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '-v',
      `${repoRoot}:/repo:ro`,
      'debian:bookworm-slim',
      'bash',
      '/repo/scripts/fix-exhibits-permissions.integration.sh',
    ],
    { encoding: 'utf8', timeout: 300_000 },
  )
  assert.equal(r.status, 0, r.stderr || r.stdout)
  console.log('fix-exhibits-permissions.test: docker integration OK')
}

runIntegration()
console.log('fix-exhibits-permissions.test: PASS')
