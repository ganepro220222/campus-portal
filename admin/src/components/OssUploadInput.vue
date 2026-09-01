<template>
  <div class="oss-upload">
    <div class="oss-upload-body" :class="{ 'oss-upload-body--audio': showAudioPreview }">
      <div
        v-if="showImagePreview"
        class="preview-wrap"
        :class="{ 'preview-wrap--fit': fitMode === 'fit' }"
      >
        <el-image
          :src="inner"
          :fit="fitMode === 'fit' ? 'contain' : 'cover'"
          class="preview-image"
          :preview-src-list="[inner]"
          preview-teleported
        />
      </div>
      <div v-else-if="showVideoPreview" class="preview-wrap preview-wrap--video">
        <video v-if="previewSrc" :src="previewSrc" class="preview-video" controls preload="metadata" />
        <p v-else class="hint preview-loading">预览加载中…</p>
      </div>
      <div v-else-if="showAudioPreview" class="preview-wrap preview-wrap--audio">
        <div class="audio-row">
          <audio
            v-if="previewSrc"
            ref="audioEl"
            :src="previewSrc"
            class="preview-audio"
            controls
            preload="metadata"
            @loadedmetadata="onAudioLoadedMetadata"
            @error="audioError = true"
          />
          <p v-else class="hint preview-loading">预览加载中…</p>
        </div>
        <span class="file-name">{{ audioSummary }}</span>
        <p v-if="audioError" class="hint error">语音无法播放，请重新上传或换 MP3 / AAC</p>
      </div>
      <div v-else-if="showFilePreview" class="preview-wrap preview-wrap--file">
        <div class="file-card">
          <span class="file-badge" :class="`file-badge--${fileBadge.tone}`">{{ fileBadge.label }}</span>
          <div class="file-meta">
            <div class="file-title" :title="previewLabel">{{ previewLabel }}</div>
            <div v-if="fileMetaLine" class="file-sub">{{ fileMetaLine }}</div>
            <el-button
              link
              type="primary"
              class="file-open"
              :loading="openingFile"
              @click="openFileInNewTab"
            >↗ 打开预览</el-button>
          </div>
        </div>
        <div v-if="isSubtitleFile" class="subtitle-box">
          <p v-if="subtitleError" class="hint error">{{ subtitleError }}</p>
          <p v-else-if="subtitleLoading" class="hint">字幕读取中…</p>
          <template v-else-if="subtitleCues.length">
            <p class="hint subtitle-count">{{ subtitleCountText }}</p>
            <div class="subtitle-cues">
              <div v-for="(cue, i) in subtitleCues" :key="i" class="subtitle-cue">
                <span class="subtitle-time">{{ cue.start }} → {{ cue.end }}</span>
                <span class="subtitle-text">{{ cue.text || '（本条无文本）' }}</span>
              </div>
            </div>
          </template>
          <p v-else-if="subtitleLoaded" class="hint error">
            字幕文件里没有任何时间轴，学生端会看不到字幕，请检查后重新生成或上传
          </p>
        </div>
      </div>

      <div class="controls">
        <div class="row">
          <el-upload
            :show-file-list="false"
            :http-request="handleUpload"
            :accept="accept"
            :disabled="uploading"
          >
            <el-button :loading="uploading" type="primary">{{ uploadLabel }}</el-button>
          </el-upload>
          <el-button v-if="uploading && uploadPercent != null" @click="cancelOssUpload">取消</el-button>
          <span v-if="inner" class="status-ok">{{ doneText }}</span>
          <el-button v-if="inner" link type="danger" @click="clear">重新上传</el-button>
        </div>
        <el-progress
          v-if="uploading && uploadPercent != null"
          class="upload-progress"
          :percentage="uploadPercent"
          :stroke-width="8"
        />
        <div v-if="pendingComplete && !uploading" class="pending-complete">
          <p class="hint">文件已传到云存储，等待服务器确认{{ pendingComplete.fileName ? `（${pendingComplete.fileName}）` : '' }}。请点「重新确认」，不要重新选文件。</p>
          <div class="row">
            <el-button type="primary" size="small" @click="retryPendingComplete">重新确认</el-button>
            <el-button size="small" @click="discardPendingComplete">放弃待确认</el-button>
          </div>
        </div>
        <p v-if="aspectHint" class="hint aspect-hint">{{ aspectHint }}</p>
        <div v-if="showCoverFit" class="fit-mode">
          <span class="fit-label">小程序展示</span>
          <el-radio-group v-model="fitMode" size="small">
            <el-radio-button value="fill">裁切填满</el-radio-button>
            <el-radio-button value="fit">完整显示</el-radio-button>
          </el-radio-group>
        </div>
        <p v-if="resolvedHint" class="hint">{{ resolvedHint }}</p>
        <p v-if="uploadError" class="hint error">{{ uploadError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage, type UploadRequestOptions } from 'element-plus'
import {
  completeDirectUpload,
  fetchDirectPolicy,
  fetchFileMeta,
  fetchPreviewUrl,
  fetchSubtitlePreview,
  fetchUploadCapabilities,
  isDirectUploadDisabledError,
  postFileToOss,
  uploadFile,
  type DirectPolicy,
  type UploadCapabilities,
  type UploadFileMeta,
  type UploadResult
} from '@/api/upload'
import type { CoverFitMode } from '@/utils/cover'
import {
  extractFileExtension,
  extractFileNameFromUrl,
  formatByteLimit,
  formatDurationClock,
  formatFileBadge,
  formatFileMetaLine,
  formatUploadPreviewLabel,
  isDirectUploadCandidate,
  parseSubtitleCues
} from '@/utils/uploadMeta.mjs'
import { DIRECT_PENDING_KEY, parseDirectPending, pendingForScene } from '@/utils/directPending.mjs'

type PreviewMode = 'auto' | 'image' | 'video' | 'audio' | 'file' | 'none'

const props = withDefaults(defineProps<{
  modelValue?: string
  fitMode?: CoverFitMode
  scene?: string
  accept?: string
  uploadLabel?: string
  doneText?: string
  hint?: string
  aspectHint?: string
  showCoverFit?: boolean
  preview?: PreviewMode
  displayName?: string
}>(), {
  modelValue: '',
  fitMode: 'fill',
  scene: 'image',
  accept: 'image/*',
  uploadLabel: '上传文件',
  doneText: '已上传',
  hint: '上传后小程序端自动展示；若按钮不可用请联系技术人员',
  aspectHint: '',
  showCoverFit: false,
  preview: 'auto',
  displayName: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:fitMode': [value: CoverFitMode]
  uploaded: [payload: { url: string; sizeBytes: number; fileName: string; file?: File }]
  /** 读到音频时长后抛给表单，省掉老师听一遍再手打「时长说明」 */
  duration: [payload: { seconds: number; text: string }]
}>()

const PROXY_MAX_BYTES = 200 * 1024 * 1024

const inner = ref(props.modelValue || '')
const fitMode = ref<CoverFitMode>(props.fitMode || 'fill')
const uploading = ref(false)
const uploadPercent = ref<number | null>(null)
const uploadError = ref('')
const capabilities = ref<UploadCapabilities | null>(null)
const originalName = ref('')
const audioEl = ref<HTMLAudioElement | null>(null)
const audioError = ref(false)
const pendingComplete = ref<{ scene: string; objectKey: string; size: number; fileName: string; uploadedAt: number } | null>(null)
let ossAbort: AbortController | null = null

const resolvedPreview = computed<PreviewMode>(() => {
  if (props.preview !== 'auto') return props.preview
  if (props.scene === 'video' || props.accept.includes('video/')) return 'video'
  if (props.scene === 'audio' || props.accept.includes('audio/') || props.accept.includes('.mp3') || props.accept.includes('.aac') || props.accept.includes('.m4a')) {
    return 'audio'
  }
  if (
    props.scene === 'resource_file'
    || props.scene === 'document'
    || props.scene === 'file'
    || props.scene === 'subtitle'
    || props.accept.includes('.vtt')
    || props.accept.includes('.srt')
    || props.accept.includes('.pdf')
    || props.accept.includes('.doc')
    || props.accept.includes('.ppt')
  ) {
    return 'file'
  }
  return 'image'
})

const showImagePreview = computed(() => inner.value && resolvedPreview.value === 'image')
const showVideoPreview = computed(() => inner.value && resolvedPreview.value === 'video')
const showAudioPreview = computed(() => inner.value && resolvedPreview.value === 'audio')
const showFilePreview = computed(() => inner.value && resolvedPreview.value === 'file')

/*
 * 音视频落库的是不带签名的原始地址；CDN 开启 URL 鉴权后直接当 src 用会 403
 * （表现为音频弹「无法播放」红字、视频一片黑）。预览一律先找后端换短时签名地址，
 * 表单保存的值保持原始地址不变。图片目录不在鉴权范围，无需换。
 */
const previewSrc = ref('')
let previewSeq = 0

watch(
  [inner, resolvedPreview],
  ([url, mode]) => {
    previewSeq += 1
    const seq = previewSeq
    if (!url || (mode !== 'audio' && mode !== 'video') || !/^https?:\/\//i.test(url)) {
      previewSrc.value = url || ''
      return
    }
    previewSrc.value = ''
    fetchPreviewUrl(url)
      .then((signed) => {
        if (seq === previewSeq) previewSrc.value = signed || url
      })
      .catch(() => {
        if (seq === previewSeq) previewSrc.value = url
      })
  },
  { immediate: true }
)

/*
 * 落库的是 OSS 对象名（32 位 hex），刷新页面后本次会话的 originalName 就没了，
 * 预览框只能退回「PDF 文件」这种占位——老师无从确认自己传的是哪一版。
 * 所以打开已有记录时向后端反查一次上传元信息；老库没有记录时返回空，行为与从前一致。
 */
const fileMeta = ref<UploadFileMeta>({})
let metaSeq = 0

watch(
  [inner, resolvedPreview],
  ([url, mode]) => {
    metaSeq += 1
    const seq = metaSeq
    fileMeta.value = {}
    if (!url || mode === 'image' || mode === 'none' || !/^https?:\/\//i.test(url)) return
    fetchFileMeta(url).then((meta) => {
      if (seq === metaSeq) fileMeta.value = meta || {}
    })
  },
  { immediate: true }
)

const previewLabel = computed(() => formatUploadPreviewLabel({
  url: inner.value,
  // 本次会话刚传的优先，其次库里记的原名，最后才是调用方给的资源标题
  originalName: originalName.value || fileMeta.value.originalName || '',
  displayName: props.displayName
}))

const fileBadge = computed(() => formatFileBadge({
  url: inner.value,
  originalName: originalName.value || fileMeta.value.originalName || ''
}))

const fileMetaLine = computed(() => formatFileMetaLine({
  sizeBytes: fileMeta.value.sizeBytes,
  uploadedAt: fileMeta.value.uploadedAt
}))

const fileExt = computed(() => extractFileExtension(
  originalName.value || fileMeta.value.originalName || extractFileNameFromUrl(inner.value) || inner.value
))
const isSubtitleFile = computed(() => fileExt.value === 'vtt' || fileExt.value === 'srt')

/*
 * 「打开预览」必须懒签：签名地址是短时的，渲染时就签好，等老师真去点时可能已经过期。
 * window.open 要先同步开好空窗口再改 location，否则 await 之后调用会被弹窗拦截器拦掉。
 */
const openingFile = ref(false)

async function openFileInNewTab() {
  if (!inner.value || openingFile.value) return
  const win = window.open('', '_blank')
  openingFile.value = true
  try {
    const signed = await fetchPreviewUrl(inner.value)
    const href = signed || inner.value
    if (win) {
      win.location.href = href
    } else {
      // 弹窗被拦时退回当前标签页打开，总比什么都不发生强
      window.location.href = href
    }
  } catch {
    win?.close()
    ElMessage.error('无法打开预览，请稍后重试')
  } finally {
    openingFile.value = false
  }
}

const subtitleCues = ref<{ start: string; end: string; text: string }[]>([])
const subtitleTotal = ref(0)
const subtitleTruncated = ref(false)
const subtitleLoading = ref(false)
const subtitleLoaded = ref(false)
const subtitleError = ref('')
let subtitleSeq = 0

watch(
  [inner, isSubtitleFile],
  ([url, isSubtitle]) => {
    subtitleSeq += 1
    const seq = subtitleSeq
    subtitleCues.value = []
    subtitleTotal.value = 0
    subtitleTruncated.value = false
    subtitleLoaded.value = false
    subtitleError.value = ''
    if (!url || !isSubtitle || !/^https?:\/\//i.test(url)) return
    subtitleLoading.value = true
    fetchSubtitlePreview(url)
      .then((res) => {
        if (seq !== subtitleSeq) return
        const parsed = parseSubtitleCues(res.text, 2)
        subtitleCues.value = parsed.cues
        subtitleTotal.value = parsed.total
        subtitleTruncated.value = res.truncated
        subtitleLoaded.value = true
      })
      .catch(() => {
        if (seq === subtitleSeq) subtitleError.value = '字幕读取失败，无法预览内容'
      })
      .finally(() => {
        if (seq === subtitleSeq) subtitleLoading.value = false
      })
  },
  { immediate: true }
)

const subtitleCountText = computed(() =>
  subtitleTruncated.value
    ? `已读取前 ${subtitleTotal.value} 条（文件较大，未读完）`
    : `共 ${subtitleTotal.value} 条`
)

/*
 * 语音第二行：文件名 · 时长 · 大小。
 * 时长不是装饰——展馆表单紧挨着有个「时长说明」要老师自己听一遍手打，
 * 这里读出来后 emit 出去让表单回填，跟资源大小/课程时长的自动带出是同一套做法。
 */
const audioDurationText = ref('')

function onAudioLoadedMetadata(e: Event) {
  const el = e.target as HTMLAudioElement | null
  const seconds = el?.duration
  if (!Number.isFinite(seconds) || !seconds || seconds <= 0) return
  audioDurationText.value = formatDurationClock(seconds)
  emit('duration', { seconds, text: audioDurationText.value })
}

const audioSummary = computed(() => {
  const parts = [previewLabel.value]
  if (audioDurationText.value) parts.push(audioDurationText.value)
  const meta = fileMetaLine.value
  if (meta) parts.push(meta)
  return parts.filter(Boolean).join(' · ')
})

const isVideoScene = computed(() =>
  props.scene === 'video' || props.scene === 'course' || props.scene === 'resource'
)

const resolvedHint = computed(() => {
  if (isVideoScene.value) {
    const max = capabilities.value?.videoMaxBytes || PROXY_MAX_BYTES
    const direct = capabilities.value?.directUploadEnabled
    const limit = `支持 MP4 / MOV（请用 H.264 + AAC），单文件不超过 ${formatByteLimit(max) || '200MB'}`
    if (direct) {
      return `${limit}。大视频由浏览器直传，中断或刷新后无法续传，请保持页面打开；超过约 1 小时须重新上传`
    }
    return `${limit}；大视频请保持页面不要关闭`
  }
  return props.hint
})

onMounted(() => {
  void loadCapabilities()
  restorePending()
})

onUnmounted(() => {
  ossAbort?.abort()
})

async function loadCapabilities() {
  try {
    capabilities.value = await fetchUploadCapabilities()
  } catch {
    capabilities.value = {
      directUploadEnabled: false,
      videoMaxBytes: PROXY_MAX_BYTES,
      proxyMaxBytes: PROXY_MAX_BYTES,
      imageMaxBytes: 20 * 1024 * 1024,
      subtitleMaxBytes: 10 * 1024 * 1024
    }
  }
}

watch(() => props.modelValue, (v) => {
  const next = v || ''
  if (next !== inner.value) {
    originalName.value = ''
    stopAudioPreview()
  }
  inner.value = next
  audioError.value = false
})

watch(() => props.fitMode, (v) => {
  fitMode.value = v === 'fit' ? 'fit' : 'fill'
})

watch(fitMode, (v) => {
  emit('update:fitMode', v === 'fit' ? 'fit' : 'fill')
})

function errorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: string }).message === 'string') {
    return (e as { message: string }).message
  }
  return e instanceof Error ? e.message : ''
}

function resolveUploadError(e: unknown): string {
  const text = errorMessage(e)
  if (e && typeof e === 'object') {
    const body = e as { message?: string; code?: string | number }
    if (typeof body.message === 'string' && body.message.trim() && typeof body.code === 'number') {
      return body.message
    }
    if (body.code === 'ECONNABORTED' || /timeout/i.test(text)) {
      return '上传超时。大视频请保持页面不要关闭，并检查网络后重试'
    }
  }
  if (/oss-direct/i.test(text)) {
    return '直传失败，请检查网络或联系运维确认 OSS 跨域后重试'
  }
  if (/[\u4e00-\u9fff]/.test(text)) {
    return text
  }
  return '上传失败，请检查文件格式与大小，或联系技术人员协助'
}

function isOversizeError(e: unknown): boolean {
  return /不能超过|过大|上限/.test(errorMessage(e))
}

function proxyMaxBytes(): number {
  return capabilities.value?.proxyMaxBytes || PROXY_MAX_BYTES
}

function videoMaxBytes(): number {
  return capabilities.value?.videoMaxBytes || PROXY_MAX_BYTES
}

function shouldTryDirect(file: File): boolean {
  return isDirectUploadCandidate(props.scene, file.name) && !!capabilities.value?.directUploadEnabled
}

function throwIfTooLargeForProxy(file: File, cause?: unknown): void {
  if (file.size <= proxyMaxBytes()) {
    return
  }
  const detail = errorMessage(cause)
  throw new Error(
    detail || `直传未成功，该文件超过服务器中转上限（${formatByteLimit(proxyMaxBytes()) || '200MB'}）。请确认 OSS 跨域已配置后再试`
  )
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function isAbortError(e: unknown): boolean {
  return /已取消/.test(errorMessage(e))
}

function persistPending(payload: { scene: string; objectKey: string; size: number; fileName: string }) {
  const record = { ...payload, uploadedAt: Date.now() }
  pendingComplete.value = record
  try {
    localStorage.setItem(DIRECT_PENDING_KEY, JSON.stringify(record))
  } catch {
    /* 无痕模式等写不了也不阻断确认 */
  }
}

function restorePending() {
  try {
    pendingComplete.value = pendingForScene(
      parseDirectPending(localStorage.getItem(DIRECT_PENDING_KEY)),
      props.scene
    )
  } catch {
    pendingComplete.value = null
  }
}

function discardPendingComplete() {
  pendingComplete.value = null
  try {
    const current = parseDirectPending(localStorage.getItem(DIRECT_PENDING_KEY))
    if (!current || current.scene === props.scene) {
      localStorage.removeItem(DIRECT_PENDING_KEY)
    }
  } catch {
    localStorage.removeItem(DIRECT_PENDING_KEY)
  }
}

function cancelOssUpload() {
  ossAbort?.abort()
}

async function completeDirect(scene: string, key: string, size: number): Promise<UploadResult> {
  let last: unknown
  for (let i = 0; i < 2; i++) {
    try {
      return await completeDirectUpload(scene, key, size)
    } catch (e) {
      last = e
      if (i === 0) {
        await sleep(800)
      }
    }
  }
  throw last instanceof Error ? last : new Error('文件已传到云存储但确认失败，请稍后重试')
}

async function applyUploadResult(res: UploadResult, fileName: string, file?: File, sizeBytes?: number) {
  discardPendingComplete()
  inner.value = res.url
  emit('update:modelValue', res.url)
  originalName.value = fileName || ''
  emit('uploaded', {
    url: res.url,
    sizeBytes: file?.size ?? sizeBytes ?? 0,
    fileName: fileName || '',
    file
  })
  if (res.compatWarning) {
    ElMessage.warning(res.compatWarning)
  } else {
    ElMessage.success('上传成功')
  }
}

async function retryPendingComplete() {
  const pending = pendingComplete.value
  if (!pending) {
    return
  }
  uploading.value = true
  uploadError.value = ''
  try {
    const res = await completeDirect(pending.scene, pending.objectKey, pending.size)
    await applyUploadResult(res, pending.fileName, undefined, pending.size)
  } catch (e) {
    uploadError.value = errorMessage(e) || '确认失败，请稍后重试。不要重新上传整个文件'
  } finally {
    uploading.value = false
  }
}

async function uploadWithFallback(file: File): Promise<UploadResult> {
  if (!shouldTryDirect(file)) {
    return uploadFile(file, props.scene)
  }
  let policy: DirectPolicy
  try {
    policy = await fetchDirectPolicy(props.scene, file.name, file.size)
  } catch (e) {
    if (isOversizeError(e)) {
      throw e
    }
    throwIfTooLargeForProxy(file, e)
    if (!isDirectUploadDisabledError(e)) {
      ElMessage.warning('直传未成功，已改为服务器中转')
    }
    return uploadFile(file, props.scene)
  }
  ossAbort?.abort()
  ossAbort = new AbortController()
  try {
    uploadPercent.value = 0
    await postFileToOss(policy, file, (percent) => {
      uploadPercent.value = percent
    }, ossAbort.signal)
  } catch (e) {
    if (isAbortError(e)) {
      throw e
    }
    throwIfTooLargeForProxy(file, e)
    ElMessage.warning('直传未成功，已改为服务器中转')
    uploadPercent.value = null
    return uploadFile(file, props.scene)
  }
  uploadPercent.value = Math.max(uploadPercent.value || 0, 99)
  persistPending({
    scene: props.scene,
    objectKey: policy.key,
    size: file.size,
    fileName: file.name || ''
  })
  try {
    const result = await completeDirect(props.scene, policy.key, file.size)
    uploadPercent.value = 100
    return result
  } catch (e) {
    throw new Error(errorMessage(e) || '文件已传到云存储但确认失败，请点击「重新确认」，不要重新选文件')
  }
}

async function handleUpload(options: UploadRequestOptions) {
  const file = options.file as File
  if (!file) return
  uploading.value = true
  uploadPercent.value = null
  uploadError.value = ''
  discardPendingComplete()
  try {
    if (!capabilities.value) {
      await loadCapabilities()
    }
    if (isDirectUploadCandidate(props.scene, file.name) && file.size > videoMaxBytes()) {
      throw new Error(`视频不能超过 ${formatByteLimit(videoMaxBytes()) || '200MB'}`)
    }
    const res = await uploadWithFallback(file)
    await applyUploadResult(res, file.name || '', file)
    options.onSuccess?.(res)
  } catch (e) {
    uploadError.value = resolveUploadError(e)
  } finally {
    uploading.value = false
    uploadPercent.value = null
    ossAbort = null
  }
}

function stopAudioPreview() {
  const el = audioEl.value
  if (el) {
    el.pause()
    el.currentTime = 0
  }
}

function clear() {
  stopAudioPreview()
  inner.value = ''
  originalName.value = ''
  audioError.value = false
  audioDurationText.value = ''
  emit('update:modelValue', '')
}
</script>

<style scoped lang="scss">
.oss-upload {
  width: 100%;
}

/*
 * 预览块与操作列放不下就整行换行，别硬挤。
 *
 * 资源管理是最窄的弹窗（600px，减去 20x2 内边距与 100px 标签只剩 460px），
 * 320px 的文件卡又不许收缩，操作列就只剩 126px——那条最长的格式说明被压成 6 行、
 * 108px 高的细长条，文件卡右边一片空白（实测卡片下方空出 133px）。
 * 学院管理 640px 同样中招，只是轻一些（空 31px）。
 *
 * 阈值不是拍的：操作按钮行的自然宽度实测 239px，配 .controls 的 min-width: 240px，
 * 于是并排需要 320 + 14 + 240 = 574px。资源(460)、学院(500)换行，
 * 课程(580)、展馆/文创(612)维持并排不受影响。
 */
.oss-upload-body {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.preview-wrap {
  flex-shrink: 0;
  /*
   * 这个项目没有全局 border-box，各预览块的 width 与 padding/border 会叠加。
   * 语音块（width:100% + padding:10px）因此在 460px 的资源弹窗里实测撑到 482px 横向溢出。
   * 统一在基类上定死，省得每加一个变体就踩一次。
   */
  box-sizing: border-box;
  width: 148px;
  height: 96px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.preview-wrap--fit {
  background: #f0f2f5;
}

/* 200x112 时原生控件条几乎盖满画面，等于没有预览；16:9 放到 320x180 才看得见内容 */
.preview-wrap--video {
  width: 320px;
  max-width: 100%;
  height: 180px;
}

/*
 * 语音播放器独占一行。与上传按钮横排时留给 <audio> 的净宽只有约 200px，
 * Chromium 在这个宽度下会把总时长和时间轴一起裁掉。
 * 铺满整行后不依赖魔法宽度，弹窗变窄也不会退化。
 */
/* 换行由 .oss-upload-body 统一负责；这里只负责把播放器撑满整行（哪怕并排放得下） */
.oss-upload-body--audio .preview-wrap--audio {
  width: 100%;
}

.preview-wrap--audio {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 8px;
  width: 280px;
  height: auto;
  min-height: 88px;
  padding: 10px;
  overflow: visible;
}

.audio-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-audio {
  flex: 1;
  min-width: 0;
  height: 40px;
}

/*
 * 文档预览：从 148px 方块改成横向卡片。
 * 文件名是横向的东西，塞进方块里必然折行折得难看；而方块里原本只有一个通用图标
 * 加一行「PDF 文件」，刷新之后连传的是哪一份都看不出来。
 */
.preview-wrap--file {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /*
   * 320px 只是「起始宽度」不是死宽：换行独占一行时要涨满，
   * 否则卡片右边又留一块空白——那正是这次要修的观感问题。
   * 图片/视频预览不这么做：它们有固定比例，拉伸反而不对。
   */
  flex: 1 1 320px;
  min-width: 260px;
  max-width: 100%;
  height: auto;
  padding: 10px;
  background: var(--el-bg-color);
  overflow: visible;
}

.file-card {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

/* 分色角标：PDF/Word/PPT/Excel/字幕 一眼可分，之前全是同一个蓝色 Document 图标 */
.file-badge {
  flex: 0 0 38px;
  height: 46px;
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 5px;
  font: 700 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.3px;
  color: #fff;
  background: var(--el-color-info);
}
.file-badge--pdf { background: #e2483d; }
.file-badge--word { background: #2b5797; }
.file-badge--ppt { background: #d24726; }
.file-badge--excel { background: #217346; }
.file-badge--subtitle { background: #7a869a; }
.file-badge--media { background: #6b4fbb; }
.file-badge--generic { background: #909399; }

.file-meta {
  flex: 1;
  min-width: 0;
}

/* 长文件名截两行，完整名字挂在 title 上悬浮可见 */
.file-title {
  font-size: 13px;
  color: var(--el-text-color-primary);
  line-height: 1.35;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.file-sub {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 3px;
}

.file-open {
  margin-top: 3px;
  height: auto;
  padding: 0;
  font-size: 12px;
}

/* 字幕：把前两条摆出来。ASR 产出的空文件 / 乱码，只有这样才看得见 */
.subtitle-box {
  border-top: 1px dashed var(--el-border-color-light);
  padding-top: 8px;
}

.subtitle-count {
  margin: 0 0 6px;
}

.subtitle-cues {
  background: var(--el-fill-color-light);
  border-radius: 4px;
  padding: 7px 9px;
}

.subtitle-cue + .subtitle-cue {
  margin-top: 5px;
}

.subtitle-time {
  display: block;
  font: 11px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--el-text-color-placeholder);
}

.subtitle-text {
  display: block;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  word-break: break-all;
}

.preview-loading {
  margin: 0;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.preview-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #111;
}

/* 语音预览下方那行「文件名 · 时长 · 大小」；文档走 .file-card，不再共用这条 */
.file-name {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
  line-height: 1.3;
}

.controls {
  /* 按钮行自然宽度实测 239px；低于这个数按钮自己会折行，所以宁可整块换行 */
  flex: 1 1 240px;
  min-width: 240px;
}

.row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.upload-progress {
  margin-top: 8px;
  max-width: 360px;
}

.fit-mode {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

.fit-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.status-ok {
  font-size: 13px;
  color: var(--el-color-success);
}

.hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.aspect-hint {
  color: var(--el-color-primary);
}

.hint.error {
  color: var(--el-color-danger);
}

.pending-complete {
  margin-top: 8px;
  padding: 8px 10px;
  border: 1px dashed var(--el-color-warning);
  border-radius: 8px;
  background: var(--el-color-warning-light-9);
}
</style>
