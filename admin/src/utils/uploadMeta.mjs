/** 后台上传后回填大小 / 格式 / 时长。纯函数，Node 与 Vite 都能 import。 */

const EXT_TO_RESOURCE_TYPE = {
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  ppt: 'ppt',
  pptx: 'ppt',
  xls: 'xls',
  xlsx: 'xlsx',
  mp4: 'mp4',
  mov: 'mp4',
  mp3: 'mp3',
  aac: 'aac',
  m4a: 'm4a'
}

export function extractFileExtension(fileName) {
  const base = String(fileName || '').trim().split(/[\\/]/).pop() || ''
  const dot = base.lastIndexOf('.')
  if (dot < 0 || dot === base.length - 1) {
    return ''
  }
  return base.slice(dot + 1).toLowerCase()
}

export function extractFileNameFromUrl(url) {
  const raw = String(url || '').trim()
  if (!raw) return ''
  try {
    const path = new URL(raw).pathname
    return decodeURIComponent(path.split('/').pop() || '')
  } catch {
    return raw.split('?')[0].split('#')[0].split('/').pop() || ''
  }
}

/** OSS 对象名是 32 位 hex + 后缀，不宜直接给老师看。 */
export function isStoredObjectFileName(name) {
  return /^[a-f0-9]{32}\.[a-z0-9]+$/i.test(String(name || '').trim())
}

const EXT_PREVIEW_LABEL = {
  pdf: 'PDF 文件',
  doc: 'Word 文档',
  docx: 'Word 文档',
  ppt: 'PPT 演示文稿',
  pptx: 'PPT 演示文稿',
  xls: 'Excel 表格',
  xlsx: 'Excel 表格',
  mp4: '视频 MP4',
  mov: '视频',
  mp3: '音频 MP3',
  aac: '音频 AAC',
  m4a: '音频 M4A',
  wav: '音频',
  vtt: '字幕 VTT',
  srt: '字幕 SRT'
}

/**
 * 上传预览文案：优先可读文件名 / 资源名称，否则按后缀显示「PDF 文件」，不展示 OSS 哈希名。
 */
export function formatUploadPreviewLabel({ url, originalName, displayName } = {}) {
  const pickReadable = (value) => {
    const name = String(value || '').trim().split(/[\\/]/).pop()
    if (!name || isStoredObjectFileName(name)) return ''
    return name
  }
  const readable = pickReadable(displayName) || pickReadable(originalName) || pickReadable(extractFileNameFromUrl(url))
  if (readable) return readable
  const ext = extractFileExtension(originalName || extractFileNameFromUrl(url) || url)
  return EXT_PREVIEW_LABEL[ext] || (ext ? `${ext.toUpperCase()} 文件` : '已上传文件')
}

/** 与资源下拉 / 后端 ALLOWED_FILE_TYPES 对齐；认不出返回空，不覆盖老师已选。 */
export function inferResourceFileType(fileName) {
  const ext = extractFileExtension(fileName)
  return EXT_TO_RESOURCE_TYPE[ext] || ''
}

/** 课程视频与资料里的 MP4/MOV 才走 OSS 直传。 */
export function isDirectUploadCandidate(scene, fileName) {
  const ext = extractFileExtension(fileName)
  if (ext !== 'mp4' && ext !== 'mov') {
    return false
  }
  const normalized = String(scene || '').toLowerCase()
  return normalized === 'video'
    || normalized === 'course'
    || normalized === 'resource'
    || normalized === 'resource_file'
}

/**
 * 文件角标：后缀 → 短标签 + 配色。
 * 之前 PDF/Word/PPT/字幕共用同一个蓝色 Document 图标，扫一眼分不出类型；
 * tone 只给 CSS 类名用，颜色值放在组件里，这里保持纯函数好测。
 */
const EXT_BADGE = {
  pdf: { label: 'PDF', tone: 'pdf' },
  doc: { label: 'DOC', tone: 'word' },
  docx: { label: 'DOC', tone: 'word' },
  ppt: { label: 'PPT', tone: 'ppt' },
  pptx: { label: 'PPT', tone: 'ppt' },
  xls: { label: 'XLS', tone: 'excel' },
  xlsx: { label: 'XLS', tone: 'excel' },
  vtt: { label: 'VTT', tone: 'subtitle' },
  srt: { label: 'SRT', tone: 'subtitle' },
  mp3: { label: 'MP3', tone: 'media' },
  m4a: { label: 'M4A', tone: 'media' },
  aac: { label: 'AAC', tone: 'media' },
  wav: { label: 'WAV', tone: 'media' },
  mp4: { label: 'MP4', tone: 'media' },
  mov: { label: 'MOV', tone: 'media' }
}

export function formatFileBadge({ url, originalName } = {}) {
  const ext = extractFileExtension(originalName || extractFileNameFromUrl(url) || url)
  const known = EXT_BADGE[ext]
  if (known) return { ...known }
  // 认不出后缀时也别退回问号：截前 4 位当标签，至少还能看出是什么东西
  return { label: (ext || 'FILE').toUpperCase().slice(0, 4), tone: 'generic' }
}

/** 上传时间只给「这是不是我刚传的那份」做参照，精确到分钟就够，不占地方 */
export function formatUploadedAt(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 预览框第二行：大小 · 上传时间。两者都没有就整行不显示。 */
export function formatFileMetaLine({ sizeBytes, uploadedAt } = {}) {
  const parts = []
  const size = formatFileSizeKb(bytesToFileSizeKb(Number(sizeBytes)))
  if (size) parts.push(size)
  const at = formatUploadedAt(uploadedAt)
  if (at) parts.push(at)
  return parts.join(' · ')
}

/**
 * 字幕预览：数出总条数并取前几条。
 *
 * 字幕是 ASR 生成的，可能整份为空、可能编码坏掉，而后台现在只显示「字幕 VTT」四个字，
 * 老师根本看不出来，要等学生在小程序里看到空白才发现。把前两条摆出来是最直接的体检。
 *
 * VTT 与 SRT 都认：时间轴行含 `-->`，毫秒分隔 VTT 用 `.`、SRT 用 `,`。
 * 时间轴之后、下一个空行之前的都是这条的文本；SRT 的纯数字序号行跳过。
 */
export function parseSubtitleCues(text, limit = 2) {
  const raw = String(text || '')
  if (!raw.trim()) return { total: 0, cues: [] }
  const lines = raw.replace(/\r\n?/g, '\n').split('\n')
  const cues = []
  let total = 0
  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].includes('-->')) continue
    total += 1
    if (cues.length >= limit) continue
    const [start, end] = lines[i].split('-->').map((s) => s.trim())
    const body = []
    for (let j = i + 1; j < lines.length; j += 1) {
      const line = lines[j]
      if (!line.trim()) break
      if (line.includes('-->')) break
      if (/^\d+$/.test(line.trim()) && body.length === 0) continue   // SRT 序号行
      body.push(line.trim())
    }
    cues.push({ start, end, text: body.join(' ') })
  }
  return { total, cues }
}

export function formatByteLimit(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return ''
  }
  const gb = 1024 * 1024 * 1024
  const mb = 1024 * 1024
  if (bytes >= gb && bytes % gb === 0) {
    return `${bytes / gb}GB`
  }
  if (bytes >= mb) {
    return `${Math.round(bytes / mb)}MB`
  }
  return `${bytes}B`
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

/**
 * 秒 → mm:ss / h:mm:ss。给「时长说明」自动回填用，别让老师听一遍再手打。
 * 取整用 floor 不用 round：原生播放器显示的总时长就是截断的，
 * 四舍五入会出现「进度条走到 03:47 结束、说明里却写 03:48」这种对不上的情况。
 */
export function formatDurationClock(seconds) {
  const total = Math.floor(Number(seconds))
  if (!Number.isFinite(total) || total <= 0) return ''
  const pad = (n) => String(n).padStart(2, '0')
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
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
