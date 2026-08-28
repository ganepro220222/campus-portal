#!/usr/bin/env node
/** 静态检查 slim-staging-server.sh 的归档语义（版本化 run、禁止 mv 前 rm -rf dest）。 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sh = fs.readFileSync(path.join(ROOT, 'scripts/slim-staging-server.sh'), 'utf8')

assert.match(sh, /mktemp -d.*runs\/\$\{RUN_PREFIX\}\.XXXXXX/, 'must allocate unique run dir via mktemp')
assert.match(sh, /RUN_PREFIX=.*\$\$/, 'run prefix must include pid for same-second serial runs')
assert.match(sh, /validate_slim_runs_keep|SLIM_RUNS_KEEP 必须是大于等于 1/, 'must validate SLIM_RUNS_KEEP before moves')
assert.match(sh, /resolve_slim_root|SLIM_ARCHIVE 必须在仓库根内/, 'must validate archive path under repo root')
assert.match(sh, /prune_old_slim_runs/, 'must prune old runs with explicit retention')
assert.doesNotMatch(
  sh,
  /mv_if_exists[\s\S]*?rm -rf "\$dest"/,
  'mv_if_exists must not rm -rf destination before move',
)
assert.match(sh, /只移动、不覆盖历史 run|不覆盖历史 run/, 'header must document non-destructive archive semantics')

console.log('check-slim-staging-server: PASS')
