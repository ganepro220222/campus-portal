/**
 * 海报封面参数单测
 * 运行：node miniapp/utils/posterCover.test.js
 */
const assert = require('assert')
const {
  parsePosterCover,
  pickHallCover,
  pickCraftCover,
  buildPosterNavigateUrl,
  titleStartY,
  coverRect
} = require('./posterCover')

assert.strictEqual(parsePosterCover(''), '')
assert.strictEqual(parsePosterCover('https://cdn.example.com/a.jpg'), 'https://cdn.example.com/a.jpg')
assert.strictEqual(parsePosterCover(encodeURIComponent('https://cdn.example.com/b.png')),
  'https://cdn.example.com/b.png')
assert.strictEqual(parsePosterCover('/local/path.jpg'), '')

assert.strictEqual(pickHallCover({ slides: [{ imageUrl: 'https://cdn/h.jpg' }] }), 'https://cdn/h.jpg')
assert.strictEqual(pickHallCover({ slides: [] }), '')
assert.strictEqual(pickCraftCover({ images: [{ imageUrl: 'https://cdn/c.jpg' }] }), 'https://cdn/c.jpg')

const url = buildPosterNavigateUrl({
  type: 'hall',
  title: '阳明文化',
  cover: 'https://cdn.example.com/h.jpg'
})
assert.ok(url.includes('type=hall'))
assert.ok(url.includes('title='))
assert.ok(url.includes('cover='))

assert.strictEqual(titleStartY(true), 318)
assert.strictEqual(titleStartY(false), 250)
assert.strictEqual(coverRect(300).w, 220)

console.log('[posterCover.test] PASS')
