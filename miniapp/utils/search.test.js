/**
 * 全局搜索映射与分页
 * 运行：node miniapp/utils/search.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  SEARCH_PAGE_SIZE,
  mapSearchResults,
  extractSearchPage,
  mergeSearchResults,
  calcSearchHasMore,
  shouldLoadSearchMore,
  resolveSearchLoadMore,
  sliceSearchPage,
  isStaleSearchResponse
} = require('./search')

const rows = mapSearchResults([
  { targetType: 'news', targetId: 1, title: '动态', summary: '动态摘要' },
  { targetType: 'hall', targetId: 1, title: '展馆' }
])
assert.notStrictEqual(rows[0].searchKey, rows[1].searchKey)
assert.strictEqual(rows[0].searchKey, 'news:1')
assert.strictEqual(rows[1].searchKey, 'hall:1')
assert.strictEqual(rows[0].route, '/packageA/news/detail?id=1')
assert.strictEqual(rows[1].route, '/packageA/hall/detail?id=1')
assert.strictEqual(rows[0].sub, '动态摘要')
assert.strictEqual(new Set(rows.map((r) => r.searchKey)).size, 2)

const first = extractSearchPage({
  records: new Array(20).fill(0).map((_, i) => ({ targetType: 'news', targetId: i + 1 })),
  total: 45
})
assert.strictEqual(first.records.length, 20)
assert.strictEqual(first.total, 45)
assert.strictEqual(calcSearchHasMore(20, 45, 20, 20), true)

const page2 = mergeSearchResults(
  mapSearchResults(first.records),
  [
    { targetType: 'news', targetId: 21, title: '续' },
    { targetType: 'news', targetId: 1, title: '重复动态' }
  ],
  false
)
assert.strictEqual(page2.length, 21, '追加不得覆盖，且按 searchKey 去重')
assert.strictEqual(page2[20].searchKey, 'news:21')
assert.strictEqual(calcSearchHasMore(40, 45, 20, 20), true)
assert.strictEqual(calcSearchHasMore(45, 45, 5, 5), false)
assert.strictEqual(calcSearchHasMore(20, 45, 0, 0), false, '空页必须收尾')
assert.strictEqual(calcSearchHasMore(20, 45, 20, 0), false, '整页都是重复行必须收尾')

const last = mergeSearchResults(page2, [
  { targetType: 'course', targetId: 1 },
  { targetType: 'resource', targetId: 2 },
  { targetType: 'craft', targetId: 3 },
  { targetType: 'hall', targetId: 4 },
  { targetType: 'news', targetId: 99 }
], false)
assert.strictEqual(last.length, 26)
assert.strictEqual(calcSearchHasMore(last.length, 45, 5, 5), true)

assert.strictEqual(shouldLoadSearchMore({
  hasMore: true, loading: false, loadingMore: false, loadMoreError: false
}), true)
assert.strictEqual(shouldLoadSearchMore({
  hasMore: true, loading: false, loadingMore: false, loadMoreError: true
}), false, '分页失败后触底不得自动重试')
assert.strictEqual(shouldLoadSearchMore({
  hasMore: true, loading: false, loadingMore: false, loadMoreError: true
}, true), true, '点击重试才能再要下一页')
assert.strictEqual(shouldLoadSearchMore({
  hasMore: true, loading: false, loadingMore: true, loadMoreError: false
}), false)
assert.strictEqual(shouldLoadSearchMore({
  hasMore: false, loading: false, loadingMore: false, loadMoreError: false
}), false)

const mockSlice = sliceSearchPage(new Array(45).fill(0).map((_, i) => i), 3, SEARCH_PAGE_SIZE)
assert.strictEqual(mockSlice.records.length, 5)
assert.strictEqual(mockSlice.total, 45)
assert.strictEqual(calcSearchHasMore(40 + mockSlice.records.length, mockSlice.total, mockSlice.records.length, mockSlice.records.length), false)

const afterEdit = {
  keyword: '文化',
  activeKeyword: '课程',
  page: 2,
  hasMore: true,
  loading: false,
  loadingMore: false,
  loadMoreError: false
}
const loadAfterEdit = resolveSearchLoadMore(afterEdit, false)
assert.ok(loadAfterEdit)
assert.strictEqual(loadAfterEdit.keyword, '课程', '改了输入框未提交时，翻页仍用已提交词')
assert.strictEqual(loadAfterEdit.requestPage, 2)
assert.strictEqual(resolveSearchLoadMore({
  ...afterEdit,
  activeKeyword: ''
}, false), null)

const live = {
  _listGeneration: 2,
  data: { keyword: '文化', activeKeyword: '课程', page: 2 }
}
assert.strictEqual(isStaleSearchResponse(live, 2, '课程', 2), false)
assert.strictEqual(isStaleSearchResponse(live, 1, '课程', 2), true, '旧代际必须丢弃')
assert.strictEqual(isStaleSearchResponse(live, 2, '文化', 2), true, '输入草稿不得当成已提交词')
assert.strictEqual(isStaleSearchResponse(live, 2, '课程', 1), true, '页码对不上必须丢弃')

const pageJs = fs.readFileSync(path.join(__dirname, '../packageC/search/index.js'), 'utf8')
assert.match(pageJs, /SEARCH_PAGE_SIZE/)
assert.match(pageJs, /requestPage/)
assert.match(pageJs, /isStaleSearchResponse/)
assert.match(pageJs, /resolveSearchLoadMore/)
assert.match(pageJs, /activeKeyword/)
assert.match(pageJs, /results\.length - prevLen/)
assert.doesNotMatch(pageJs, /_loadMore\([\s\S]*?this\.data\.keyword/)
assert.match(pageJs, /bindscrolltolower|onScrollToLower/)
assert.doesNotMatch(pageJs, /page:\s*1,\s*size:\s*20/)

const pageWxml = fs.readFileSync(path.join(__dirname, '../packageC/search/index.wxml'), 'utf8')
assert.match(pageWxml, /wx:key="searchKey"/)
assert.doesNotMatch(pageWxml, /wx:key="targetId"/)
assert.match(pageWxml, /找到 \{\{total\}\} 条与「\{\{activeKeyword\}\}」/)
assert.match(pageWxml, /bindscrolltolower="onScrollToLower"/)
assert.match(pageWxml, /加载更多失败，点击重试/)

console.log('search.test.js OK')
