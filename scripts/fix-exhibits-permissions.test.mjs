#!/usr/bin/env node
/** fix-exhibits-permissions.sh 结构检查 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sh = fs.readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'fix-exhibits-permissions.sh'),
  'utf8',
)

assert.match(sh, /usermod -aG/)
assert.match(sh, /groupadd -g/)
assert.match(sh, /chmod 2775/)
assert.match(sh, /STAGING_INSECURE/)
assert.match(sh, /systemctl reload nginx/)

console.log('fix-exhibits-permissions.test: PASS')
