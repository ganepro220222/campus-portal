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
  formatByteLimit,
  formatFileBadge,
  formatFileMetaLine,
  formatDurationClock,
  parseSubtitleCues
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

// ---------- 文件角标：分色 + 短标签 ----------
assert.deepEqual(formatFileBadge({ originalName: '选课指南.pdf' }), { label: 'PDF', tone: 'pdf' })
assert.deepEqual(formatFileBadge({ originalName: '讲义.docx' }), { label: 'DOC', tone: 'word' })
assert.deepEqual(formatFileBadge({ originalName: '课件.pptx' }), { label: 'PPT', tone: 'ppt' })
assert.deepEqual(formatFileBadge({ originalName: '名单.xlsx' }), { label: 'XLS', tone: 'excel' })
assert.deepEqual(formatFileBadge({ originalName: 'a.vtt' }), { label: 'VTT', tone: 'subtitle' })
// 库里没有原名时按 URL 后缀判断
assert.equal(formatFileBadge({ url: 'https://cdn/files/202609/abc.pdf' }).tone, 'pdf')
// 认不出的后缀不退回问号，截前 4 位当标签
assert.deepEqual(formatFileBadge({ originalName: 'a.rarext' }), { label: 'RARE', tone: 'generic' })
assert.deepEqual(formatFileBadge({}), { label: 'FILE', tone: 'generic' })

// ---------- 元信息行：大小 · 上传时间；都没有就整行不显示 ----------
assert.equal(formatFileMetaLine({ sizeBytes: 2_516_582, uploadedAt: '2026-09-01T14:20' }), '2.4 MB · 09-01 14:20')
assert.equal(formatFileMetaLine({ sizeBytes: 2_516_582 }), '2.4 MB')
assert.equal(formatFileMetaLine({ uploadedAt: '2026-09-01T14:20' }), '09-01 14:20')
assert.equal(formatFileMetaLine({}), '')
assert.equal(formatFileMetaLine({ sizeBytes: 0, uploadedAt: 'not-a-date' }), '')

// ---------- 时长：给「时长说明」自动回填 ----------
assert.equal(formatDurationClock(228), '03:48')
// 截断而非四舍五入：与原生播放器显示的总时长口径一致
assert.equal(formatDurationClock(227.9), '03:47')
assert.equal(formatDurationClock(3.75), '00:03')
assert.equal(formatDurationClock(59), '00:59')
assert.equal(formatDurationClock(3661), '1:01:01')
assert.equal(formatDurationClock(0), '')
assert.equal(formatDurationClock(NaN), '')
assert.equal(formatDurationClock(Infinity), '')

// ---------- 字幕：数条数 + 取前几条 ----------
{
  const vtt = [
    'WEBVTT',
    '',
    '00:00:01.200 --> 00:00:04.600',
    '各位同学好，欢迎来到本节课程。',
    '',
    '00:00:04.600 --> 00:00:09.100',
    '今天我们讲牙舟陶的窑变釉色。',
    '',
    '00:00:09.100 --> 00:00:12.000',
    '第三条。'
  ].join('\n')
  const parsed = parseSubtitleCues(vtt, 2)
  assert.equal(parsed.total, 3, '总条数要数全，不能只数取回来的那几条')
  assert.equal(parsed.cues.length, 2)
  assert.equal(parsed.cues[0].start, '00:00:01.200')
  assert.equal(parsed.cues[0].end, '00:00:04.600')
  assert.equal(parsed.cues[0].text, '各位同学好，欢迎来到本节课程。')
  assert.equal(parsed.cues[1].text, '今天我们讲牙舟陶的窑变釉色。')
}
{
  // SRT：序号行要跳过，毫秒用逗号
  const srt = '1\r\n00:00:01,200 --> 00:00:04,600\r\n第一条\r\n\r\n2\r\n00:00:05,000 --> 00:00:07,000\r\n第二条\r\n'
  const parsed = parseSubtitleCues(srt, 2)
  assert.equal(parsed.total, 2)
  assert.equal(parsed.cues[0].text, '第一条')
  assert.equal(parsed.cues[1].text, '第二条')
}
{
  // ASR 产了个空壳：能解析但一条时间轴都没有——正是要让老师看见的那种情况
  assert.deepEqual(parseSubtitleCues('WEBVTT\n\n'), { total: 0, cues: [] })
  assert.deepEqual(parseSubtitleCues(''), { total: 0, cues: [] })
  assert.deepEqual(parseSubtitleCues(null), { total: 0, cues: [] })
}
{
  // 有时间轴但没文本，也要计数并能渲染（前端显示「（本条无文本）」）
  const parsed = parseSubtitleCues('00:00:01.000 --> 00:00:02.000\n\n')
  assert.equal(parsed.total, 1)
  assert.equal(parsed.cues[0].text, '')
}
{
  // 多行文本合并成一行显示
  const parsed = parseSubtitleCues('00:00:01.000 --> 00:00:02.000\n上半句\n下半句\n')
  assert.equal(parsed.cues[0].text, '上半句 下半句')
}

console.log('test-admin-upload-meta: ok')
