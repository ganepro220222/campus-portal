import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { assetFingerprint, hasAssetFile, isRemotePanoramaUrl, imageSize, isPanoramaRatio,
  listPanoramaCandidates, FINGERPRINT_CHUNK, FINGERPRINT_LENGTH } from './pano-check.mjs'

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


/* ---------- 全景图候选（批量编辑的下拉选择） ---------- */

/** 造最小可用的图头；只写解析器真正会读的那几个字段 */
function pngHeader(w, h) {
  const b = Buffer.alloc(24)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0)
  b.writeUInt32BE(13, 8); b.write('IHDR', 12); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20)
  return b
}
function jpegHeader(w, h) {
  const b = Buffer.alloc(20)
  b.writeUInt16BE(0xffd8, 0)
  b.writeUInt16BE(0xffe0, 2); b.writeUInt16BE(4, 4)        // 一个空 APP0，逼解析器走跳段逻辑
  b.writeUInt16BE(0xffc0, 8); b.writeUInt16BE(17, 10); b[12] = 8
  b.writeUInt16BE(h, 13); b.writeUInt16BE(w, 15)
  return b
}
function webpVP8X(w, h) {
  const b = Buffer.alloc(30)
  b.write('RIFF', 0); b.writeUInt32LE(22, 4); b.write('WEBP', 8); b.write('VP8X', 12)
  b.writeUInt32LE(10, 16)
  b.writeUIntLE(w - 1, 24, 3); b.writeUIntLE(h - 1, 27, 3)
  return b
}

test('imageSize：PNG / JPEG / WebP 三种图头都能读出尺寸', () => {
  assert.deepEqual(imageSize(pngHeader(2048, 1024)), { width: 2048, height: 1024 })
  assert.deepEqual(imageSize(jpegHeader(4096, 2048)), { width: 4096, height: 2048 })
  assert.deepEqual(imageSize(webpVP8X(3000, 1500)), { width: 3000, height: 1500 })
})

test('imageSize：认不出的字节一律返回 null（宁可漏，不可错）', () => {
  assert.equal(imageSize(null), null)
  assert.equal(imageSize(Buffer.alloc(4)), null)
  assert.equal(imageSize(Buffer.from('not an image at all, definitely')), null)
})

test('imageSize：真实 JPEG（craft-001 的全景图）读出 2048×1024', () => {
  const fd = fs.openSync(path.join(ROOT, 'craft-001/assets/panorama.jpg'), 'r')
  try {
    const buf = Buffer.alloc(65536)
    const n = fs.readSync(fd, buf, 0, buf.length, 0)
    assert.deepEqual(imageSize(buf.subarray(0, n)), { width: 2048, height: 1024 })
  } finally { fs.closeSync(fd) }
})

test('isPanoramaRatio：只收接近 2:1 的', () => {
  assert.equal(isPanoramaRatio({ width: 2048, height: 1024 }), true)
  assert.equal(isPanoramaRatio({ width: 4096, height: 2048 }), true)
  assert.equal(isPanoramaRatio({ width: 1920, height: 1080 }), false)   // 16:9 不是等距柱状
  assert.equal(isPanoramaRatio({ width: 1024, height: 1024 }), false)
  assert.equal(isPanoramaRatio(null), false)
  assert.equal(isPanoramaRatio({ width: 0, height: 0 }), false)
})

test('候选扫描：只挑 2:1 的图，路径相对 exhibits/ 且用正斜杠', () => {
  withTmp(tmp => {
    fs.mkdirSync(path.join(tmp, '共享背景'), { recursive: true })
    fs.mkdirSync(path.join(tmp, 'craft-001', 'assets'), { recursive: true })
    fs.writeFileSync(path.join(tmp, '共享背景', '暖阁.jpg'), jpegHeader(4096, 2048))
    fs.writeFileSync(path.join(tmp, 'craft-001', 'assets', 'panorama.png'), pngHeader(2048, 1024))
    fs.writeFileSync(path.join(tmp, 'craft-001', 'assets', 'poster.jpg'), jpegHeader(1600, 1000))  // 16:10，封面
    fs.writeFileSync(path.join(tmp, 'readme.txt'), 'not an image')
    const got = listPanoramaCandidates(tmp)
    assert.deepEqual(got.map(x => x.path), ['craft-001/assets/panorama.png', '共享背景/暖阁.jpg'])
    assert.deepEqual(got[0], { path: 'craft-001/assets/panorama.png', width: 2048, height: 1024 })
  })
})

test('候选扫描：跳过 vendor / node_modules 等目录与隐藏文件', () => {
  withTmp(tmp => {
    for (const d of ['vendor', 'node_modules', '_runtime', '.bak']) {
      fs.mkdirSync(path.join(tmp, d), { recursive: true })
      fs.writeFileSync(path.join(tmp, d, 'x.jpg'), jpegHeader(2048, 1024))
    }
    fs.writeFileSync(path.join(tmp, '.hidden.jpg'), jpegHeader(2048, 1024))
    fs.writeFileSync(path.join(tmp, 'ok.jpg'), jpegHeader(2048, 1024))
    assert.deepEqual(listPanoramaCandidates(tmp).map(x => x.path), ['ok.jpg'])
  })
})

test('候选扫描：目录不存在 / 空目录不抛错', () => {
  assert.deepEqual(listPanoramaCandidates(path.join(ROOT, '_definitely_missing_')), [])
  withTmp(tmp => assert.deepEqual(listPanoramaCandidates(tmp), []))
})

test('候选扫描：Node / Python / PHP 三份实现给出同一份清单', () => {
  withTmp(tmp => {
    // 必须用真实图片：PHP 的 getimagesize() 会校验完整结构，合成图头一律拒收，
    // 拿合成头比三家等于在比「谁更宽容」，不是在比业务口径。
    const realPano = path.join(ROOT, 'craft-001/assets/panorama.jpg')   // 2048×1024
    const realPoster = path.join(ROOT, 'craft-001/assets/poster.jpg')   // 1399×1147，不该入选
    fs.mkdirSync(path.join(tmp, 'a', 'b'), { recursive: true })
    fs.copyFileSync(realPano, path.join(tmp, 'pano1.jpg'))
    fs.copyFileSync(realPano, path.join(tmp, 'a', 'pano2.jpg'))
    fs.copyFileSync(realPoster, path.join(tmp, 'a', 'b', 'poster.jpg'))
    const node = listPanoramaCandidates(tmp)
    const py = JSON.parse(execFileSync('python', ['-c', `
import sys, json
sys.path.insert(0, ${JSON.stringify(ROOT)})
from pathlib import Path
from pano_check import list_panorama_candidates
print(json.dumps(list_panorama_candidates(Path(${JSON.stringify(tmp)}))))
`], { encoding: 'utf8' }))
    const php = JSON.parse(execFileSync('php', ['-r',
      `define('STUDIO_API_LIB_ONLY', 1);`
      + `require ${JSON.stringify(path.join(ROOT, '_server', 'api.php'))};`
      + `echo json_encode(studio_list_panorama_candidates(${JSON.stringify(tmp)}));`], { encoding: 'utf8' }))
    assert.deepEqual(node.map(x => x.path), ['a/pano2.jpg', 'pano1.jpg'])
    assert.deepEqual(py, node, 'python 与 node 清单不一致')
    assert.deepEqual(php, node, 'php 与 node 清单不一致')
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
