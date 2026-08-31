// utils/resourceDownload.js — 资源下载：调后端记录 + 按类型打开
const { post } = require('./request')
const { requireLogin } = require('./auth')

const DOC_TYPES = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'word'])
const VIDEO_TYPES = new Set(['mp4', 'mov'])
const AUDIO_TYPES = new Set(['mp3', 'm4a', 'wav'])
const OPEN_DOC_EXTS = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'])

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

function pickUrl(data) {
  if (!data) return ''
  return data.fileUrl || data.previewUrl || ''
}

function wxDownload(url, ext) {
  const safeExt = String(ext || 'bin').replace(/[^a-z0-9]/gi, '') || 'bin'
  const filePath = `${wx.env.USER_DATA_PATH}/res_${Date.now()}.${safeExt}`
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      filePath,
      timeout: 180000,
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.filePath || filePath)
        } else {
          reject(new Error('download-failed'))
        }
      },
      fail: reject
    })
  })
}

async function openDocument(url, fileType) {
  const openType = documentOpenType(fileType, url)
  wx.showLoading({ title: '下载中…', mask: true })
  try {
    const path = await wxDownload(url, openType)
    wx.hideLoading()
    await new Promise((resolve, reject) => {
      wx.openDocument({
        filePath: path,
        fileType: openType,
        showMenu: true,
        success: resolve,
        fail: reject
      })
    })
    wx.showToast({ title: '已打开', icon: 'success' })
  } catch (e) {
    wx.hideLoading()
    const msg = String((e && e.errMsg) || e.message || '')
    if (/download-failed|fail.*download|timeout/i.test(msg)) {
      wx.showToast({ title: '文件下载失败，请检查网络后重试', icon: 'none' })
    } else {
      wx.showToast({ title: '无法打开文件，请用手机打开', icon: 'none' })
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
    await openDocument(url, data.fileType)
  } else if (VIDEO_TYPES.has(fileType)) {
    playVideo(url, data.name)
  } else if (AUDIO_TYPES.has(fileType)) {
    playAudio(url, data.name)
  } else {
    await openDocument(url, data.fileType)
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
      await openDownloadedResource(data)
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
  documentOpenType
}
