/**
 * 动态详情点赞/收藏失败流单测
 * 运行：node miniapp/utils/newsDetailActions.test.js
 */
const assert = require('assert')
const {
  mergeLikeSuccess,
  mergeFavoriteSuccess,
  likeSuccessToast,
  favoriteSuccessToast
} = require('./newsDetailActions')

const base = {
  liked: false,
  collected: false,
  likeCount: 10,
  favoriteCount: 2,
  likeLabel: '点赞 10',
  collectLabel: '收藏 2'
}

function pageLikeOutcome(prev, err, res) {
  if (err) return { next: prev, toast: '' }
  const patch = mergeLikeSuccess(prev, res)
  return { next: { ...prev, ...patch }, toast: likeSuccessToast(patch) }
}

function pageFavoriteOutcome(prev, err, res) {
  if (err) return { next: prev, toast: '' }
  const patch = mergeFavoriteSuccess(prev, res)
  return { next: { ...prev, ...patch }, toast: favoriteSuccessToast(patch) }
}

const likeOk = pageLikeOutcome(base, null, { liked: true, likeCount: 11 })
assert.strictEqual(likeOk.next.liked, true)
assert.strictEqual(likeOk.toast, '点赞成功')

const likeFail = pageLikeOutcome(base, new Error('network'), null)
assert.strictEqual(likeFail.next.liked, false)
assert.strictEqual(likeFail.next.likeCount, 10)
assert.strictEqual(likeFail.toast, '')

const unlikeFail = pageLikeOutcome(
  { ...base, liked: true, likeCount: 11 },
  new Error('timeout'),
  null
)
assert.strictEqual(unlikeFail.next.liked, true)
assert.strictEqual(unlikeFail.next.likeCount, 11)
assert.strictEqual(unlikeFail.toast, '')

const collectOk = pageFavoriteOutcome(base, null, { collected: true, favoriteCount: 3 })
assert.strictEqual(collectOk.next.collected, true)
assert.strictEqual(collectOk.toast, '收藏成功')

const collectFail = pageFavoriteOutcome(base, { code: 502 }, null)
assert.strictEqual(collectFail.next.collected, false)
assert.strictEqual(collectFail.toast, '')

const uncollectFail = pageFavoriteOutcome(
  { ...base, collected: true, favoriteCount: 3 },
  { code: 401 },
  null
)
assert.strictEqual(uncollectFail.next.collected, true)
assert.strictEqual(uncollectFail.toast, '')

console.log('[newsDetailActions.test] PASS')
