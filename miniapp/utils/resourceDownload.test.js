/**
 * 资源打开：Word/PPT 必须按真实后缀调用 openDocument
 * 运行：node miniapp/utils/resourceDownload.test.js
 */
const assert = require('assert')
const {
  normalizeType,
  extFromUrl,
  documentOpenType,
  namedTempPath,
  classifyOpenError,
  canUseArrayBufferFallback,
  ARRAYBUFFER_MAX_KB
} = require('./resourceDownload')

assert.strictEqual(normalizeType('word'), 'doc')
assert.strictEqual(normalizeType('PDF'), 'pdf')

assert.strictEqual(extFromUrl('https://cdn.yunmanvr.com/files/202608/abc.docx'), 'docx')
assert.strictEqual(extFromUrl('https://cdn.yunmanvr.com/files/a.pdf?x=1'), 'pdf')
assert.strictEqual(extFromUrl('https://cdn.yunmanvr.com/files/a.pptx'), 'pptx')

assert.strictEqual(
  documentOpenType('word', 'https://cdn.yunmanvr.com/files/202608/abc.docx'),
  'docx'
)
assert.strictEqual(
  documentOpenType('word', 'https://cdn.yunmanvr.com/files/202608/old.doc'),
  'doc'
)
assert.strictEqual(
  documentOpenType('ppt', 'https://cdn.yunmanvr.com/files/202608/slides.pptx'),
  'pptx'
)
assert.strictEqual(
  documentOpenType('pdf', 'https://cdn.yunmanvr.com/files/202608/a.pdf'),
  'pdf'
)
assert.strictEqual(documentOpenType('word', ''), 'docx')

assert.strictEqual(namedTempPath('wxfile://tmp_abc', 'docx'), 'wxfile://tmp_abc.docx')
assert.strictEqual(namedTempPath('wxfile://tmp_abc.pdf', 'pdf'), 'wxfile://tmp_abc.pdf')
assert.strictEqual(namedTempPath('', 'pdf'), '')

assert.strictEqual(classifyOpenError('downloadFile:fail url not in domain list'), 'domain')
assert.strictEqual(classifyOpenError('downloadFile:fail timeout'), 'download')
assert.strictEqual(classifyOpenError('openDocument:fail filetype not supported'), 'open')

assert.strictEqual(canUseArrayBufferFallback(100), true)
assert.strictEqual(canUseArrayBufferFallback(8 * 1024), true)
assert.strictEqual(canUseArrayBufferFallback(8 * 1024 + 1), false)
assert.strictEqual(canUseArrayBufferFallback(50 * 1024), false)
assert.strictEqual(canUseArrayBufferFallback(0), false)
assert.strictEqual(canUseArrayBufferFallback(undefined), false)
assert.ok(ARRAYBUFFER_MAX_KB <= 8 * 1024)

console.log('[resourceDownload.test] PASS')
