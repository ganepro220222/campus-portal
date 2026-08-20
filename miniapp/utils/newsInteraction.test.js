/**
 * 动态点赞/收藏态单测
 * 运行：node miniapp/utils/newsInteraction.test.js
 */
const assert = require('assert')
const {
  mapDetailInteraction,
  applyLikeToggle,
  applyFavoriteToggle,
  buildLikeLabel,
  buildCollectLabel
} = require('./newsInteraction')

const hydrated = mapDetailInteraction({
  liked: true,
  collected: false,
  likeCount: 1280,
  favoriteCount: 0
})
assert.strictEqual(hydrated.liked, true)
assert.strictEqual(hydrated.collected, false)
assert.strictEqual(hydrated.likeCount, 1280)
assert.strictEqual(hydrated.likeLabel, '已赞 1.3k')
assert.strictEqual(hydrated.collectLabel, '收藏')

const guest = mapDetailInteraction({ likeCount: 5, favoriteCount: 2 })
assert.strictEqual(guest.liked, false)
assert.strictEqual(guest.likeLabel, '点赞 5')
assert.strictEqual(guest.collectLabel, '收藏 2')

const liked = applyLikeToggle(
  { liked: false, likeCount: 10 },
  { liked: true, likeCount: 11 }
)
assert.strictEqual(liked.liked, true)
assert.strictEqual(liked.likeCount, 11)
assert.strictEqual(liked.likeLabel, '已赞 11')

const unliked = applyLikeToggle(
  { liked: true, likeCount: 11 },
  { liked: false, likeCount: 10 }
)
assert.strictEqual(unliked.liked, false)
assert.strictEqual(unliked.likeCount, 10)
assert.strictEqual(unliked.likeLabel, '点赞 10')

const collected = applyFavoriteToggle(
  { collected: false, favoriteCount: 3 },
  { collected: true, favoriteCount: 4 }
)
assert.strictEqual(collected.collected, true)
assert.strictEqual(collected.favoriteCount, 4)
assert.strictEqual(collected.collectLabel, '已收藏 4')

assert.strictEqual(buildLikeLabel(false, 0), '点赞')
assert.strictEqual(buildCollectLabel(true, 10000), '已收藏 1.0w')

console.log('[newsInteraction.test] PASS')
