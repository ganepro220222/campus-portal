#!/usr/bin/env node
/** apply-staging-editor.sh 探测逻辑与脚本结构检查。 */
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
  if (httpCode === 401 && !hasPass) return false
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
  if (httpCode === 401 && !hasPass) return false
  return false
}

assert.equal(probeExit(1, 1, 1), 0)
assert.equal(probeExit(1, 0, 1), 1)

assert.equal(htmlProbeOk(302, 'http://127.0.0.1/', '/studio/player.html', '', 'x', false), false)
assert.equal(htmlProbeOk(200, 'http://127.0.0.1/studio/player.html', '/studio/player.html', 'window.__SY_PLAYER = {}', '__SY_PLAYER', true), true)
assert.equal(htmlProbeOk(401, 'http://127.0.0.1/studio/studio.html', '/studio/studio.html', '', 'x', false), false)
assert.equal(apiProbeOk(401, '', false), false)
assert.equal(apiProbeOk(200, JSON.stringify({ exhibits: [] }), true), true)

assert.match(sh, /正式验收须设置 STUDIO_PASS/)
assert.match(sh, /ALLOW_AUTH_ONLY_PROBE/)
assert.match(sh, /exit 2/)
assert.doesNotMatch(sh, /未设 STUDIO_PASS：仅验证 401/)
assert.match(
  sh,
  /probe_html_required "http:\/\/127\.0\.0\.1\$\{STUDIO_PREFIX\}\/studio\.html" "\$\{STUDIO_PREFIX\}\/studio\.html"/,
  'expect_path must follow STUDIO_HTTP_PREFIX',
)
assert.match(
  sh,
  /probe_html_required "http:\/\/127\.0\.0\.1\$\{STUDIO_PREFIX\}\/player\.html" "\$\{STUDIO_PREFIX\}\/player\.html"/,
  'player expect_path must follow STUDIO_HTTP_PREFIX',
)
assert.match(sh, /probe_api_list_requires_unauth/, 'must verify API blocks unauthenticated access')
assert.equal(
  htmlProbeOk(200, 'http://127.0.0.1/exhibits/studio.html', '/exhibits/studio.html', '3D 鉴赏工作台', '3D 鉴赏工作台', true),
  true,
)

console.log('apply-staging-editor.test: PASS')
