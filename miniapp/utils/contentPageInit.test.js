/**
 * 内容详情页加载状态单测
 * 运行：node miniapp/utils/contentPageInit.test.js
 */
const assert = require('assert')
const {
  buildContentDetailLoadedView,
  buildContentDetailInitialFailurePatch,
  buildContentDetailRefreshFailurePatch,
  buildContentDetailLoadingPatch,
  resolveContentDetailOnLoad,
  canInteractWithContent
} = require('./contentPageInit')

const mergeNews = (raw) => ({ ...raw, title: raw.title || 'x' })

const loaded = buildContentDetailLoadedView(
  { id: 3, title: '动态' },
  3,
  'article',
  mergeNews,
  (raw) => ({ liked: !!raw.liked })
)
assert.strictEqual(loaded.article.title, '动态')
assert.strictEqual(loaded.loading, false)
assert.strictEqual(loaded.liked, false)

const networkFail = buildContentDetailInitialFailurePatch(new Error('network'), 'article')
assert.strictEqual(networkFail.loadError, true)
assert.strictEqual(networkFail.article, null)

const notFound = buildContentDetailInitialFailurePatch({ code: 404 }, 'hall')
assert.strictEqual(notFound.notFound, true)
assert.strictEqual(notFound.hall, null)

const prev = { article: { id: 2, title: '保留' } }
const refreshFail = buildContentDetailRefreshFailurePatch(new Error('network'), prev, 'article')
assert.strictEqual(refreshFail.refreshError, true)
assert.strictEqual(refreshFail.article, undefined)

const refresh404 = buildContentDetailRefreshFailurePatch({ code: 404 }, prev, 'article')
assert.strictEqual(refresh404.notFound, true)
assert.strictEqual(refresh404.article, null)

const missing = resolveContentDetailOnLoad({}, { contentKey: 'article' })
assert.strictEqual(missing.shouldLoad, false)
assert.strictEqual(missing.patch.notFound, true)
assert.strictEqual(missing.patch.article, null)

const valid = resolveContentDetailOnLoad({ id: 9 }, { contentKey: 'course' })
assert.strictEqual(valid.shouldLoad, true)
assert.strictEqual(valid.contentId, 9)

const loading = buildContentDetailLoadingPatch('course')
assert.strictEqual(loading.loading, true)
assert.strictEqual(loading.course, null)

assert.strictEqual(
  canInteractWithContent({ loading: false, contentId: 1, article: { id: 1 } }, 'article', 'contentId'),
  true
)
assert.strictEqual(
  canInteractWithContent({ loadError: true, contentId: 1, article: { id: 1 } }, 'article', 'contentId'),
  false
)

console.log('[contentPageInit.test] PASS')
