import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  createExhibit,
  escapeHtml,
  normalizeExhibitDir,
  suggestNextExhibitDir,
} from './exhibit-create.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

const NORM_VECTORS = [
  ['5', 'craft-005'],
  ['005', 'craft-005'],
  ['0005', 'craft-005'],
  ['craft-007', 'craft-007'],
]

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}

console.log('exhibit-create tests')

test('normalizeExhibitDir numeric padding', () => {
  for (const [input, expected] of NORM_VECTORS) {
    assert.equal(normalizeExhibitDir(input), expected, input)
  }
})

test('normalizeExhibitDir rejects craft- suffix only', () => {
  assert.throws(() => normalizeExhibitDir('craft-'), /非法/)
})

test('normalizeExhibitDir trims slashes like Python', () => {
  assert.equal(normalizeExhibitDir('\\5\\'), 'craft-005')
  assert.equal(normalizeExhibitDir('/005/'), 'craft-005')
})

test('escapeHtml blocks script injection in title context', () => {
  const raw = '</title><script>globalThis.PWNED=1</script><title>'
  const esc = escapeHtml(raw)
  assert.doesNotMatch(esc, /<script/i)
  assert.match(esc, /&lt;script&gt;/)
})

test('createExhibit escapes title in index but keeps raw title in config', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-new-'))
  const malicious = 'A & B </title><script>globalThis.PWNED=1</script><title>'
  try {
    fs.cpSync(path.join(ROOT, '_template'), path.join(tmp, '_template'), { recursive: true })
    const r = createExhibit(tmp, { dir: '901', title: malicious, subtitle: '副' })
    assert.equal(r.assetsDir, 'craft-901/assets')
    const cfg = JSON.parse(fs.readFileSync(path.join(tmp, 'craft-901', 'config.json'), 'utf8'))
    assert.equal(cfg.i18n.zh.title, malicious)
    const idx = fs.readFileSync(path.join(tmp, 'craft-901', 'index.html'), 'utf8')
    assert.doesNotMatch(idx, /<script>globalThis\.PWNED/)
    assert.match(idx, /<title>.*&lt;script&gt;/)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('createExhibit builds empty hotspot config', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-new-'))
  try {
    fs.cpSync(path.join(ROOT, '_template'), path.join(tmp, '_template'), { recursive: true })
    const r = createExhibit(tmp, { dir: '006', title: '测试展品', subtitle: '副标题' })
    assert.equal(r.dir, 'craft-006')
    const cfg = JSON.parse(fs.readFileSync(path.join(tmp, 'craft-006', 'config.json'), 'utf8'))
    assert.equal(cfg.id, 'craft-006')
    assert.equal(cfg.hotspots.length, 0)
    assert.equal(cfg.audio.length, 0)
    const idx = fs.readFileSync(path.join(tmp, 'craft-006', 'index.html'), 'utf8')
    assert.match(idx, /ex=craft-006/)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('createExhibit rejects duplicate dir', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-new-'))
  try {
    fs.cpSync(path.join(ROOT, '_template'), path.join(tmp, '_template'), { recursive: true })
    createExhibit(tmp, { dir: '008', title: 'A' })
    assert.throws(() => createExhibit(tmp, { dir: '008', title: 'B' }), /已存在/)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('createExhibit rolls back on bad template and allows retry', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-new-'))
  try {
    fs.cpSync(path.join(ROOT, '_template'), path.join(tmp, '_template'), { recursive: true })
    fs.writeFileSync(path.join(tmp, '_template', 'config.json'), '{not-json')
    assert.throws(() => createExhibit(tmp, { dir: '902', title: 'X' }))
    assert.equal(fs.existsSync(path.join(tmp, 'craft-902')), false)
    const leftovers = fs.readdirSync(tmp).filter(n => n.startsWith('._creating') || n.startsWith('craft-'))
    assert.equal(leftovers.length, 0)
    fs.copyFileSync(path.join(ROOT, '_template', 'config.json'), path.join(tmp, '_template', 'config.json'))
    createExhibit(tmp, { dir: '902', title: 'X' })
    assert.equal(fs.existsSync(path.join(tmp, 'craft-902')), true)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('suggestNextExhibitDir increments max craft number', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-new-'))
  try {
    fs.mkdirSync(path.join(tmp, 'craft-003'))
    fs.mkdirSync(path.join(tmp, 'craft-010'))
    assert.equal(suggestNextExhibitDir(tmp), 'craft-011')
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('Python normalize_exhibit_dir matches Node vectors', () => {
  const py = spawnSync('python', ['-c', `
import sys, json
sys.path.insert(0, ${JSON.stringify(ROOT)})
from exhibit_create import normalize_exhibit_dir
print(json.dumps([[a, normalize_exhibit_dir(a)] for a in ${JSON.stringify(NORM_VECTORS.map(v => v[0]))}]))
`], { encoding: 'utf8' })
  if (py.status !== 0) return
  const pairs = JSON.parse(py.stdout.trim())
  for (const [input, got] of pairs) {
    assert.equal(got, normalizeExhibitDir(input), `python ${input}`)
  }
})

console.log('')
if (fail) {
  console.error(`exhibit-create: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`exhibit-create: ${pass} passed`)
