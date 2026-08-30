/** 后台上传后回填大小 / 格式 / 时长。纯函数，Node 与 Vite 都能 import。 */

const EXT_TO_RESOURCE_TYPE = {
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  ppt: 'ppt',
  pptx: 'ppt',
  mp4: 'mp4',
  mp3: 'mp3'
}

export function extractFileExtension(fileName) {
  const base = String(fileName || '').trim().split(/[\\/]/).pop() || ''
  const dot = base.lastIndexOf('.')
  if (dot < 0 || dot === base.length - 1) {
    return ''
  }
  return base.slice(dot + 1).toLowerCase()
}

/** 与资源下拉 / 后端 ALLOWED_FILE_TYPES 对齐；认不出返回空，不覆盖老师已选。 */
export function inferResourceFileType(fileName) {
  const ext = extractFileExtension(fileName)
  return EXT_TO_RESOURCE_TYPE[ext] || ''
}

export function bytesToFileSizeKb(sizeBytes) {
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return undefined
  }
  return Math.max(1, Math.round(sizeBytes / 1024))
}

export function formatFileSizeKb(kb) {
  if (kb == null || kb <= 0) {
    return ''
  }
  if (kb >= 1024) {
    return `${(kb / 1024).toFixed(1)} MB`
  }
  return `${kb} KB`
}

export function secondsToDurationMinutes(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return undefined
  }
  const minutes = Math.round(seconds / 60)
  if (minutes < 1) {
    return 1
  }
  return Math.min(9999, minutes)
}

export function readVideoDurationSeconds(file) {
  return new Promise((resolve) => {
    const name = file?.name || ''
    const type = file?.type || ''
    if (!type.startsWith('video/') && !/\.(mp4|mov)$/i.test(name)) {
      resolve(null)
      return
    }
    if (typeof URL === 'undefined' || typeof document === 'undefined') {
      resolve(null)
      return
    }
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    let settled = false
    const done = (value) => {
      if (settled) {
        return
      }
      settled = true
      window.clearTimeout(timer)
      video.onloadedmetadata = null
      video.onerror = null
      video.removeAttribute('src')
      video.load()
      URL.revokeObjectURL(url)
      resolve(value)
    }
    const timer = window.setTimeout(() => done(null), 8000)
    video.onloadedmetadata = () => {
      const duration = video.duration
      done(Number.isFinite(duration) && duration > 0 ? duration : null)
    }
    video.onerror = () => done(null)
    video.src = url
  })
}
