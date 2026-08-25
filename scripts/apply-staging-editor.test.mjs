#!/usr/bin/env node
/** apply-staging-editor.sh 探测逻辑：studio / player / API 均须成功；301/302 不算成功。 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sh = fs.readFileSync(path.join(ROOT, 'scripts/apply-staging-editor.sh'), 'utf8')

function probeExit(studioOk, playerOk, apiOk) {
  return studioOk && playerOk && apiOk ? 0 : 1
}

function htmlProbeOk(httpCode, effectiveUrl, expectPath, body, marker, hasPass) {
  if (!effectiveUrl.includes(expectPath)) return false
  if (httpCode === 200) return body.includes(marker)
  if (httpCode === 401 && !hasPass) return true
  return false
}

function apiProbeOk(httpCode, body, hasPass) {
  if (httpCode === 200) {
    try {
      const d = JSON.parse(body)
      return Array.isArray(d.exhibits)
    } catch {
      return false
    }
  }
  if (httpCode === 401 && !hasPass) return true
  return false
}

assert.equal(probeExit(1, 1, 1), 0)
assert.equal(probeExit(1, 0, 1), 1)
assert.equal(probeExit(0, 1, 1), 1)
assert.equal(probeExit(1, 1, 0), 1)

assert.equal(htmlProbeOk(302, 'http://127.0.0.1/', '/studio/player.html', '', 'x', false), false)
assert.equal(htmlProbeOk(200, 'http://127.0.0.1/studio/player.html', '/studio/player.html', 'window.__SY_PLAYER = {}', '__SY_PLAYER', true), true)
assert.equal(htmlProbeOk(401, 'http://127.0.0.1/studio/studio.html', '/studio/studio.html', '', 'x', false), true)
assert.equal(apiProbeOk(200, JSON.stringify({ exhibits: [] }), true), true)
assert.equal(apiProbeOk(200, '<html>', true), false)

assert.match(sh, /STUDIO_HTML_OK/)
assert.match(sh, /PLAYER_HTML_OK/)
assert.match(sh, /API_OK/)
assert.match(sh, /probe_html_required/)
assert.match(sh, /probe_api_list_required/)
assert.match(sh, /curl -sS -L/)
assert.match(sh, /3D 鉴赏工作台/)
assert.match(sh, /window\.__SY_PLAYER/)
assert.doesNotMatch(sh, /200\|301\|302\|401/)
assert.match(sh, /PROBE_FAIL.*exit 1/s)

console.log('apply-staging-editor.test: PASS')
