#!/usr/bin/env node
/** apply-staging-editor.sh 探测逻辑：studio / player / API 均须成功。 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sh = fs.readFileSync(path.join(ROOT, 'scripts/apply-staging-editor.sh'), 'utf8')

function probeExit(studioOk, playerOk, apiOk) {
  return studioOk && playerOk && apiOk ? 0 : 1
}

assert.equal(probeExit(1, 1, 1), 0)
assert.equal(probeExit(1, 0, 1), 1)
assert.equal(probeExit(0, 1, 1), 1)
assert.equal(probeExit(1, 1, 0), 1)

assert.match(sh, /STUDIO_HTML_OK/)
assert.match(sh, /PLAYER_HTML_OK/)
assert.match(sh, /API_OK/)
assert.match(sh, /probe_required/)
assert.doesNotMatch(sh, /STUDIO_OK=1/)
assert.match(sh, /PROBE_FAIL.*exit 1/s)

console.log('apply-staging-editor.test: PASS')
