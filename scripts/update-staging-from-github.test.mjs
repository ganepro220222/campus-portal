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

const bootstrap = idx(/git checkout "\$REF" -- \\\s*\n\s*scripts/)
const buildViewer = idx(/exhibits\/build-viewer\.mjs/)
const collect = idx(/collect-staging-editor-files\.mjs --repo/)
const backupCall = sh.indexOf('\nbackup_craft_configs\n')
const verifyCall = sh.lastIndexOf('verify_craft_configs_unchanged')

assert.ok(bootstrap >= 0, 'missing scripts bootstrap checkout')
assert.ok(buildViewer > bootstrap, 'build-viewer.mjs must be bootstrapped')
assert.ok(collect > buildViewer, 'collector must run after build-viewer bootstrap')
assert.ok(backupCall >= 0 && backupCall < bootstrap, 'backup must happen before bootstrap checkout')
assert.ok(verifyCall > collect, 'config verify must run after exhibits checkout')

assert.doesNotMatch(sh, /REPLACE_CONTENT_FROM_GIT/, 'misleading REPLACE_CONTENT_FROM_GIT removed')
assert.doesNotMatch(sh, /拒绝 git checkout 覆盖/, 'must not block on dirty craft config')
assert.match(sh, /checkout_ref_paths/, 'must skip paths missing from git')
assert.match(sh, /resolve_compose_file/, 'must resolve compose file on server')

const ps1 = fs.readFileSync(path.join(ROOT, 'scripts/push-staging-editor.ps1'), 'utf8')
assert.doesNotMatch(ps1, /Inject-SaveApi|Set-Content.*player\.html/, 'push must not mutate player.html on disk')
assert.doesNotMatch(ps1, /'`n<\/head>'/, 'push must not use single-quoted `n replacement')

console.log('update-staging-from-github.test: PASS')
