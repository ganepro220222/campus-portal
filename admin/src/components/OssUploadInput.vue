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
          <el-button size="small" :disabled="!previewSrc" @click="toggleAudioPreview">{{ audioPlaying ? '暂停' : '试听' }}</el-button>
          <audio
            v-if="previewSrc"
            ref="audioEl"
            :src="previewSrc"
            class="preview-audio"
            controls
            preload="metadata"
            @play="audioPlaying = true"
            @pause="audioPlaying = false"
            @ended="audioPlaying = false"
            @error="audioError = true"
          />
        </div>
        <span class="file-name">{{ previewLabel }}</span>
        <p v-if="audioError" class="hint error">语音无法播放，请重新上传或换 MP3</p>
      </div>
      <div v-else-if="showFilePreview" class="preview-wrap preview-wrap--file">
        <el-icon class="file-icon"><Document /></el-icon>
        <span class="file-name">{{ previewLabel }}</span>
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
          <span v-if="inner" class="status-ok">{{ doneText }}</span>
          <el-button v-if="inner" link type="danger" @click="clear">重新上传</el-button>
        </div>
        <el-progress
          v-if="uploading && uploadPercent != null"
          class="upload-progress"
          :percentage="uploadPercent"
          :stroke-width="8"
        />
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
import { computed, onMounted, ref, watch } from 'vue'
import { Document } from '@element-plus/icons-vue'
import { ElMessage, type UploadRequestOptions } from 'element-plus'
import {
  completeDirectUpload,
  fetchDirectPolicy,
  fetchPreviewUrl,
  fetchUploadCapabilities,
  isDirectUploadDisabledError,
  postFileToOss,
  uploadFile,
  type DirectPolicy,
  type UploadCapabilities,
  type UploadResult
} from '@/api/upload'
import type { CoverFitMode } from '@/utils/cover'
import {
  formatByteLimit,
  formatUploadPreviewLabel,
  isDirectUploadCandidate
} from '@/utils/uploadMeta.mjs'

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
  uploaded: [payload: { url: string; sizeBytes: number; fileName: string; file: File }]
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
const audioPlaying = ref(false)
const audioError = ref(false)

const resolvedPreview = computed<PreviewMode>(() => {
  if (props.preview !== 'auto') return props.preview
  if (props.scene === 'video' || props.accept.includes('video/')) return 'video'
  if (props.scene === 'audio' || props.accept.includes('audio/') || props.accept.includes('.mp3')) {
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

const previewLabel = computed(() => formatUploadPreviewLabel({
  url: inner.value,
  originalName: originalName.value,
  displayName: props.displayName
}))

const isVideoScene = computed(() =>
  props.scene === 'video' || props.scene === 'course' || props.scene === 'resource'
)

const resolvedHint = computed(() => {
  if (isVideoScene.value) {
    const max = capabilities.value?.videoMaxBytes || PROXY_MAX_BYTES
    return `支持 MP4 / MOV，单文件不超过 ${formatByteLimit(max) || '200MB'}；大视频请保持页面不要关闭`
  }
  return props.hint
})

onMounted(() => {
  void loadCapabilities()
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

async function completeDirect(scene: string, key: string, size: number): Promise<UploadResult> {
  try {
    return await completeDirectUpload(scene, key, size)
  } catch {
    return await completeDirectUpload(scene, key, size)
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
  try {
    uploadPercent.value = 0
    await postFileToOss(policy, file, (percent) => {
      uploadPercent.value = percent
    })
  } catch (e) {
    throwIfTooLargeForProxy(file, e)
    ElMessage.warning('直传未成功，已改为服务器中转')
    uploadPercent.value = null
    return uploadFile(file, props.scene)
  }
  uploadPercent.value = Math.max(uploadPercent.value || 0, 99)
  try {
    const result = await completeDirect(props.scene, policy.key, file.size)
    uploadPercent.value = 100
    return result
  } catch (e) {
    throw new Error(errorMessage(e) || '文件已传到云存储但确认失败，请稍后重试')
  }
}

async function handleUpload(options: UploadRequestOptions) {
  const file = options.file as File
  if (!file) return
  uploading.value = true
  uploadPercent.value = null
  uploadError.value = ''
  try {
    if (!capabilities.value) {
      await loadCapabilities()
    }
    if (isDirectUploadCandidate(props.scene, file.name) && file.size > videoMaxBytes()) {
      throw new Error(`视频不能超过 ${formatByteLimit(videoMaxBytes()) || '200MB'}`)
    }
    const res = await uploadWithFallback(file)
    inner.value = res.url
    emit('update:modelValue', res.url)
    originalName.value = file.name || ''
    emit('uploaded', {
      url: res.url,
      sizeBytes: file.size,
      fileName: file.name || '',
      file
    })
    ElMessage.success('上传成功')
    options.onSuccess?.(res)
  } catch (e) {
    uploadError.value = resolveUploadError(e)
  } finally {
    uploading.value = false
    uploadPercent.value = null
  }
}

function stopAudioPreview() {
  const el = audioEl.value
  if (el) {
    el.pause()
    el.currentTime = 0
  }
  audioPlaying.value = false
}

function toggleAudioPreview() {
  const el = audioEl.value
  if (!el) return
  audioError.value = false
  if (el.paused) {
    el.play().catch(() => {
      audioError.value = true
    })
    return
  }
  el.pause()
}

function clear() {
  stopAudioPreview()
  inner.value = ''
  originalName.value = ''
  audioError.value = false
  emit('update:modelValue', '')
}
</script>

<style scoped lang="scss">
.oss-upload {
  width: 100%;
}

.oss-upload-body {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.preview-wrap {
  flex-shrink: 0;
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
.oss-upload-body--audio {
  flex-wrap: wrap;
}

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

/* .file-name 默认居中是给文件图标那版用的；铺满整行后居中会飘到播放器正中间 */
.preview-wrap--audio .file-name {
  text-align: left;
}

.preview-audio {
  flex: 1;
  min-width: 0;
  height: 40px;
}

.preview-wrap--file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  height: auto;
  min-height: 72px;
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

.file-icon {
  font-size: 22px;
  color: var(--el-color-primary);
}

.file-name {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-align: center;
  word-break: break-all;
  line-height: 1.3;
}

.controls {
  flex: 1;
  min-width: 0;
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
</style>
