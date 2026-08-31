/**
 * 资源打开：Word/PPT 必须按真实后缀调用 openDocument
 * 运行：node miniapp/utils/resourceDownload.test.js
 */
const assert = require('assert')
const {
  normalizeType,
  extFromUrl,
  documentOpenType,
  classifyOpenError,
  isLegacyDocumentCacheFile,
  responseHeader,
  parseContentRange,
  isSignedSourceUrl,
  FILE_CHUNK_BYTES,
  MAX_CHUNK_FILE_BYTES
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

assert.strictEqual(classifyOpenError('downloadFile:fail url not in domain list'), 'domain')
assert.strictEqual(classifyOpenError('the maximum size of the file storage limit is exceeded'), 'storage')
assert.strictEqual(classifyOpenError('downloadFile:fail timeout'), 'download')
assert.strictEqual(classifyOpenError('chunk-total-missing'), 'download')
assert.strictEqual(classifyOpenError('openDocument:fail filetype not supported'), 'open')

assert.strictEqual(isLegacyDocumentCacheFile('dl_1788190000000.pdf'), true)
assert.strictEqual(isLegacyDocumentCacheFile('cdn_1788190000000.docx'), true)
assert.strictEqual(isLegacyDocumentCacheFile('res_1788190000000.PDF'), true)
assert.strictEqual(isLegacyDocumentCacheFile('avatar.jpg'), false)
assert.strictEqual(isLegacyDocumentCacheFile('dl_manual.pdf'), false)

assert.strictEqual(responseHeader({ 'X-File-Size': '32356' }, 'x-file-size'), '32356')
assert.strictEqual(responseHeader({ 'x-file-size': '32356' }, 'X-File-Size'), '32356')
assert.strictEqual(responseHeader({}, 'X-File-Size'), '')
assert.deepStrictEqual(
  parseContentRange('bytes 0-1023/33132336'),
  { start: 0, end: 1023, total: 33132336 }
)
assert.deepStrictEqual(
  parseContentRange('BYTES 4194304-8388607/33132336'),
  { start: 4194304, end: 8388607, total: 33132336 }
)
assert.strictEqual(parseContentRange('bytes */33132336'), null)
assert.strictEqual(parseContentRange('bytes 10-9/100'), null)
assert.strictEqual(parseContentRange('bytes 0-100/100'), null)
assert.strictEqual(isSignedSourceUrl('https://cdn.yunmanvr.com/files/a.pdf?auth_key=x'), true)
assert.strictEqual(isSignedSourceUrl('http://cdn.yunmanvr.com/files/a.pdf'), false)
assert.strictEqual(isSignedSourceUrl('/resources/1/file'), false)
assert.strictEqual(FILE_CHUNK_BYTES, 4 * 1024 * 1024)
assert.ok(MAX_CHUNK_FILE_BYTES < 200 * 1024 * 1024)

console.log('[resourceDownload.test] PASS')
