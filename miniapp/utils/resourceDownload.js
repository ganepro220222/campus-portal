// utils/resourceDownload.js — 资源下载：调后端记录 + 按类型打开
const { post, getArrayBufferChunk, getUrlArrayBufferChunk } = require('./request')
const { requireLogin } = require('./auth')

const DOC_TYPES = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'word', 'xls', 'xlsx'])
const VIDEO_TYPES = new Set(['mp4', 'mov'])
const AUDIO_TYPES = new Set(['mp3', 'm4a', 'aac', 'wav'])
const OPEN_DOC_EXTS = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'])
/** 每次只把 4MB 放进 JS 内存；同时兼容 wx.request 与后端 ResourceService 上限。 */
const FILE_CHUNK_BYTES = 4 * 1024 * 1024
/** USER_DATA_PATH 总配额 200MB，留出 20MB 给小程序其它用户文件。 */
const MAX_CHUNK_FILE_BYTES = 180 * 1024 * 1024

let _audioCtx = null
// 下载流程共享 loading、缓存清理和 openDocument；同一时刻只能安全执行一个。
let _activeDownloadId = null

function normalizeType(fileType) {
  const t = String(fileType || '').toLowerCase()
  if (t === 'word') return 'doc'
  return t
}

function extFromUrl(url) {
  const path = String(url || '').split('?')[0].split('#')[0]
  const m = path.match(/\.([A-Za-z0-9]+)$/)
  return m ? m[1].toLowerCase() : ''
}

/**
 * wx.openDocument 的 fileType 必须和真实后缀一致。
 * 后台 Word/PPT 存的是 word/ppt，OSS 上实际是 .docx/.pptx；用 doc/ppt 去开会失败。
 */
function documentOpenType(fileType, url) {
  const fromUrl = extFromUrl(url)
  if (OPEN_DOC_EXTS.has(fromUrl)) return fromUrl
  const t = String(fileType || '').toLowerCase()
  if (t === 'word' || t === 'doc') return 'docx'
  if (t === 'ppt') return 'pptx'
  if (OPEN_DOC_EXTS.has(t)) return t
  return 'pdf'
}

function pickUrl(data) {
  if (!data) return ''
  return data.fileUrl || data.previewUrl || ''
}

function writeFileData(filePath, data, append) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager()
    const method = append ? 'appendFile' : 'writeFile'
    fs[method]({
      filePath,
      data,
      success: resolve,
      fail: reject
    })
  })
}

function unlinkLocalFile(filePath) {
  return new Promise((resolve) => {
    if (!filePath) {
      resolve()
      return
    }
    wx.getFileSystemManager().unlink({
      filePath,
      complete: resolve
    })
  })
}

function isLegacyDocumentCacheFile(name) {
  return /^(?:dl|cdn|res)_\d+\.[a-z0-9]+$/i.test(String(name || ''))
}

/**
 * 旧版为补后缀把临时预览文件写进了 USER_DATA_PATH，且没有删除。
 * 这里只清理由本模块命名的文件，避免误删头像等其他用户数据。
 */
function cleanupLegacyDocumentCache() {
  const dirPath = wx.env && wx.env.USER_DATA_PATH
  const fs = wx.getFileSystemManager()
  if (!dirPath || !fs || typeof fs.readdir !== 'function' || typeof fs.unlink !== 'function') {
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    fs.readdir({
      dirPath,
      success(res) {
        const files = (res.files || []).filter(isLegacyDocumentCacheFile)
        if (!files.length) {
          resolve()
          return
        }
        let pending = files.length
        files.forEach((name) => {
          fs.unlink({
            filePath: `${dirPath}/${name}`,
            complete() {
              pending -= 1
              if (pending === 0) resolve()
            }
          })
        })
      },
      fail: resolve
    })
  })
}

function responseHeader(headers, name) {
  const target = String(name || '').toLowerCase()
  const source = headers || {}
  const key = Object.keys(source).find((item) => item.toLowerCase() === target)
  return key ? source[key] : ''
}

function parseContentRange(value) {
  const match = String(value || '').trim().match(/^bytes\s+(\d+)-(\d+)\/(\d+)$/i)
  if (!match) return null
  const start = Number(match[1])
  const end = Number(match[2])
  const total = Number(match[3])
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)
      || !Number.isSafeInteger(total) || start < 0 || end < start
      || total <= 0 || end >= total) {
    return null
  }
  return { start, end, total }
}

function isSignedSourceUrl(url) {
  return /^https:\/\//i.test(String(url || ''))
}

async function retryChunk(loader) {
  let lastError = null
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await loader()
    } catch (error) {
      lastError = error
    }
  }
  throw lastError || new Error('chunk-download-failed')
}

function requestChunkWithRetry(resourceId, offset, downloader = getArrayBufferChunk) {
  return retryChunk(() => downloader(
    `/resources/${resourceId}/file-chunks`,
    { offset, size: FILE_CHUNK_BYTES },
    { timeout: 180000, silent: true }
  ))
}

function requestSourceChunkWithRetry(sourceUrl, offset, downloader = getUrlArrayBufferChunk) {
  return retryChunk(() => downloader(
    sourceUrl,
    offset,
    FILE_CHUNK_BYTES,
    { timeout: 180000, silent: true }
  ))
}

function validateChunkResponse(response, offset, source) {
  const buffer = response && response.data
  const length = buffer && Number(buffer.byteLength)
  if (!Number.isFinite(length) || length <= 0 || length > FILE_CHUNK_BYTES) {
    throw new Error('chunk-size-invalid')
  }

  if (source === 'signed-url') {
    const range = parseContentRange(responseHeader(response.header, 'content-range'))
    if (!range) {
      throw new Error('chunk-source-range-missing')
    }
    if (range.start !== offset || range.end - range.start + 1 !== length) {
      throw new Error('chunk-source-range-invalid')
    }
    return { buffer, length, total: range.total }
  }

  const total = Number(responseHeader(response.header, 'x-file-size'))
  if (!Number.isSafeInteger(total) || total <= 0) {
    throw new Error('chunk-total-missing')
  }
  return { buffer, length, total }
}

async function fetchViaPreferredChunks(
  sourceUrl,
  resourceId,
  ext,
  sourceDownloader = getUrlArrayBufferChunk,
  apiDownloader = getArrayBufferChunk
) {
  const safeExt = String(ext || 'bin').replace(/[^a-z0-9]/gi, '') || 'bin'
  const filePath = `${wx.env.USER_DATA_PATH}/res_${Date.now()}.${safeExt}`
  let offset = 0
  let total = 0
  let useSignedSource = isSignedSourceUrl(sourceUrl)
  let sourceError = null
  try {
    while (total === 0 || offset < total) {
      let chunk = null
      if (useSignedSource) {
        try {
          const response = await requestSourceChunkWithRetry(sourceUrl, offset, sourceDownloader)
          chunk = validateChunkResponse(response, offset, 'signed-url')
        } catch (error) {
          sourceError = error
          useSignedSource = false
          console.warn('[resourceDownload] signed source unavailable; using API chunks:', errText(error))
        }
      }

      if (!chunk) {
        try {
          const response = await requestChunkWithRetry(resourceId, offset, apiDownloader)
          chunk = validateChunkResponse(response, offset, 'api')
        } catch (apiError) {
          if (sourceError) {
            throw new Error(
              `chunk-all-sources-failed:${errText(sourceError).slice(0, 80)};`
              + errText(apiError).slice(0, 80)
            )
          }
          throw apiError
        }
      }

      if (chunk.total > MAX_CHUNK_FILE_BYTES) {
        throw new Error('chunk-file-too-large')
      }
      if (total > 0 && total !== chunk.total) {
        throw new Error('chunk-file-changed')
      }
      total = chunk.total
      if (offset + chunk.length > total) {
        throw new Error('chunk-range-invalid')
      }

      await writeFileData(filePath, chunk.buffer, offset > 0)
      offset += chunk.length
      const percent = Math.min(100, Math.floor(offset * 100 / total))
      wx.showLoading({ title: `下载 ${percent}%`, mask: true })
    }
    if (offset !== total) {
      throw new Error('chunk-download-incomplete')
    }
    return filePath
  } catch (error) {
    await unlinkLocalFile(filePath)
    throw error
  }
}

/**
 * 保留纯 API 入口供兼容与单测；生产路径优先走签名文件源。
 */
function fetchViaChunkApi(resourceId, ext, downloader = getArrayBufferChunk) {
  return fetchViaPreferredChunks('', resourceId, ext, null, downloader)
}

function wxDownloadTemp(url) {
  return new Promise((resolve, reject) => {
    const payload = {
      url,
      timeout: 180000,
      success(res) {
        const local = res.tempFilePath || res.filePath
        if (res.statusCode === 200 && local) {
          resolve(local)
        } else {
          reject(new Error('download-failed'))
        }
      },
      fail: reject
    }
    wx.downloadFile(payload)
  })
}

function wxOpenDocument(filePath, fileType) {
  return new Promise((resolve, reject) => {
    const payload = {
      filePath,
      showMenu: true,
      success: resolve,
      fail: reject
    }
    if (fileType) payload.fileType = fileType
    wx.openDocument(payload)
  })
}

function errText(e) {
  return String((e && e.errMsg) || (e && e.message) || e || '')
}

/** download=没下下来；domain=微信拒绝 URL；storage=旧预览文件占满；open=已下载但预览失败 */
function classifyOpenError(msg) {
  const s = String(msg || '')
  if (/url not in domain list/i.test(s)) return 'domain'
  if (/maximum size.*storage|storage limit|no space|quota/i.test(s)) return 'storage'
  if (/download-failed|downloadFile:fail|timeout|chunk-/i.test(s)) return 'download'
  return 'open'
}

async function tryOpenLocal(path, openType) {
  // 分块文件已经按真实后缀写入唯一的 USER_DATA_PATH 文件，不再额外复制第二份。
  try {
    await wxOpenDocument(path, openType)
  } catch (first) {
    await wxOpenDocument(path)
  }
}

async function openDocument(url, fileType, resourceId) {
  const openType = documentOpenType(fileType, url)
  wx.showLoading({ title: '下载中…', mask: true })
  try {
    await cleanupLegacyDocumentCache()
    let path
    if (resourceId) {
      path = await fetchViaPreferredChunks(url, resourceId, openType)
    } else {
      path = await wxDownloadTemp(url)
    }
    wx.hideLoading()
    await tryOpenLocal(path, openType)
    wx.showToast({ title: '已打开', icon: 'success' })
  } catch (e) {
    wx.hideLoading()
    const msg = errText(e)
    const kind = classifyOpenError(msg)
    console.error('[resourceDownload] openDocument failed:', msg)
    // 弹窗里带上原始错误，方便远程排查（用户截图即可定位具体分块/打开阶段）
    const detail = msg ? '\n[' + msg.slice(0, 140) + ']' : ''
    wx.showModal({
      title: '无法打开文件',
      content: (kind === 'storage'
        ? '旧版残留文件已自动清理，但可用存储空间仍不足，请释放微信存储后重试。'
        : /chunk-file-too-large/i.test(msg)
          ? '该文档超过小程序安全预览上限，请复制链接用浏览器打开。'
          : kind === 'download'
            ? '文件分块下载失败，请检查网络后重试。'
            : '微信无法预览该文档。可复制链接到手机浏览器打开。') + detail,
      confirmText: '复制链接',
      success(res) {
        if (res.confirm) copyUrlFallback(url, '')
      }
    })
    throw e
  }
}

function playVideo(url, name) {
  if (wx.previewMedia) {
    wx.previewMedia({
      sources: [{ url, type: 'video' }],
      fail: () => copyUrlFallback(url, name)
    })
    return
  }
  copyUrlFallback(url, name)
}

function playAudio(url, name) {
  try {
    if (_audioCtx) {
      _audioCtx.stop()
      _audioCtx.destroy()
    }
    _audioCtx = wx.createInnerAudioContext()
    _audioCtx.src = url
    _audioCtx.play()
    wx.showToast({ title: '正在播放：' + (name || '音频'), icon: 'none', duration: 2500 })
    _audioCtx.onError(() => {
      copyUrlFallback(url, name)
    })
  } catch (e) {
    copyUrlFallback(url, name)
  }
}

function copyUrlFallback(url, name) {
  wx.setClipboardData({
    data: url,
    success: () => {
      wx.showToast({
        title: (name ? name + ' ' : '') + '链接已复制',
        icon: 'none',
        duration: 2500
      })
    }
  })
}

async function openDownloadedResource(data) {
  const url = pickUrl(data)
  if (!url) {
    wx.showToast({ title: '文件地址不可用', icon: 'none' })
    throw new Error('no-url')
  }
  const rawType = String(data.fileType || '').toLowerCase()
  const fileType = normalizeType(rawType)
  if (DOC_TYPES.has(fileType) || DOC_TYPES.has(rawType)) {
    await openDocument(url, data.fileType, data.id)
  } else if (VIDEO_TYPES.has(fileType)) {
    playVideo(url, data.name)
  } else if (AUDIO_TYPES.has(fileType)) {
    playAudio(url, data.name)
  } else {
    await openDocument(url, data.fileType, data.id)
  }
}

/**
 * 登录后请求下载接口并打开文件
 * 口径：POST /download 成功即记下载记录；onRecorded 在客户端打开流程成功后触发（用于列表计数 UI）
 * @param {number|string} resourceId
 * @param {{ onStart?: Function, onRecorded?: Function, onComplete?: Function }} options
 */
function downloadResource(resourceId, options = {}) {
  requireLogin(async () => {
    const downloadKey = String(resourceId)
    if (_activeDownloadId !== null) {
      wx.showToast({
        title: _activeDownloadId === downloadKey ? '该文件正在下载' : '已有文件正在下载',
        icon: 'none'
      })
      return
    }
    _activeDownloadId = downloadKey
    try {
      if (typeof options.onStart === 'function') {
        options.onStart()
      }
      const data = await post(`/resources/${resourceId}/download`, {})
      await openDownloadedResource({ ...data, id: resourceId })
      if (typeof options.onRecorded === 'function') {
        options.onRecorded(data)
      }
    } catch (e) {
      // 下载/打开流程已经向用户提示；此处仅吞掉未处理异常
    } finally {
      _activeDownloadId = null
      if (typeof options.onComplete === 'function') {
        options.onComplete()
      }
    }
  })
}

module.exports = {
  downloadResource,
  openDownloadedResource,
  normalizeType,
  extFromUrl,
  documentOpenType,
  classifyOpenError,
  isLegacyDocumentCacheFile,
  responseHeader,
  parseContentRange,
  isSignedSourceUrl,
  _getActiveDownloadId: () => _activeDownloadId,
  _resetActiveDownloadState: () => { _activeDownloadId = null },
  _fetchViaChunkApi: fetchViaChunkApi,
  _fetchViaPreferredChunks: fetchViaPreferredChunks,
  FILE_CHUNK_BYTES,
  MAX_CHUNK_FILE_BYTES
}
