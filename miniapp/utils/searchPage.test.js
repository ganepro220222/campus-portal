/**
 * 搜索页状态机：输入草稿不得把新词第 N 页追加到旧词列表。
 * 运行：node miniapp/utils/searchPage.test.js
 */
const assert = require('assert')

const requestPath = require.resolve('./request')
const mockGuardPath = require.resolve('./mockGuard')
const pagePath = require.resolve('../packageC/search/index.js')
const originalRequestCache = require.cache[requestPath]
const originalMockGuardCache = require.cache[mockGuardPath]
const originalPageCache = require.cache[pagePath]
const originalPage = global.Page
const originalWx = global.wx

const gets = []
let getHandler = () => Promise.resolve({ records: [], total: 0 })

require.cache[requestPath] = {
  id: requestPath,
  filename: requestPath,
  loaded: true,
  exports: {
    get(url, data) {
      gets.push({ url, data })
      return getHandler(url, data)
    }
  }
}
require.cache[mockGuardPath] = {
  id: mockGuardPath,
  filename: mockGuardPath,
  loaded: true,
  exports: { useMock: false }
}

let pageDef = null
global.Page = (def) => {
  pageDef = def
}
global.wx = {
  getStorageSync() { return [] },
  setStorageSync() {},
  showToast() {},
  navigateTo() {}
}

delete require.cache[pagePath]
require('../packageC/search/index.js')
assert.ok(pageDef && typeof pageDef._searchFirst === 'function')

function cloneData(data) {
  return JSON.parse(JSON.stringify(data))
}

function createPage() {
  const page = {
    data: cloneData(pageDef.data),
    _listGeneration: 0
  }
  Object.keys(pageDef).forEach((key) => {
    if (typeof pageDef[key] === 'function') {
      page[key] = pageDef[key]
    }
  })
  page.setData = function setData(patch) {
    Object.assign(this.data, patch)
  }
  return page
}

function recordsFor(q, page, count) {
  const start = (page - 1) * 20
  return new Array(count).fill(0).map((_, i) => ({
    targetType: 'news',
    targetId: start + i + 1,
    title: q + '-' + (start + i + 1),
    typeLabel: '动态'
  }))
}

function lastGet() {
  return gets[gets.length - 1]
}

async function run() {
  const page = createPage()

  getHandler = (_url, data) => {
    if (data.q === '课程' && data.page === 1) {
      return Promise.resolve({ records: recordsFor('课程', 1, 20), total: 40 })
    }
    if (data.q === '课程' && data.page === 2) {
      return Promise.resolve({ records: recordsFor('课程', 2, 20), total: 40 })
    }
    if (data.q === '文化' && data.page === 1) {
      return Promise.resolve({ records: recordsFor('文化', 1, 8), total: 8 })
    }
    if (data.q === '文化' && data.page === 2) {
      return Promise.resolve({ records: recordsFor('文化', 2, 8), total: 8 })
    }
    return Promise.resolve({ records: [], total: 0 })
  }

  await page._searchFirst('课程')
  assert.strictEqual(page.data.activeKeyword, '课程')
  assert.strictEqual(page.data.keyword, '课程')
  assert.strictEqual(page.data.results.length, 20)
  assert.strictEqual(page.data.page, 2)
  assert.strictEqual(page.data.hasMore, true)
  assert.strictEqual(page.data.results[0].title, '课程-1')
  assert.strictEqual(lastGet().data.q, '课程')
  assert.strictEqual(lastGet().data.page, 1)

  page.onInput({ detail: { value: '文化' } })
  assert.strictEqual(page.data.keyword, '文化')
  assert.strictEqual(page.data.activeKeyword, '课程')
  assert.strictEqual(page.data.results[0].title, '课程-1')

  const before = gets.length
  await page._loadMore(false)
  assert.strictEqual(gets.length, before + 1)
  assert.strictEqual(lastGet().data.q, '课程', '未提交时不得请求新词')
  assert.strictEqual(lastGet().data.page, 2)
  assert.strictEqual(page.data.results.length, 40)
  assert.strictEqual(page.data.results[0].title, '课程-1')
  assert.ok(page.data.results.every((row) => row.title.indexOf('课程-') === 0))
  assert.strictEqual(page.data.activeKeyword, '课程')
  assert.strictEqual(page.data.keyword, '文化')

  page.onInput({ detail: { value: '课程' } })
  const mid = gets.length
  await page._loadMore(false)
  assert.strictEqual(gets.length, mid, '已无更多时，改回原词也不该再请求')

  await page._searchFirst('文化')
  assert.strictEqual(page.data.activeKeyword, '文化')
  assert.strictEqual(page.data.keyword, '文化')
  assert.strictEqual(page.data.page, 2)
  assert.strictEqual(page.data.results.length, 8)
  assert.strictEqual(page.data.results[0].title, '文化-1')
  assert.ok(page.data.results.every((row) => row.title.indexOf('文化-') === 0))
  assert.strictEqual(lastGet().data.q, '文化')
  assert.strictEqual(lastGet().data.page, 1)

  let releaseMore
  const heldMore = new Promise((resolve) => { releaseMore = resolve })
  getHandler = (_url, data) => {
    if (data.q === '课程' && data.page === 2) {
      return heldMore.then(() => ({ records: recordsFor('课程', 2, 20), total: 40 }))
    }
    if (data.q === '文化' && data.page === 1) {
      return Promise.resolve({ records: recordsFor('文化', 1, 8), total: 8 })
    }
    return Promise.resolve({ records: [], total: 0 })
  }
  const racing = createPage()
  racing.setData({
    keyword: '课程',
    activeKeyword: '课程',
    results: recordsFor('课程', 1, 20),
    total: 40,
    page: 2,
    hasMore: true,
    searched: true
  })
  const moreP = racing._loadMore(false)
  await racing._searchFirst('文化')
  releaseMore({ records: recordsFor('课程', 2, 20), total: 40 })
  await moreP
  assert.strictEqual(racing.data.activeKeyword, '文化')
  assert.strictEqual(racing.data.results[0].title, '文化-1')
  assert.ok(racing.data.results.every((row) => row.title.indexOf('文化-') === 0),
    '加载更多进行中提交新搜索，旧页不得追加进来')

  let releaseFirst
  const heldFirst = new Promise((resolve) => { releaseFirst = resolve })
  getHandler = () => heldFirst.then(() => ({ records: recordsFor('课程', 1, 20), total: 40 }))
  const typing = createPage()
  const firstP = typing._searchFirst('课程')
  typing.onInput({ detail: { value: '文化' } })
  releaseFirst()
  await firstP
  assert.strictEqual(typing.data.activeKeyword, '课程')
  assert.strictEqual(typing.data.keyword, '文化')
  assert.strictEqual(typing.data.results[0].title, '课程-1')

  let failOnce = true
  getHandler = (_url, data) => {
    if (data.q === '课程' && data.page === 2) {
      if (failOnce) {
        failOnce = false
        return Promise.reject(new Error('timeout'))
      }
      return Promise.resolve({ records: recordsFor('课程', 2, 20), total: 40 })
    }
    return Promise.resolve({ records: recordsFor('课程', 1, 20), total: 40 })
  }
  const retrying = createPage()
  await retrying._searchFirst('课程')
  await retrying._loadMore(false)
  assert.strictEqual(retrying.data.loadMoreError, true)
  assert.strictEqual(retrying.data.results.length, 20)
  retrying.onInput({ detail: { value: '文化' } })
  await retrying._loadMore(true)
  assert.strictEqual(lastGet().data.q, '课程', '分页失败后改输入再点重试，仍应要旧词下一页')
  assert.strictEqual(lastGet().data.page, 2)
  assert.strictEqual(retrying.data.results.length, 40)
  assert.ok(retrying.data.results.every((row) => row.title.indexOf('课程-') === 0))

  console.log('searchPage.test.js OK')
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    global.Page = originalPage
    global.wx = originalWx
    if (originalRequestCache) require.cache[requestPath] = originalRequestCache
    else delete require.cache[requestPath]
    if (originalMockGuardCache) require.cache[mockGuardPath] = originalMockGuardCache
    else delete require.cache[mockGuardPath]
    if (originalPageCache) require.cache[pagePath] = originalPageCache
    else delete require.cache[pagePath]
  })
