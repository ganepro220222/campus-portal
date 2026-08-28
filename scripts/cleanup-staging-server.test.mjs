#!/usr/bin/env node
/** cleanup-staging-server.sh 静态检查 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sh = fs.readFileSync(path.join(ROOT, 'scripts/cleanup-staging-server.sh'), 'utf8')

assert.match(sh, /dist\.staging.*dist\.old/)
assert.match(sh, /prune_timestamped_backups/)
assert.match(sh, /DEPLOY_BACKUP_KEEP/)
assert.match(sh, /DRY_RUN/)
assert.match(sh, /DOCKER_PRUNE/)
assert.match(sh, /if \[ -f "\$ADMIN_DIST\/index\.html" \]; then/)

console.log('cleanup-staging-server.test: PASS')
