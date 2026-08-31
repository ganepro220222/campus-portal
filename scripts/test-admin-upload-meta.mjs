/**
 * 后台上传回填：格式 / 大小 / 时长换算。
 * 用法：node scripts/test-admin-upload-meta.mjs
 */
import assert from 'node:assert/strict'
import {
  inferResourceFileType,
  bytesToFileSizeKb,
  formatFileSizeKb,
  secondsToDurationMinutes,
  extractFileExtension,
  extractFileNameFromUrl,
  isStoredObjectFileName,
  formatUploadPreviewLabel
} from '../admin/src/utils/uploadMeta.mjs'

assert.equal(extractFileExtension('手册.PDF'), 'pdf')
assert.equal(extractFileExtension('a/b/课件.pptx'), 'pptx')
assert.equal(extractFileExtension('noext'), '')

assert.equal(inferResourceFileType('a.pdf'), 'pdf')
assert.equal(inferResourceFileType('讲义.DOCX'), 'word')
assert.equal(inferResourceFileType('slides.ppt'), 'ppt')
assert.equal(inferResourceFileType('slides.pptx'), 'ppt')
assert.equal(inferResourceFileType('demo.mp4'), 'mp4')
assert.equal(inferResourceFileType('guide.mp3'), 'mp3')
assert.equal(inferResourceFileType('readme.txt'), '')
assert.equal(inferResourceFileType(''), '')

assert.equal(bytesToFileSizeKb(15674 * 1024), 15674)
assert.equal(bytesToFileSizeKb(1024), 1)
assert.equal(bytesToFileSizeKb(100), 1)
assert.equal(bytesToFileSizeKb(0), undefined)
assert.equal(bytesToFileSizeKb(-1), undefined)

assert.equal(formatFileSizeKb(150), '150 KB')
assert.equal(formatFileSizeKb(1536), '1.5 MB')
assert.equal(formatFileSizeKb(undefined), '')

assert.equal(secondsToDurationMinutes(25 * 60), 25)
assert.equal(secondsToDurationMinutes(25 * 60 + 20), 25)
assert.equal(secondsToDurationMinutes(45), 1)
assert.equal(secondsToDurationMinutes(0), undefined)
assert.equal(secondsToDurationMinutes(NaN), undefined)

assert.equal(extractFileNameFromUrl('https://cdn.yunmanvr.com/files/202608/abc.docx'), 'abc.docx')
assert.equal(isStoredObjectFileName('20a01a4ebcac406b8bb42c2d00e5894b.docx'), true)
assert.equal(isStoredObjectFileName('手工技艺入门读本.doc'), false)
assert.equal(
  formatUploadPreviewLabel({ url: 'https://cdn.yunmanvr.com/files/202608/20a01a4ebcac406b8bb42c2d00e5894b.docx' }),
  'Word 文档'
)
assert.equal(
  formatUploadPreviewLabel({
    url: 'https://cdn.yunmanvr.com/files/202608/20a01a4ebcac406b8bb42c2d00e5894b.docx',
    originalName: '手工技艺入门读本.doc'
  }),
  '手工技艺入门读本.doc'
)
assert.equal(
  formatUploadPreviewLabel({
    url: 'https://cdn.yunmanvr.com/audios/202608/aaaabbbbccccddddeeeeffff00001111.mp3',
    displayName: '语音讲解'
  }),
  '语音讲解'
)

console.log('test-admin-upload-meta: ok')
