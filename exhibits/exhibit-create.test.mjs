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
  ['0', 'craft-000'],
  ['000', 'craft-000'],
  ['craft-007', 'craft-007'],
]

const LONG_NORM_VECTORS = [
  ['9007199254740991', 'craft-9007199254740991'],
  ['9007199254740992', 'craft-9007199254740992'],
  ['9007199254740993', 'craft-9007199254740993'],
  ['999999999999999999999', 'craft-999999999999999999999'],
]

const REJECT_VECTORS = [
  '００５',           // fullwidth digits
  '٠٠ٵ',             // Arabic-Indic digits (U+0665)
  'craft-',
  'craft-/',
  '/',
  '\\',
  '9'.repeat(33),     // exceeds max digit length
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

test('normalizeExhibitDir long numeric strings preserve exact digits', () => {
  for (const [input, expected] of LONG_NORM_VECTORS) {
    assert.equal(normalizeExhibitDir(input), expected, input)
  }
  assert.equal(normalizeExhibitDir('9007199254740993'), 'craft-9007199254740993')
  assert.notEqual(normalizeExhibitDir('9007199254740993'), 'craft-9007199254740992')
})

test('normalizeExhibitDir rejects unsafe inputs consistently', () => {
  for (const input of REJECT_VECTORS) {
    assert.throws(() => normalizeExhibitDir(input), /非法|不能为空|过长/, input)
  }
})

test('Python normalize_exhibit_dir matches Node vectors', () => {
  const all = [...NORM_VECTORS, ...LONG_NORM_VECTORS]
  const py = spawnSync('python', ['-c', `
import sys, json
sys.path.insert(0, ${JSON.stringify(ROOT)})
from exhibit_create import normalize_exhibit_dir
print(json.dumps([[a, normalize_exhibit_dir(a)] for a in ${JSON.stringify(all.map(v => v[0]))}]))
`], { encoding: 'utf8' })
  if (py.status !== 0) return
  const pairs = JSON.parse(py.stdout.trim())
  for (const [input, got] of pairs) {
    assert.equal(got, normalizeExhibitDir(input), `python ${input}`)
  }
})

test('Python normalize_exhibit_dir rejects same unsafe vectors as Node', () => {
  const py = spawnSync('python', ['-c', `
import sys, json
sys.path.insert(0, ${JSON.stringify(ROOT)})
from exhibit_create import normalize_exhibit_dir
out = []
for raw in ${JSON.stringify(REJECT_VECTORS)}:
  try:
    normalize_exhibit_dir(raw)
    out.append([raw, None])
  except Exception as e:
    out.append([raw, type(e).__name__])
print(json.dumps(out))
`], { encoding: 'utf8' })
  if (py.status !== 0) return
  const pairs = JSON.parse(py.stdout.trim())
  for (const [input, errorType] of pairs) {
    assert.notEqual(errorType, null, `python unexpectedly accepted ${input}`)
    assert.throws(() => normalizeExhibitDir(input), /非法|不能为空|过长/, `node ${input}`)
  }
})

test('PHP studio_normalize_exhibit_dir matches Node long numeric vectors', () => {
  const all = [...NORM_VECTORS, ...LONG_NORM_VECTORS]
  const php = spawnSync('php', ['-r', `
function studio_normalize_numeric_suffix(string $digits): string {
  if (!ctype_digit($digits)) throw new Exception('非法展品编号');
  $trimmed = preg_replace('/^0+(?=\\d)/', '', $digits);
  if ($trimmed === '') $trimmed = '0';
  if (strlen($trimmed) > 32) throw new Exception('展品编号过长');
  return str_pad($trimmed, 3, '0', STR_PAD_LEFT);
}
function studio_normalize_exhibit_dir(string $raw): string {
  $s = trim($raw, " \\t\\n\\r\\0\\x0B/\\\\");
  if ($s === '') throw new Exception('展品目录不能为空');
  if (ctype_digit($s)) {
    $s = 'craft-' . studio_normalize_numeric_suffix($s);
  } elseif (stripos($s, 'craft-') !== 0) {
    $s = 'craft-' . $s;
  }
  if ($s === 'craft-' || !preg_match('/^[A-Za-z0-9_-]+$/', $s)) throw new Exception('非法展品目录名：' . $s);
  return $s;
}
$vectors = json_decode(${JSON.stringify(JSON.stringify(all.map(v => v[0])))});
$out = [];
foreach ($vectors as $raw) $out[] = [ $raw, studio_normalize_exhibit_dir($raw) ];
echo json_encode($out);
`], { encoding: 'utf8' })
  if (php.status !== 0) return
  const pairs = JSON.parse(php.stdout.trim())
  for (const [input, got] of pairs) {
    assert.equal(got, normalizeExhibitDir(input), `php ${input}`)
  }
})

console.log('')
if (fail) {
  console.error(`exhibit-create: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`exhibit-create: ${pass} passed`)
