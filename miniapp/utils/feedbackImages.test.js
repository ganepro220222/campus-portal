/**
 * 意见反馈附图工具单测
 * 运行：node miniapp/utils/feedbackImages.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  MAX_IMAGES,
  isHttpUrl,
  normalizeUploadedUrl,
  buildSubmitImages,
  remainingSlots,
  failedImageCount,
  gateFeedbackSubmit,
  buildSubmitImagesOmittingFailed,
  resolveFeedbackSubmitToast,
  canRetryFeedbackImage,
  retryFeedbackImagePatch
} = require('./feedbackImages')

assert.strictEqual(MAX_IMAGES, 9)
assert.strictEqual(isHttpUrl(''), false)
assert.strictEqual(isHttpUrl('/local.jpg'), false)
assert.strictEqual(isHttpUrl('https://cdn.example.com/a.jpg'), true)
assert.strictEqual(isHttpUrl('http://127.0.0.1/x.png'), true)

assert.strictEqual(normalizeUploadedUrl(null), '')
assert.strictEqual(normalizeUploadedUrl({ url: 'ftp://x' }), '')
assert.strictEqual(normalizeUploadedUrl({ url: 'https://cdn/a.webp' }), 'https://cdn/a.webp')

assert.deepStrictEqual(buildSubmitImages([
  { url: 'https://cdn/a.jpg' },
  { url: 'bad' },
  { url: 'http://cdn/b.png' }
]), ['https://cdn/a.jpg', 'http://cdn/b.png'])

assert.deepStrictEqual(
  buildSubmitImages(Array.from({ length: 12 }, (_, i) => ({ url: `https://cdn/${i}.jpg` }))).length,
  9
)

assert.strictEqual(remainingSlots(0), 9)
assert.strictEqual(remainingSlots(9), 0)
assert.strictEqual(remainingSlots(12), 0)

const ready = { id: 'a', url: 'https://cdn/ok.jpg', uploading: false, failed: false, localPath: '/tmp/a.jpg' }
const uploading = { id: 'b', url: '', uploading: true, failed: false, localPath: '/tmp/b.jpg' }
const failed = { id: 'c', url: '', uploading: false, failed: true, localPath: '/tmp/c.jpg' }

assert.strictEqual(failedImageCount([ready, failed, { ...failed, uploading: true }]), 1)
assert.deepStrictEqual(gateFeedbackSubmit([uploading, failed]), { kind: 'wait' })
assert.deepStrictEqual(gateFeedbackSubmit([ready, failed]), { kind: 'failed', failedCount: 1 })
assert.deepStrictEqual(gateFeedbackSubmit([ready]), { kind: 'ok', imageUrls: ['https://cdn/ok.jpg'] })
assert.deepStrictEqual(gateFeedbackSubmit([]), { kind: 'ok', imageUrls: [] })

assert.deepStrictEqual(
  buildSubmitImagesOmittingFailed([ready, failed, { ...ready, url: 'https://cdn/2.jpg' }]),
  ['https://cdn/ok.jpg', 'https://cdn/2.jpg']
)
assert.deepStrictEqual(buildSubmitImagesOmittingFailed([failed]), [])

assert.deepStrictEqual(resolveFeedbackSubmitToast(0), { title: '感谢反馈，已提交', icon: 'success' })
assert.deepStrictEqual(resolveFeedbackSubmitToast(2), {
  title: '反馈已提交，2 张失败图片未包含',
  icon: 'none',
  duration: 2500
})

assert.strictEqual(canRetryFeedbackImage(failed, false), true)
assert.strictEqual(canRetryFeedbackImage(failed, true), false)
assert.strictEqual(canRetryFeedbackImage(uploading, false), false)
assert.strictEqual(canRetryFeedbackImage(ready, false), false)
assert.strictEqual(canRetryFeedbackImage({ ...failed, localPath: '' }, false), false)
assert.deepStrictEqual(retryFeedbackImagePatch(), { uploading: true, failed: false, url: '' })

const pageJs = fs.readFileSync(path.join(__dirname, '../packageC/feedback/index.js'), 'utf8')
assert.match(pageJs, /gateFeedbackSubmit/)
assert.match(pageJs, /onRetryImage/)
assert.match(pageJs, /confirmText:\s*'继续提交'/)
assert.doesNotMatch(pageJs, /images\.filter\(\s*it\s*=>\s*!it\.failed\s*\)/)

const pageWxml = fs.readFileSync(path.join(__dirname, '../packageC/feedback/index.wxml'), 'utf8')
assert.match(pageWxml, /onRetryImage/)
assert.match(pageWxml, /点此重试/)

console.log('[feedbackImages.test] PASS')
