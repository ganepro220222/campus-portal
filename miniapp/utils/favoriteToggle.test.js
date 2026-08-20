/**
 * 全模块收藏单测
 * 运行：node miniapp/utils/favoriteToggle.test.js
 */
const assert = require('assert')
const {
  mapCollectedFromDetail,
  applyCollectedToggle,
  applyListCollected,
  patchListItemCollected
} = require('./favoriteToggle')

assert.deepStrictEqual(mapCollectedFromDetail({ collected: true }), {
  collected: true,
  collectLabel: '已收藏'
})
assert.deepStrictEqual(mapCollectedFromDetail(null), {
  collected: false,
  collectLabel: '收藏'
})

assert.deepStrictEqual(
  applyCollectedToggle({ collected: false, favoriteCount: 2 }, { collected: true, favoriteCount: 3 }),
  { collected: true, collectLabel: '已收藏', favoriteCount: 3 }
)

const list = applyListCollected([{ id: 1, collected: true }, { id: 2 }])
assert.strictEqual(list[0].collectLabel, '已收藏')
assert.strictEqual(list[1].collectLabel, '收藏')

const patched = patchListItemCollected(list, 2, true)
assert.strictEqual(patched[1].collected, true)

console.log('[favoriteToggle.test] PASS')
