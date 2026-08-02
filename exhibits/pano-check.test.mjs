import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { assetFingerprint, hasAssetFile, isRemotePanoramaUrl, FINGERPRINT_CHUNK, FINGERPRINT_LENGTH } from './pano-check.mjs'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

let pass = 0, fail = 0
function test(name, fn) {
  try { fn(); pass++; console.log('  ok', name) }
  catch (e) { fail++; console.error(' FAIL', name, e.message) }
}

console.log('pano-check tests')

test('remote URLs count as available', () => {
  assert.ok(isRemotePanoramaUrl('https://example.com/p.jpg'))
  assert.ok(hasAssetFile('/tmp/x', 'https://example.com/p.jpg'))
})

test('missing local file returns false', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-pano-'))
  try {
    assert.equal(hasAssetFile(tmp, 'assets/panorama.jpg'), false)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('existing local file returns true', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-pano-'))
  try {
    const assets = path.join(tmp, 'assets')
    fs.mkdirSync(assets)
    fs.writeFileSync(path.join(assets, 'panorama.jpg'), 'x')
    assert.equal(hasAssetFile(tmp, 'assets/panorama.jpg'), true)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('new template dir without panorama file is false', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-pano-'))
  try {
    fs.cpSync(path.join(ROOT, '_template'), path.join(tmp, 'craft-test'), { recursive: true })
    assert.equal(hasAssetFile(path.join(tmp, 'craft-test'), 'assets/panorama.jpg', tmp), false)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('root-relative missing returns false', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-pano-'))
  try {
    assert.equal(hasAssetFile(tmp, '/definitely-missing.jpg', tmp), false)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('root-relative existing returns true', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-pano-'))
  try {
    fs.mkdirSync(path.join(tmp, 'media'), { recursive: true })
    fs.writeFileSync(path.join(tmp, 'media', 'p.jpg'), 'x')
    assert.equal(hasAssetFile(tmp, '/media/p.jpg', tmp), true)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})

test('hasAssetFile 同样适用于模型文件（工作台「缺模型」判断）', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-asset-'))
  try {
    const assets = path.join(tmp, 'assets')
    fs.mkdirSync(assets)
    fs.writeFileSync(path.join(assets, 'model.glb'), 'x')
    assert.equal(hasAssetFile(tmp, 'assets/model.glb'), true)
    assert.equal(hasAssetFile(tmp, 'assets/missing.glb'), false)
    assert.equal(hasAssetFile(tmp, ''), false)
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
})


/* ---------- 内容指纹（工作台按内容给背景分组，路径不可靠） ---------- */

function withTmp(fn) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'exhibits-fp-'))
  try { return fn(tmp) } finally { fs.rmSync(tmp, { recursive: true, force: true }) }
}
/** 造一个可控内容的文件：head/mid/tail 三段可分别指定 */
function makeFile(file, { size, head = 0x11, mid = 0x22, tail = 0x33 }) {
  const buf = Buffer.alloc(size, mid)
  buf.fill(head, 0, Math.min(size, FINGERPRINT_CHUNK))
  if (size > FINGERPRINT_CHUNK) buf.fill(tail, Math.max(FINGERPRINT_CHUNK, size - FINGERPRINT_CHUNK), size)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, buf)
}

test('指纹：同一张图放在不同展品目录下得到同一个值', () => {
  withTmp(tmp => {
    const a = path.join(tmp, 'craft-001'), b = path.join(tmp, 'craft-002')
    fs.mkdirSync(path.join(a, 'assets'), { recursive: true })
    fs.mkdirSync(path.join(b, 'assets'), { recursive: true })
    fs.writeFileSync(path.join(a, 'assets', 'panorama.jpg'), 'same-bytes')
    fs.writeFileSync(path.join(b, 'assets', 'panorama.jpg'), 'same-bytes')
    const fa = assetFingerprint(a, 'assets/panorama.jpg')
    assert.equal(fa.length, FINGERPRINT_LENGTH)
    assert.equal(fa, assetFingerprint(b, 'assets/panorama.jpg'))
  })
})

test('指纹：同名但内容不同的图必须区分开', () => {
  withTmp(tmp => {
    const a = path.join(tmp, 'craft-001'), b = path.join(tmp, 'craft-002')
    fs.mkdirSync(a); fs.mkdirSync(b)
    fs.writeFileSync(path.join(a, 'p.jpg'), 'AAAA')
    fs.writeFileSync(path.join(b, 'p.jpg'), 'BBBB')
    assert.notEqual(assetFingerprint(a, 'p.jpg'), assetFingerprint(b, 'p.jpg'))
  })
})

test('指纹：长度相同但首段不同 → 不同值', () => {
  withTmp(tmp => {
    makeFile(path.join(tmp, 'a.bin'), { size: 300_000, head: 0x11 })
    makeFile(path.join(tmp, 'b.bin'), { size: 300_000, head: 0x99 })
    assert.notEqual(assetFingerprint(tmp, 'a.bin'), assetFingerprint(tmp, 'b.bin'))
  })
})

test('指纹：长度相同但尾段不同 → 不同值', () => {
  withTmp(tmp => {
    makeFile(path.join(tmp, 'a.bin'), { size: 300_000, tail: 0x33 })
    makeFile(path.join(tmp, 'b.bin'), { size: 300_000, tail: 0x77 })
    assert.notEqual(assetFingerprint(tmp, 'a.bin'), assetFingerprint(tmp, 'b.bin'))
  })
})

test('指纹：只差一个字节的长度也能区分（长度参与哈希）', () => {
  withTmp(tmp => {
    fs.writeFileSync(path.join(tmp, 'a.bin'), Buffer.alloc(200_000, 0x11))
    fs.writeFileSync(path.join(tmp, 'b.bin'), Buffer.alloc(200_001, 0x11))
    assert.notEqual(assetFingerprint(tmp, 'a.bin'), assetFingerprint(tmp, 'b.bin'))
  })
})

test('指纹：已知取舍——超大文件仅中段不同会被判为同一张（有意为之）', () => {
  withTmp(tmp => {
    makeFile(path.join(tmp, 'a.bin'), { size: 300_000, mid: 0x22 })
    makeFile(path.join(tmp, 'b.bin'), { size: 300_000, mid: 0x88 })
    // 记录既定行为：换成整文件哈希才能区分，但那样 100+ 件每次刷新要读上 GB
    assert.equal(assetFingerprint(tmp, 'a.bin'), assetFingerprint(tmp, 'b.bin'))
  })
})

test('指纹：≤64KiB 的小文件按整文件算，不受头尾切分影响', () => {
  withTmp(tmp => {
    fs.writeFileSync(path.join(tmp, 'a.bin'), Buffer.alloc(1024, 0x41))
    const buf = Buffer.alloc(1024, 0x41); buf[500] = 0x42
    fs.writeFileSync(path.join(tmp, 'b.bin'), buf)
    assert.notEqual(assetFingerprint(tmp, 'a.bin'), assetFingerprint(tmp, 'b.bin'))
  })
})

test('指纹：空文件也能得到稳定值', () => {
  withTmp(tmp => {
    fs.writeFileSync(path.join(tmp, 'e.bin'), '')
    const f = assetFingerprint(tmp, 'e.bin')
    assert.equal(f.length, FINGERPRINT_LENGTH)
    assert.equal(f, assetFingerprint(tmp, 'e.bin'))
  })
})

test('指纹：远程 / 缺失 / 空路径一律返回空串', () => {
  withTmp(tmp => {
    assert.equal(assetFingerprint(tmp, 'https://cdn.example.com/p.jpg'), '')
    assert.equal(assetFingerprint(tmp, 'data:image/png;base64,AAA'), '')
    assert.equal(assetFingerprint(tmp, '//cdn.example.com/p.jpg'), '')
    assert.equal(assetFingerprint(tmp, 'missing.jpg'), '')
    assert.equal(assetFingerprint(tmp, ''), '')
    assert.equal(assetFingerprint(tmp, null), '')
    assert.equal(assetFingerprint(tmp, 'subdir'), '')   // 目录不是文件
  })
})

test('指纹：根相对路径需要 exhibitsRoot 才解析', () => {
  withTmp(tmp => {
    fs.mkdirSync(path.join(tmp, 'shared'))
    fs.writeFileSync(path.join(tmp, 'shared', 'bg.jpg'), 'x')
    assert.equal(assetFingerprint(tmp, '/shared/bg.jpg'), '')
    assert.notEqual(assetFingerprint(tmp, '/shared/bg.jpg', tmp), '')
  })
})

test('指纹：Node / Python / PHP 三份实现必须给出同一个值', () => {
  withTmp(tmp => {
    // 覆盖三种分支：小于一个 chunk、跨越 chunk 边界、大于两个 chunk
    const cases = { 'small.bin': 1000, 'edge.bin': FINGERPRINT_CHUNK + 7, 'big.bin': FINGERPRINT_CHUNK * 3 + 13 }
    for (const [name, size] of Object.entries(cases)) {
      const buf = Buffer.alloc(size)
      for (let i = 0; i < size; i++) buf[i] = (i * 31 + 7) & 0xff
      fs.writeFileSync(path.join(tmp, name), buf)
    }
    const py = execFileSync('python', ['-c', `
import sys, json
sys.path.insert(0, ${JSON.stringify(ROOT)})
from pathlib import Path
from pano_check import asset_fingerprint
d = Path(${JSON.stringify(tmp)})
print(json.dumps({n: asset_fingerprint(d, n) for n in ${JSON.stringify(Object.keys(cases))}}))
`], { encoding: 'utf8' })
    // api.php 保持单文件可部署，用 STUDIO_API_LIB_ONLY 只加载函数、不跑请求分发
    const phpCode = `define('STUDIO_API_LIB_ONLY', 1);`
      + `require ${JSON.stringify(path.join(ROOT, '_server', 'api.php'))};`
      + `$out = [];`
      + `foreach (${JSON.stringify(Object.keys(cases))} as $n) {`
      + `  $out[$n] = studio_asset_fingerprint(${JSON.stringify(path.dirname(tmp))}, ${JSON.stringify(path.basename(tmp))}, $n);`
      + `}`
      + `echo json_encode($out);`
    const php = execFileSync('php', ['-r', phpCode], { encoding: 'utf8' })
    const fromPy = JSON.parse(py), fromPhp = JSON.parse(php)
    for (const name of Object.keys(cases)) {
      const node = assetFingerprint(tmp, name)
      assert.equal(node.length, FINGERPRINT_LENGTH)
      assert.equal(fromPy[name], node, `python 与 node 不一致：${name}`)
      assert.equal(fromPhp[name], node, `php 与 node 不一致：${name}`)
    }
  })
})

test('protocol-relative URL counts as remote', () => {
  assert.ok(isRemotePanoramaUrl('//cdn.example.com/p.jpg'))
  assert.ok(hasAssetFile('/tmp/x', '//cdn.example.com/p.jpg'))
})

console.log('')
if (fail) {
  console.error(`pano-check: ${pass} passed, ${fail} failed`)
  process.exit(1)
}
console.log(`pano-check: ${pass} passed`)
