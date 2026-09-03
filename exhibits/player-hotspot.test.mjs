import assert from 'node:assert/strict'
import fs from 'node:fs'

const html = fs.readFileSync(new URL('./player.html', import.meta.url), 'utf8')
const bundle = fs.readFileSync(new URL('./player.bundle.js', import.meta.url), 'utf8')
assert.match(html, /function hotspotPos\(/)
assert.match(html, /Array\.isArray\(p\)/)
assert.match(html, /failPlayer\('展品配置无法解析，请检查热点数据后重试', true\)/)
assert.match(bundle, /invalid hotspot position/, 'player.bundle.js missing hotspot guard — run node build-viewer.mjs')
const failEscaped = [...'展品配置无法解析'].map((c) => '\\u' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')).join('')
assert.ok(bundle.includes(failEscaped), 'player.bundle.js missing failPlayer copy — run node build-viewer.mjs')
console.log('[player-hotspot.test] PASS')
