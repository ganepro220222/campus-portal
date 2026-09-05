/**
 * 页面分享参数单测
 * 运行：node miniapp/utils/pageShare.test.js
 */
const assert = require('assert')
const {
  buildShareAppMessage,
  buildShareTimeline,
  pickShareImage
} = require('./pageShare')

const home = buildShareAppMessage({ title: '云端书院', path: '/pages/index/index' })
assert.strictEqual(home.title, '云端书院')
assert.strictEqual(home.path, '/pages/index/index')
assert.strictEqual(home.imageUrl, undefined)

const withCover = buildShareAppMessage({
  title: '陶瓷课',
  path: '/packageB/course/detail?id=3',
  imageUrl: 'https://cdn/c.jpg'
})
assert.strictEqual(withCover.path, '/packageB/course/detail?id=3')
assert.strictEqual(withCover.imageUrl, 'https://cdn/c.jpg')

const fallback = buildShareAppMessage(null)
assert.strictEqual(fallback.title, '云端书院')
assert.strictEqual(fallback.path, '/pages/index/index')

const tl = buildShareTimeline({ title: '书院动态' })
assert.strictEqual(tl.title, '书院动态')
assert.strictEqual(tl.query, '')

const tlQuery = buildShareTimeline({ title: '讲座', query: 'id=8' })
assert.strictEqual(tlQuery.query, 'id=8')

assert.strictEqual(pickShareImage({ cover: 'https://cdn/a.jpg' }), 'https://cdn/a.jpg')
assert.strictEqual(pickShareImage({ image: 'https://cdn/b.jpg' }), 'https://cdn/b.jpg')
assert.strictEqual(pickShareImage(''), '')

const fs = require('fs')
const path = require('path')
const root = path.join(__dirname, '..')
const mustShare = [
  'pages/index/index.js',
  'pages/news/index.js',
  'pages/hall/index.js',
  'pages/course/index.js',
  'pages/activity/index.js',
  'packageB/course/detail.js',
  'packageC/activity/detail.js',
  'packageC/about/index.js'
]
for (const rel of mustShare) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8')
  assert.ok(src.includes('onShareAppMessage'), `${rel} 应接转发好友`)
  assert.ok(src.includes('onShareTimeline'), `${rel} 应接分享朋友圈`)
}
for (const rel of ['packageA/hall/detail.js', 'packageA/craft/detail.js']) {
  const src = fs.readFileSync(path.join(root, rel), 'utf8')
  assert.ok(!src.includes('onShareAppMessage'), `${rel} 已有海报，不应再接原生转发`)
}

console.log('[pageShare.test] PASS')
