#!/usr/bin/env node
/** studio 鉴权 fail-closed 静态/行为检查 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const api = fs.readFileSync(path.join(ROOT, 'exhibits/_server/api.php'), 'utf8')
const node = fs.readFileSync(path.join(ROOT, 'exhibits/_server/studio-server.mjs'), 'utf8')
const apply = fs.readFileSync(path.join(ROOT, 'scripts/apply-staging-editor.sh'), 'utf8')

assert.match(api, /studio_reject_unconfigured_auth/, 'php must reject missing STUDIO_PASS')
assert.match(api, /503/, 'php must return 503 when auth not configured')
assert.match(node, /process\.exit\(1\)/, 'node must refuse start without STUDIO_PASS')
assert.match(node, /STUDIO_ALLOW_INSECURE/, 'node must allow explicit insecure local mode')
assert.match(apply, /probe_api_list_requires_unauth/, 'apply must probe unauthenticated API')

console.log('studio-auth.test: PASS')
