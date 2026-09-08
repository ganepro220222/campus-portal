/**
 * 列表封面失败回退
 * 运行：node miniapp/utils/coverFallback.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  coverUrlOf,
  markCoverFailed,
  coverFailedPatch,
  applyCoverFailed
} = require('./coverFallback')
const { decorateNewsFeed } = require('./decorate')

const sample = [
  { id: 1, cover: 'https://cdn/a.jpg', icon: 'file' },
  { id: 2, cover: 'https://cdn/b.jpg', icon: 'flag' }
]

assert.strictEqual(coverUrlOf({ cover: 'https://cdn/a.jpg' }), 'https://cdn/a.jpg')
assert.strictEqual(coverUrlOf({ imageUrl: 'https://cdn/b.jpg' }), 'https://cdn/b.jpg')

const marked = markCoverFailed(sample, 1, 'https://cdn/a.jpg')
assert.notStrictEqual(marked, sample)
assert.strictEqual(marked[0].coverFailed, true)
assert.strictEqual(marked[0].cover, 'https://cdn/a.jpg')
assert.ok(!marked[1].coverFailed)

assert.strictEqual(markCoverFailed(sample, '', 'https://cdn/a.jpg'), sample)
assert.strictEqual(markCoverFailed(sample, 1, 'https://cdn/stale.jpg'), sample)
assert.strictEqual(markCoverFailed(marked, 1, 'https://cdn/a.jpg'), marked)

const numId = markCoverFailed([{ id: '9', cover: 'u' }], 9, 'u')
assert.strictEqual(numId[0].coverFailed, true)

const byIdOnly = markCoverFailed(sample, 2)
assert.strictEqual(byIdOnly[1].coverFailed, true)

assert.strictEqual(coverFailedPatch({ newsList: sample }, 'unknownList', 1, 'https://cdn/a.jpg'), null)
assert.deepStrictEqual(
  coverFailedPatch({ newsList: sample }, 'newsList', 1, 'https://cdn/a.jpg').newsList[0].coverFailed,
  true
)

let setCount = 0
const page = {
  data: { newsList: sample },
  setData(p) {
    setCount += 1
    Object.assign(this.data, p)
  }
}
assert.strictEqual(applyCoverFailed(page, 'newsList', {
  currentTarget: { dataset: { id: 1, cover: 'https://cdn/a.jpg' } }
}), true)
assert.strictEqual(page.data.newsList[0].coverFailed, true)
assert.strictEqual(applyCoverFailed(page, 'newsList', {
  currentTarget: { dataset: { id: 1, cover: 'https://cdn/a.jpg' } }
}), false)
assert.strictEqual(setCount, 1)

const home = {
  data: {
    newsList: [{ id: 3, cover: 'https://cdn/n.jpg' }],
    courseList: [{ id: 3, cover: 'https://cdn/c.jpg' }]
  },
  setData(p) { Object.assign(this.data, p) }
}
assert.strictEqual(applyCoverFailed(home, '', {
  currentTarget: { dataset: { list: 'courseList', id: 3, cover: 'https://cdn/c.jpg' } }
}), true)
assert.ok(home.data.courseList[0].coverFailed)
assert.ok(!home.data.newsList[0].coverFailed)

const refreshed = decorateNewsFeed([{ id: 1, cover: 'https://cdn/new.jpg', readCount: 12 }])
assert.ok(!refreshed[0].coverFailed)
assert.strictEqual(refreshed[0].coverImageMode, 'aspectFill')

const keepFlag = decorateNewsFeed([{ id: 1, cover: 'https://cdn/a.jpg', coverFailed: true }])[0]
assert.strictEqual(keepFlag.coverFailed, true)

function readMini(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8')
}

function assertCardCoverFallback(wxml) {
  assert.match(wxml, /item\.cover && !item\.coverFailed/)
  assert.match(wxml, /src="\{\{item\.cover\}\}"/)
  assert.match(wxml, /coverImageMode/)
  assert.match(wxml, /binderror="onCoverError"/)
  assert.match(wxml, /data-cover="\{\{item\.cover\}\}"/)
}

assertCardCoverFallback(readMini('pages/news/index.wxml'))
assert.match(readMini('pages/news/index.wxss'), /overflow:\s*hidden/)
assertCardCoverFallback(readMini('packageA/news/list.wxml'))
assertCardCoverFallback(readMini('pages/index/index.wxml'))
assertCardCoverFallback(readMini('pages/course/index.wxml'))
assertCardCoverFallback(readMini('pages/activity/index.wxml'))
assert.match(readMini('pages/hall/index.wxml'), /item\.cover && !item\.coverFailed/)
assert.match(readMini('pages/hall/index.wxml'), /binderror="onCoverError"/)
assert.match(readMini('packageA/craft/list.wxml'), /item\.cover && !item\.coverFailed/)
assert.match(readMini('packageA/craft/list.wxml'), /binderror="onCoverError"/)
assert.match(readMini('pages/index/index.wxml'), /item\.imageUrl && !item\.coverFailed/)
assert.match(readMini('pages/index/index.wxml'), /data-list="banners"/)
assert.match(readMini('pages/index/index.wxml'), /data-list="hallList"/)
assert.match(readMini('pages/index/index.wxml'), /data-list="newsList"/)
assert.match(readMini('pages/index/index.wxml'), /data-list="courseList"/)
assert.match(readMini('pages/index/index.js'), /applyCoverFailed\(this, null, e\)/)
assert.match(readMini('pages/news/index.js'), /applyCoverFailed\(this, 'newsList', e\)/)

console.log('[coverFallback.test] PASS')
