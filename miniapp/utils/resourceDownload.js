// utils/resourceDownload.js — 资源下载：调后端记录 + 按类型打开
const { post, getArrayBuffer, downloadToTempFile } = require('./request')
const { requireLogin } = require('./auth')

const DOC_TYPES = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'word'])
const VIDEO_TYPES = new Set(['mp4', 'mov'])
const AUDIO_TYPES = new Set(['mp3', 'm4a', 'wav'])
const OPEN_DOC_EXTS = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'])
/** 仅当 downloadFile 域名未放行、且文件较小，才允许 ArrayBuffer 兜底，避免 50MB PDF 撑爆 JS 堆。 */
const ARRAYBUFFER_MAX_KB = 8 * 1024

let _audioCtx = null

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

function namedTempPath(tempPath, ext) {
  const safeExt = String(ext || 'bin').replace(/[^a-z0-9]/gi, '') || 'bin'
  const src = String(tempPath || '')
  if (!src) return ''
  if (src.toLowerCase().endsWith('.' + safeExt)) return src
  return src + '.' + safeExt
}

function pickUrl(data) {
  if (!data) return ''
  return data.fileUrl || data.previewUrl || ''
}

function writeLocalFile(buffer, ext) {
  const safeExt = String(ext || 'bin').replace(/[^a-z0-9]/gi, '') || 'bin'
  const filePath = `${wx.env.USER_DATA_PATH}/res_${Date.now()}.${safeExt}`
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().writeFile({
      filePath,
      data: buffer,
      success: () => resolve(filePath),
      fail: reject
    })
  })
}

function resourceFileDownloadPath(resourceId, ext) {
  const safeExt = String(ext || 'bin').replace(/[^a-z0-9]/gi, '') || 'bin'
  return `/resources/${resourceId}/file/document.${safeExt}`
}

function canUseArrayBufferFallback(fileSizeKb) {
  const n = Number(fileSizeKb)
  return Number.isFinite(n) && n > 0 && n <= ARRAYBUFFER_MAX_KB
}

/**
 * 经 API 拉文件，按成功率从高到低逐个尝试：
 * 1. downloadFile + Authorization 头（URL 干净、路径以真实后缀结尾）
 * 2. downloadFile + ?access_token=（防个别客户端对带 header 的 downloadFile 误报域名）
 * 3. 小文件 wx.request ArrayBuffer（完全绕开 downloadFile 的各种怪癖；走旧版 /file 路径，
 *    后端未更新到带文件名的新路由时也能成）
 * 域名误报是客户端本地立即失败，串行重试没有额外流量。
 */
async function fetchViaApi(resourceId, ext, fileSizeKb) {
  const apiPath = resourceFileDownloadPath(resourceId, ext)
  const attempts = [
    { label: 'api-header', run: () => downloadToTempFile(apiPath, { timeout: 180000, silent: true, ext }) },
    { label: 'api-query', run: () => downloadToTempFile(apiPath, { timeout: 180000, silent: true, ext, auth: 'query' }) }
  ]
  let lastErr = null
  for (const attempt of attempts) {
    try {
      const tmp = await attempt.run()
      const named = namedTempPath(tmp, ext)
      return await copyToNamedPath(tmp, named).catch(() => tmp)
    } catch (e) {
      lastErr = e
      console.error('[resourceDownload]', attempt.label, 'failed:', errText(e))
    }
  }
  if (canUseArrayBufferFallback(fileSizeKb)) {
    const buffer = await getArrayBuffer(`/resources/${resourceId}/file`, { timeout: 180000, silent: true })
    return writeLocalFile(buffer, ext)
  }
  throw lastErr || new Error('download-failed')
}

function wxDownloadTemp(url, ext) {
  const safeExt = String(ext || 'bin').replace(/[^a-z0-9]/gi, '') || 'bin'
  const filePath = (wx.env && wx.env.USER_DATA_PATH)
    ? `${wx.env.USER_DATA_PATH}/cdn_${Date.now()}.${safeExt}`
    : ''
  return new Promise((resolve, reject) => {
    const payload = {
      url,
      timeout: 180000,
      success(res) {
        const local = res.filePath || res.tempFilePath || filePath
        if (res.statusCode === 200 && local) {
          resolve(local)
        } else {
          reject(new Error('download-failed'))
        }
      },
      fail: reject
    }
    if (filePath) payload.filePath = filePath
    wx.downloadFile(payload)
  })
}

function copyToNamedPath(src, dest) {
  return new Promise((resolve, reject) => {
    if (!src || src === dest) {
      resolve(src)
      return
    }
    wx.getFileSystemManager().copyFile({
      srcPath: src,
      destPath: dest,
      success: () => resolve(dest),
      fail: reject
    })
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

/** download=没下下来；domain=微信未放行该域名；open=已下载但预览失败 */
function classifyOpenError(msg) {
  const s = String(msg || '')
  if (/url not in domain list/i.test(s)) return 'domain'
  if (/download-failed|downloadFile:fail|timeout/i.test(s)) return 'download'
  return 'open'
}

async function tryOpenLocal(path, openType) {
  // PDF 预览器强制看后缀；docx/ppt 往往靠 fileType 就能开。先补后缀再打开。
  const named = namedTempPath(path, openType)
  const local = named && named !== path
    ? await copyToNamedPath(path, named).catch(() => path)
    : path
  try {
    await wxOpenDocument(local, openType)
  } catch (first) {
    await wxOpenDocument(local).catch(() => wxOpenDocument(path, openType))
  }
}

async function openDocument(url, fileType, resourceId, fileSizeKb) {
  const openType = documentOpenType(fileType, url)
  wx.showLoading({ title: '下载中…', mask: true })
  try {
    let path
    if (resourceId) {
      // 文档优先走 API（路径以真实后缀结尾，如 /file/document.pdf），
      // 全部失败再直拉 CDN（CDN 签名地址是 .pdf?auth_key=...，个别客户端会误报域名）。
      try {
        path = await fetchViaApi(resourceId, openType, fileSizeKb)
      } catch (apiErr) {
        console.error('[resourceDownload] cdn-direct fallback, api error:', errText(apiErr))
        path = await wxDownloadTemp(url, openType)
      }
    } else {
      path = await wxDownloadTemp(url, openType)
    }
    wx.hideLoading()
    await tryOpenLocal(path, openType)
    wx.showToast({ title: '已打开', icon: 'success' })
  } catch (e) {
    wx.hideLoading()
    const msg = errText(e)
    const kind = classifyOpenError(msg)
    console.error('[resourceDownload] openDocument failed:', msg)
    if (kind === 'download') {
      wx.showToast({ title: '文件下载失败，请检查网络后重试', icon: 'none' })
    } else {
      // 弹窗里带上原始错误，方便远程排查（用户截图即可定位是哪一步、什么错）
      const detail = msg ? '\n[' + msg.slice(0, 60) + ']' : ''
      wx.showModal({
        title: '无法打开文件',
        content: (kind === 'domain'
          ? '微信拦截了下载地址。若服务器域名刚调整过，请完全退出微信后重进小程序再试；仍不行可复制链接用浏览器打开。'
          : '微信无法预览该文档。可复制链接到手机浏览器打开。') + detail,
        confirmText: '复制链接',
        success(res) {
          if (res.confirm) copyUrlFallback(url, '')
        }
      })
    }
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
    await openDocument(url, data.fileType, data.id, data.fileSizeKb)
  } else if (VIDEO_TYPES.has(fileType)) {
    playVideo(url, data.name)
  } else if (AUDIO_TYPES.has(fileType)) {
    playAudio(url, data.name)
  } else {
    await openDocument(url, data.fileType, data.id, data.fileSizeKb)
  }
}

/**
 * 登录后请求下载接口并打开文件
 * 口径：POST /download 成功即记下载记录；onRecorded 在客户端打开流程成功后触发（用于列表计数 UI）
 * @param {number|string} resourceId
 * @param {{ onRecorded?: Function }} options 下载记录成功后的回调（如刷新列表计数）
 */
function downloadResource(resourceId, options = {}) {
  requireLogin(async () => {
    try {
      const data = await post(`/resources/${resourceId}/download`, {})
      await openDownloadedResource({ ...data, id: resourceId })
      if (typeof options.onRecorded === 'function') {
        options.onRecorded(data)
      }
    } catch (e) {
      // request.js 已 toast；此处仅吞掉未处理异常
    } finally {
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
  namedTempPath,
  resourceFileDownloadPath,
  classifyOpenError,
  canUseArrayBufferFallback,
  ARRAYBUFFER_MAX_KB
}
