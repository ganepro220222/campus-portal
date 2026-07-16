/**
 * 文创详情映射单测
 * 运行：node miniapp/utils/content.test.js
 */
const assert = require('assert')
const { mergeCraftDetail, mergeHallDetail } = require('./content')

const merged = mergeCraftDetail({
  id: 3,
  introZh: '中文',
  introEn: 'EN',
  images: [{ imageUrl: 'https://a.jpg', angleLabel: '正面' }]
}, {})

assert.strictEqual(merged.images.length, 1)
assert.strictEqual(merged.introZh, '中文')
assert.strictEqual(merged.name, undefined)

const fallback = mergeCraftDetail({ id: 3 }, { name: '面具', images: [{ imageUrl: 'x' }] })

assert.strictEqual(fallback.images[0].imageUrl, 'x')
assert.strictEqual(fallback.name, '面具')

const hall = mergeHallDetail({
  id: 2,
  sections: [
    { id: 1, title: '办学历程', items: [{ imageUrl: 'https://a.jpg', caption: '图1' }] }
  ]
}, {})

assert.strictEqual(hall.hasImmersive, true)
assert.strictEqual(hall.sections[0].anchorId, 'section-1')
assert.strictEqual(hall.sections[0].items[0].cls, 'gi1')

console.log('[content.test] PASS')
