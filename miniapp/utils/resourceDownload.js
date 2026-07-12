// utils/resourceDownload.js — 资源下载：调后端记录 + 按类型打开
const { post } = require('./request')
const { requireLogin } = require('./auth')

const DOC_TYPES = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'word'])
const VIDEO_TYPES = new Set(['mp4', 'mov'])
const AUDIO_TYPES = new Set(['mp3', 'm4a', 'wav'])

let _audioCtx = null

function normalizeType(fileType) {
  const t = String(fileType || '').toLowerCase()
  if (t === 'word') return 'doc'
  return t
}

function pickUrl(data) {
  if (!data) return ''
  return data.fileUrl || data.previewUrl || ''
}

function wxDownload(url) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      success(res) {
        if (res.statusCode === 200 && res.tempFilePath) {
          resolve(res.tempFilePath)
        } else {
          reject(new Error('download-failed'))
        }
      },
      fail: reject
    })
  })
}

async function openDocument(url, fileType) {
  wx.showLoading({ title: '下载中…', mask: true })
  try {
    const path = await wxDownload(url)
    wx.hideLoading()
    const ext = normalizeType(fileType)
    const openType = ['pdf', 'doc', 'docx', 'ppt', 'pptx'].includes(ext) ? ext : 'pdf'
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
    wx.showToast({ title: '无法打开文件，请稍后重试', icon: 'none' })
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
  const fileType = normalizeType(data.fileType)
  if (DOC_TYPES.has(fileType)) {
    await openDocument(url, fileType)
  } else if (VIDEO_TYPES.has(fileType)) {
    playVideo(url, data.name)
  } else if (AUDIO_TYPES.has(fileType)) {
    playAudio(url, data.name)
  } else {
    await openDocument(url, fileType)
  }
}

/**
 * 登录后请求下载接口并打开文件
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
    }
  })
}

module.exports = {
  downloadResource,
  openDownloadedResource,
  normalizeType
}
