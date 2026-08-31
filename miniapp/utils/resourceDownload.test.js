/**
 * 资源打开：Word/PPT 必须按真实后缀调用 openDocument
 * 运行：node miniapp/utils/resourceDownload.test.js
 */
const assert = require('assert')
const {
  normalizeType,
  extFromUrl,
  documentOpenType,
  resourceFileDownloadPath,
  classifyOpenError,
  canUseArrayBufferFallback,
  isLegacyDocumentCacheFile,
  urlHost,
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

assert.strictEqual(
  resourceFileDownloadPath(9, 'pdf'),
  '/resources/9/file/document.pdf'
)
assert.strictEqual(
  resourceFileDownloadPath('12', 'docx'),
  '/resources/12/file/document.docx'
)

assert.strictEqual(classifyOpenError('downloadFile:fail url not in domain list'), 'domain')
assert.strictEqual(classifyOpenError('the maximum size of the file storage limit is exceeded'), 'storage')
assert.strictEqual(classifyOpenError('downloadFile:fail timeout'), 'download')
assert.strictEqual(classifyOpenError('openDocument:fail filetype not supported'), 'open')

assert.strictEqual(canUseArrayBufferFallback(100), true)
assert.strictEqual(canUseArrayBufferFallback(8 * 1024), true)
assert.strictEqual(canUseArrayBufferFallback(8 * 1024 + 1), false)
assert.strictEqual(canUseArrayBufferFallback(50 * 1024), false)
assert.strictEqual(canUseArrayBufferFallback(0), false)
assert.strictEqual(canUseArrayBufferFallback(undefined), false)
assert.ok(ARRAYBUFFER_MAX_KB <= 8 * 1024)

assert.strictEqual(isLegacyDocumentCacheFile('dl_1788190000000.pdf'), true)
assert.strictEqual(isLegacyDocumentCacheFile('cdn_1788190000000.docx'), true)
assert.strictEqual(isLegacyDocumentCacheFile('res_1788190000000.PDF'), true)
assert.strictEqual(isLegacyDocumentCacheFile('avatar.jpg'), false)
assert.strictEqual(isLegacyDocumentCacheFile('dl_manual.pdf'), false)

assert.strictEqual(urlHost('https://cdn.yunmanvr.com/files/a.pdf?auth_key=x'), 'cdn.yunmanvr.com')
assert.strictEqual(urlHost('https://api.yunmanvr.com:443/api/v1/x'), 'api.yunmanvr.com:443')
assert.strictEqual(urlHost('wxfile://tmp/a.pdf'), '')

console.log('[resourceDownload.test] PASS')
