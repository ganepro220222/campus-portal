/**
 * 详情封面 / 图库失败回退
 * 运行：node miniapp/utils/mediaFallback.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  IMAGE_RETRY_HINT,
  PREVIEW_FAIL_TOAST,
  markItemCoverFailed,
  itemCoverFailedPatch,
  applyItemCoverFailed,
  markIndexedImageFailed,
  retryIndexedImage,
  usableImageUrls,
  markNestedImageFailed,
  retryNestedImage,
  replaceField,
  slideCaption,
  previewImages
} = require('./mediaFallback')

const article = { id: 1, cover: 'https://cdn/n.jpg', title: '动态' }
const failedArticle = markItemCoverFailed(article, 'https://cdn/n.jpg')
assert.notStrictEqual(failedArticle, article)
assert.strictEqual(failedArticle.coverFailed, true)
assert.strictEqual(failedArticle.cover, 'https://cdn/n.jpg')
assert.strictEqual(markItemCoverFailed(article, 'https://cdn/stale.jpg'), article)
assert.strictEqual(markItemCoverFailed(failedArticle, 'https://cdn/n.jpg'), failedArticle)

assert.strictEqual(itemCoverFailedPatch({ article }, 'newsList', 'https://cdn/n.jpg'), null)
assert.strictEqual(
  itemCoverFailedPatch({ article }, 'article', 'https://cdn/n.jpg').article.coverFailed,
  true
)

let setCount = 0
const page = {
  data: { detail: { cover: 'https://cdn/a.jpg', title: '活动' } },
  setData(p) {
    setCount += 1
    Object.assign(this.data, p)
  }
}
assert.strictEqual(applyItemCoverFailed(page, 'detail', {
  currentTarget: { dataset: { cover: 'https://cdn/a.jpg' } }
}), true)
assert.strictEqual(page.data.detail.coverFailed, true)
assert.strictEqual(applyItemCoverFailed(page, 'detail', {
  currentTarget: { dataset: { cover: 'https://cdn/a.jpg' } }
}), false)
assert.strictEqual(setCount, 1)
assert.strictEqual(applyItemCoverFailed(page, 'article', {
  currentTarget: { dataset: { cover: 'https://cdn/a.jpg' } }
}), false)

const slides = [
  { imageUrl: 'https://cdn/1.jpg', caption: '一', icon: 'museum' },
  { imageUrl: 'https://cdn/2.jpg', caption: '二', icon: 'museum' }
]
assert.strictEqual(markIndexedImageFailed(slides, 9, 'https://cdn/1.jpg'), slides)
assert.strictEqual(markIndexedImageFailed(slides, 0, 'https://cdn/stale.jpg'), slides)
const slideFailed = markIndexedImageFailed(slides, '0', 'https://cdn/1.jpg')
assert.strictEqual(slideFailed[0].imageFailed, true)
assert.strictEqual(slideFailed[0].imageUrl, 'https://cdn/1.jpg')
assert.ok(!slideFailed[1].imageFailed)
assert.deepStrictEqual(usableImageUrls(slideFailed), ['https://cdn/2.jpg'])

const retried = retryIndexedImage(slideFailed, 0)
assert.strictEqual(retried[0].imageFailed, false)
assert.strictEqual(retried[0].imageEpoch, 1)
assert.strictEqual(retryIndexedImage(slides, 0), slides)

const staleEpoch = markIndexedImageFailed(retried, 0, 'https://cdn/1.jpg', 0)
assert.strictEqual(staleEpoch, retried)
const currentEpochFail = markIndexedImageFailed(retried, 0, 'https://cdn/1.jpg', 1)
assert.strictEqual(currentEpochFail[0].imageFailed, true)

const sections = [{
  anchorId: 'section-1',
  items: [
    { imageUrl: 'https://cdn/s.jpg', caption: '章', icon: 'museum' }
  ]
}]
const nestedFailed = markNestedImageFailed(sections, 0, 0, 'https://cdn/s.jpg')
assert.strictEqual(nestedFailed[0].items[0].imageFailed, true)
assert.strictEqual(markNestedImageFailed(sections, 0, 0, 'https://cdn/other.jpg'), sections)
const nestedRetry = retryNestedImage(nestedFailed, 0, 0)
assert.strictEqual(nestedRetry[0].items[0].imageFailed, false)
assert.strictEqual(nestedRetry[0].items[0].imageEpoch, 1)

const hall = { name: '校史馆', slides, caption: '左右滑动' }
const hallNext = replaceField(hall, 'slides', slideFailed)
assert.strictEqual(hallNext.slides, slideFailed)
assert.strictEqual(hallNext.name, '校史馆')
assert.strictEqual(replaceField(hall, 'slides', slides), hall)

assert.strictEqual(slideCaption({ caption: '一' }, '兜底'), '一')
assert.strictEqual(slideCaption({ imageFailed: true, caption: '一' }, '兜底'), IMAGE_RETRY_HINT)
assert.strictEqual(slideCaption(null, '兜底'), '兜底')

const toasts = []
const previews = []
const wxApi = {
  showToast(opts) { toasts.push(opts.title) },
  previewImage(opts) {
    previews.push(opts)
    if (typeof opts.fail === 'function') this._fail = opts.fail
  }
}
assert.strictEqual(previewImages(wxApi, ['https://cdn/1.jpg', 'https://cdn/2.jpg'], 'https://cdn/2.jpg'), true)
assert.deepStrictEqual(previews[0].urls, ['https://cdn/1.jpg', 'https://cdn/2.jpg'])
assert.strictEqual(previews[0].current, 'https://cdn/2.jpg')
previews[0].fail()
assert.strictEqual(toasts[0], PREVIEW_FAIL_TOAST)
assert.strictEqual(previewImages(wxApi, [], 'https://cdn/1.jpg'), false)
assert.strictEqual(toasts[1], '暂无可以查看的图片')
assert.strictEqual(previewImages(wxApi, ['https://cdn/1.jpg'], 'https://cdn/missing.jpg'), true)
assert.strictEqual(previews[1].current, 'https://cdn/1.jpg')

function readMini(rel) {
  return fs.readFileSync(path.join(__dirname, '..', rel), 'utf8')
}

const activityWxml = readMini('packageC/activity/detail.wxml')
assert.match(activityWxml, /detail\.cover && !detail\.coverFailed/)
assert.match(activityWxml, /binderror="onCoverError"/)
assert.match(readMini('packageC/activity/detail.js'), /applyItemCoverFailed\(this, 'detail', e\)/)

const newsWxml = readMini('packageA/news/detail.wxml')
assert.match(newsWxml, /article\.cover && !article\.coverFailed/)
assert.match(newsWxml, /binderror="onCoverError"/)
assert.match(newsWxml, /art-hero-deco/)
assert.match(readMini('packageA/news/detail.js'), /applyItemCoverFailed\(this, 'article', e\)/)

const craftWxml = readMini('packageA/craft/detail.wxml')
assert.match(craftWxml, /item\.imageUrl && !item\.imageFailed/)
assert.match(craftWxml, /binderror="onSlideError"/)
assert.match(craftWxml, /图片加载失败，点击重试/)
assert.match(readMini('packageA/craft/detail.js'), /previewImages\(/)
assert.match(readMini('packageA/craft/detail.js'), /retryIndexedImage/)

const hallWxml = readMini('packageA/hall/detail.wxml')
assert.match(hallWxml, /item\.imageUrl && !item\.imageFailed/)
assert.match(hallWxml, /media\.imageUrl && !media\.imageFailed/)
assert.match(hallWxml, /binderror="onSlideError"/)
assert.match(hallWxml, /binderror="onSectionImageError"/)
assert.match(hallWxml, /wx:for-index="sidx"/)
assert.match(hallWxml, /class="imm-sec-num">\{\{sidx \+ 1\}\}/)
assert.doesNotMatch(hallWxml, /class="imm-sec-num">\{\{index \+ 1\}\}/)
assert.match(readMini('packageA/hall/detail.js'), /previewImages\(/)
assert.match(readMini('packageA/hall/detail.js'), /retryNestedImage/)
assert.match(readMini('packageA/hall/detail.js'), /IMAGE_RETRY_HINT/)

const homeWxml = readMini('pages/index/index.wxml')
assert.match(homeWxml, /data-list="banners"/)
assert.match(homeWxml, /data-list="hallList"/)
assert.match(homeWxml, /data-list="newsList"/)
assert.match(homeWxml, /data-list="courseList"/)

console.log('[mediaFallback.test] PASS')
