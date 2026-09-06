/**
 * PNG / JPEG / WebP 图头宽高。只用 Uint8Array，浏览器和 Node 共用。
 * 读不出返回 null，不猜尺寸。
 */

function u16le(b, i) {
  return b[i] | (b[i + 1] << 8)
}

function u16be(b, i) {
  return (b[i] << 8) | b[i + 1]
}

function u24le(b, i) {
  return b[i] | (b[i + 1] << 8) | (b[i + 2] << 16)
}

function u32le(b, i) {
  return (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0
}

function u32be(b, i) {
  return ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0
}

function ascii(b, i, n) {
  let s = ''
  for (let k = 0; k < n; k++) s += String.fromCharCode(b[i + k])
  return s
}

function asBytes(input) {
  if (!input) return null
  if (input instanceof Uint8Array) return input
  if (input.buffer instanceof ArrayBuffer) {
    return new Uint8Array(input.buffer, input.byteOffset || 0, input.byteLength || input.length)
  }
  return null
}

function readPngSize(b) {
  if (b.length < 24) return null
  if (u32be(b, 0) !== 0x89504e47 || u32be(b, 4) !== 0x0d0a1a0a) return null
  return { w: u32be(b, 16), h: u32be(b, 20), kind: 'png' }
}

function readJpegSize(b) {
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null
  let i = 2
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) { i++; continue }
    const marker = b[i + 1]
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue }
    const len = u16be(b, i + 2)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { w: u16be(b, i + 7), h: u16be(b, i + 5), kind: 'jpeg' }
    }
    if (len < 2) return null
    i += 2 + len
  }
  return null
}

function readWebpSize(b) {
  if (b.length < 16 || ascii(b, 0, 4) !== 'RIFF' || ascii(b, 8, 4) !== 'WEBP') return null
  if (b.length < 20) return null
  const fmt = ascii(b, 12, 4)
  if (fmt === 'VP8X') {
    if (b.length < 30) return null
    return { w: (u24le(b, 24) & 0xffffff) + 1, h: (u24le(b, 27) & 0xffffff) + 1, kind: 'webp-vp8x' }
  }
  if (fmt === 'VP8 ') {
    if (b.length < 30) return null
    return { w: u16le(b, 26) & 0x3fff, h: u16le(b, 28) & 0x3fff, kind: 'webp-vp8' }
  }
  if (fmt === 'VP8L') {
    if (b.length < 25 || b[20] !== 0x2f) return null
    const bits = u32le(b, 21)
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1, kind: 'webp-vp8l' }
  }
  return null
}

/** @returns {{ w: number, h: number, kind: string } | null} */
export function readImageSize(input) {
  const b = asBytes(input)
  if (!b || b.length < 16) return null
  return readPngSize(b) || readWebpSize(b) || readJpegSize(b)
}
