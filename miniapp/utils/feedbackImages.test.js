/**
 * 意见反馈附图工具单测
 * 运行：node miniapp/utils/feedbackImages.test.js
 */
const assert = require('assert')
const {
  MAX_IMAGES,
  isHttpUrl,
  normalizeUploadedUrl,
  buildSubmitImages,
  remainingSlots
} = require('./feedbackImages')

assert.strictEqual(MAX_IMAGES, 9)
assert.strictEqual(isHttpUrl(''), false)
assert.strictEqual(isHttpUrl('/local.jpg'), false)
assert.strictEqual(isHttpUrl('https://cdn.example.com/a.jpg'), true)
assert.strictEqual(isHttpUrl('http://127.0.0.1/x.png'), true)

assert.strictEqual(normalizeUploadedUrl(null), '')
assert.strictEqual(normalizeUploadedUrl({ url: 'ftp://x' }), '')
assert.strictEqual(normalizeUploadedUrl({ url: 'https://cdn/a.webp' }), 'https://cdn/a.webp')

assert.deepStrictEqual(buildSubmitImages([
  { url: 'https://cdn/a.jpg' },
  { url: 'bad' },
  { url: 'http://cdn/b.png' }
]), ['https://cdn/a.jpg', 'http://cdn/b.png'])

assert.deepStrictEqual(
  buildSubmitImages(Array.from({ length: 12 }, (_, i) => ({ url: `https://cdn/${i}.jpg` }))).length,
  9
)

assert.strictEqual(remainingSlots(0), 9)
assert.strictEqual(remainingSlots(9), 0)
assert.strictEqual(remainingSlots(12), 0)

console.log('[feedbackImages.test] PASS')
