#!/usr/bin/env node
/** 校验 staging pack 的 player.html 未被 push 脚本破坏。 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectStagingEditorRelPaths } from '../exhibits/staging-editor-paths.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const player = fs.readFileSync(path.join(ROOT, 'exhibits/player.html'), 'utf8')

assert.doesNotMatch(player, /`n/, 'source player.html must not contain literal `n')
assert.doesNotMatch(player, /STUDIO-SAVE-ENDPOINT/, 'source player.html save endpoint injected at serve time only')
assert.match(player, /^<!DOCTYPE html>/, 'player.html must start with doctype')

const paths = collectStagingEditorRelPaths()
for (const need of ['player.html', 'studio.html', 'pano-check.mjs', 'exhibit-create.mjs']) {
  assert.ok(paths.includes(need), `missing ${need}`)
}
assert.ok(!paths.some(p => /^craft-/.test(p)), 'collector must exclude craft content')

console.log('push-staging-editor.test: PASS')
