import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const html = fs.readFileSync(fileURLToPath(new URL('./player.html', import.meta.url)), 'utf8')
assert.match(html, /function hotspotPos\(/)
assert.match(html, /Array\.isArray\(p\)/)
assert.match(html, /failPlayer\('展品配置无法解析，请检查热点数据后重试', true\)/)
console.log('[player-hotspot.test] PASS')
