/**
 * 后台上传回填：格式 / 大小 / 时长换算。
 * 用法：node scripts/test-admin-upload-meta.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  inferResourceFileType,
  bytesToFileSizeKb,
  formatFileSizeKb,
  secondsToDurationMinutes,
  extractFileExtension,
  extractFileNameFromUrl,
  isStoredObjectFileName,
  formatUploadPreviewLabel,
  isDirectUploadCandidate,
  formatByteLimit
} from '../admin/src/utils/uploadMeta.mjs'
import { parseDirectPending, pendingForScene } from '../admin/src/utils/directPending.mjs'

assert.equal(extractFileExtension('手册.PDF'), 'pdf')
assert.equal(extractFileExtension('a/b/课件.pptx'), 'pptx')
assert.equal(extractFileExtension('noext'), '')

assert.equal(inferResourceFileType('a.pdf'), 'pdf')
assert.equal(inferResourceFileType('讲义.DOCX'), 'word')
assert.equal(inferResourceFileType('slides.ppt'), 'ppt')
assert.equal(inferResourceFileType('slides.pptx'), 'ppt')
assert.equal(inferResourceFileType('报名表.XLS'), 'xls')
assert.equal(inferResourceFileType('课程安排.xlsx'), 'xlsx')
assert.equal(inferResourceFileType('demo.mp4'), 'mp4')
assert.equal(inferResourceFileType('demo.mov'), 'mp4')
assert.equal(inferResourceFileType('guide.mp3'), 'mp3')
assert.equal(inferResourceFileType('guide.aac'), 'aac')
assert.equal(inferResourceFileType('guide.m4a'), 'm4a')
assert.equal(inferResourceFileType('readme.txt'), '')
assert.equal(inferResourceFileType(''), '')

assert.equal(isDirectUploadCandidate('video', 'lesson.mp4'), true)
assert.equal(isDirectUploadCandidate('resource_file', 'clip.MOV'), true)
assert.equal(isDirectUploadCandidate('image', 'cover.jpg'), false)
assert.equal(isDirectUploadCandidate('resource_file', 'notes.pdf'), false)
assert.equal(formatByteLimit(20 * 1024 * 1024), '20MB')
assert.equal(formatByteLimit(200 * 1024 * 1024), '200MB')
assert.equal(formatByteLimit(2 * 1024 * 1024 * 1024), '2GB')

const resourceApi = readFileSync(new URL('../admin/src/api/resource.ts', import.meta.url), 'utf8')
const resourceView = readFileSync(
  new URL('../admin/src/views/resource/ResourceListView.vue', import.meta.url),
  'utf8'
)
assert.match(resourceApi, /\{\s*value:\s*'xls',\s*label:\s*'Excel XLS'\s*\}/)
assert.match(resourceApi, /\{\s*value:\s*'xlsx',\s*label:\s*'Excel XLSX'\s*\}/)
assert.match(resourceView, /accept="[^"]*\.xls,\.xlsx[^"]*"/)
assert.match(resourceApi, /\{\s*value:\s*'aac',\s*label:\s*'音频 AAC'\s*\}/)
assert.match(resourceApi, /\{\s*value:\s*'m4a',\s*label:\s*'音频 M4A'\s*\}/)
assert.match(resourceView, /accept="[^"]*\.aac,\.m4a"/)

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

const uploadInput = readFileSync(new URL('../admin/src/components/OssUploadInput.vue', import.meta.url), 'utf8')
assert.match(uploadInput, /fetchDirectPolicy/)
assert.match(uploadInput, /postFileToOss/)
assert.match(uploadInput, /completeDirectUpload/)
assert.match(uploadInput, /重新确认/)
assert.match(uploadInput, /persistPending|DIRECT_PENDING_KEY/)
assert.match(uploadInput, /cancelOssUpload/)
const courseDialog = readFileSync(new URL('../admin/src/views/course/CourseEditDialog.vue', import.meta.url), 'utf8')
assert.doesNotMatch(courseDialog, /不超过 200MB/)
assert.match(resourceView, /\.mov/)
const adminCsp = readFileSync(new URL('../admin/index.html', import.meta.url), 'utf8')
assert.match(adminCsp, /connect-src[^"]*https:\/\/\*\.oss-cn-chengdu\.aliyuncs\.com/)
const hallDialog = readFileSync(new URL('../admin/src/views/hall/HallEditDialog.vue', import.meta.url), 'utf8')
assert.doesNotMatch(hallDialog, /accept="audio\/\*"/)
assert.match(hallDialog, /accept="[^"]*\.aac[^"]*"/)

assert.equal(parseDirectPending(''), null)
assert.equal(parseDirectPending('{"scene":"video"}'), null)
const pending = parseDirectPending(JSON.stringify({
  scene: 'video',
  objectKey: 'videos/202609/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4',
  size: 1024,
  fileName: 'a.mp4',
  uploadedAt: Date.now()
}))
assert.equal(pending?.scene, 'video')
assert.equal(pendingForScene(pending, 'resource_file'), null)
assert.equal(pendingForScene(pending, 'video')?.objectKey, pending?.objectKey)
const stale = parseDirectPending(JSON.stringify({
  scene: 'video',
  objectKey: 'videos/202609/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.mp4',
  size: 1024,
  fileName: 'a.mp4',
  uploadedAt: Date.now() - 49 * 60 * 60 * 1000
}))
assert.equal(stale, null)

console.log('test-admin-upload-meta: ok')
