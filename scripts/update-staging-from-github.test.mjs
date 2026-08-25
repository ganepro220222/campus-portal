#!/usr/bin/env node
/** 静态检查 update-staging-from-github.sh 的 bootstrap 顺序与 config 策略。 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sh = fs.readFileSync(path.join(ROOT, 'scripts/update-staging-from-github.sh'), 'utf8')

function idx(re) {
  const m = sh.match(re)
  return m ? m.index : -1
}

const bootstrap = idx(/BOOTSTRAP_PATHS=\(/)
const bootstrapCheckout = sh.indexOf('git checkout "$REF" -- "${BOOTSTRAP_PATHS[@]}"')

assert.ok(bootstrap >= 0, 'missing BOOTSTRAP_PATHS')
assert.ok(bootstrapCheckout > bootstrap, 'bootstrap checkout must follow path list')
const collect = idx(/collect-staging-editor-files\.mjs --repo/)
const backupCall = sh.indexOf('\nbackup_craft_configs\n')
const detectCall = sh.indexOf('\ndetect_craft_configs_changed_by_checkout\n')
const restoreCall = sh.lastIndexOf('\nrestore_craft_configs\n')
const bootstrapBackup = sh.indexOf('backup_code_paths "${BOOTSTRAP_PATHS[@]}"')
assert.ok(backupCall >= 0 && backupCall < bootstrap, 'backup must happen before bootstrap checkout')
assert.ok(bootstrapBackup > backupCall, 'bootstrap code backup before bootstrap checkout')
assert.ok(bootstrapCheckout > bootstrapBackup, 'bootstrap checkout after backup')
assert.ok(collect > bootstrapCheckout, 'collector after bootstrap')
assert.ok(detectCall > collect, 'detect config drift must run after exhibits checkout')
assert.ok(restoreCall > detectCall, 'restore craft config must run after detect')

assert.doesNotMatch(sh, /REPLACE_CONTENT_FROM_GIT/, 'misleading REPLACE_CONTENT_FROM_GIT removed')
assert.doesNotMatch(sh, /拒绝 git checkout 覆盖/, 'must not block on dirty craft config')
assert.doesNotMatch(sh, /verify_craft_configs_unchanged/, 'post-restore verify removed')
assert.match(sh, /assert_exhibits_paths_safe/, 'must reject craft paths in collector list')
assert.match(sh, /trap on_update_err ERR/, 'must rollback on failure')
assert.match(sh, /manifest\.tsv/, 'must track path manifest for rollback')
assert.match(sh, /restore_backend_paths/, 'must restore backend on failure')
assert.match(sh, /deploy_backend_with_health/, 'must wrap docker deploy with health check')
assert.match(sh, /staging-backend-health\.sh/, 'must source backend health helpers')
assert.match(sh, /_deploy_backup\/exhibits_code/, 'code backup must live outside web root')
assert.match(sh, /prune_timestamped_backups/, 'must prune old deploy backups')

const healthSh = fs.readFileSync(path.join(ROOT, 'scripts/staging-backend-health.sh'), 'utf8')
assert.match(healthSh, /rollback_backend_container/, 'must rollback backend container on health fail')
assert.match(healthSh, /verify_backend_health/, 'must verify backend health JSON')
assert.match(healthSh, /wait_backend_health/, 'must retry backend health until ready')
assert.match(healthSh, /BACKEND_HEALTH_TIMEOUT/, 'must support configurable health wait timeout')
assert.match(healthSh, /ps -a -q backend/, 'must list stopped backend containers')
assert.doesNotMatch(healthSh, /ps -q backend/, 'must not use running-only compose ps for backend cid')
assert.match(healthSh, /backend_container_fatal/, 'must fail fast on fatal container states')
assert.match(healthSh, /BACKEND_RESTART_FATAL/, 'must cap restarting wait loops')
assert.match(healthSh, /docker image rm "\$BACKEND_ROLLBACK_TAG"/, 'must drop stale rollback tag before deploy')
assert.match(healthSh, /BACKEND_ROLLBACK_READY=1/, 'must mark rollback tag as deploy-current only')
assert.match(healthSh, /BACKEND_ROLLBACK_READY:-0}" = "1"/, 'must not rollback to stale tag when not ready')
assert.doesNotMatch(sh, /Docker 容器\/image 不会自动恢复/, 'should attempt container rollback')
assert.match(sh, /check-static-deps/, 'must run static deps after update')
assert.doesNotMatch(sh, /docker-compose\.dev\.yml/, 'must not fall back to dev compose')

const ps1 = fs.readFileSync(path.join(ROOT, 'scripts/push-staging-editor.ps1'), 'utf8')
assert.doesNotMatch(ps1, /Inject-SaveApi|Set-Content.*player\.html/, 'push must not mutate player.html on disk')
assert.doesNotMatch(ps1, /'`n<\/head>'/, 'push must not use single-quoted `n replacement')

console.log('update-staging-from-github.test: PASS')
