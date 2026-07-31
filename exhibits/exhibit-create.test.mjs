import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createExhibit,
  normalizeExhibitDir,
  suggestNextExhibitDir,
} from './exhibit-create.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}

console.log('exhibit-create tests')

test('normalizeExhibitDir pads numeric input', () => {
  assert.equal(normalizeExhibitDir('5'), 'craft-005')
  assert.equal(normalizeExhibitDir('craft-007'), 'craft-007')
})

test('createExhibit builds empty hotspot config', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-new-'))
  try {
    fs.cpSync(path.join(ROOT, '_template'), path.join(tmp, '_template'), { recursive: true })
    const r = createExhibit(tmp, { dir: '006', title: '测试展品', subtitle: '副标题' })
    assert.equal(r.dir, 'craft-006')
    const cfg = JSON.parse(fs.readFileSync(path.join(tmp, 'craft-006', 'config.json'), 'utf8'))
    assert.equal(cfg.id, 'craft-006')
    assert.equal(cfg.i18n.zh.title, '测试展品')
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

console.log('')
if (fail) {
  console.error(`exhibit-create: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`exhibit-create: ${pass} passed`)
