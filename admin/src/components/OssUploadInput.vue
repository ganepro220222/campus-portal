<template>
  <div class="oss-upload">
    <div class="oss-upload-body">
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
        <video :src="inner" class="preview-video" controls preload="metadata" />
      </div>
      <div v-else-if="showAudioPreview" class="preview-wrap preview-wrap--audio">
        <div class="audio-row">
          <el-button size="small" @click="toggleAudioPreview">{{ audioPlaying ? '暂停' : '试听' }}</el-button>
          <audio
            ref="audioEl"
            :src="inner"
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
        <p v-if="aspectHint" class="hint aspect-hint">{{ aspectHint }}</p>
        <div v-if="showCoverFit" class="fit-mode">
          <span class="fit-label">小程序展示</span>
          <el-radio-group v-model="fitMode" size="small">
            <el-radio-button value="fill">裁切填满</el-radio-button>
            <el-radio-button value="fit">完整显示</el-radio-button>
          </el-radio-group>
        </div>
        <p v-if="hint" class="hint">{{ hint }}</p>
        <p v-if="uploadError" class="hint error">{{ uploadError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Document } from '@element-plus/icons-vue'
import { ElMessage, type UploadRequestOptions } from 'element-plus'
import { uploadFile } from '@/api/upload'
import type { CoverFitMode } from '@/utils/cover'
import { formatUploadPreviewLabel } from '@/utils/uploadMeta.mjs'

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

const inner = ref(props.modelValue || '')
const fitMode = ref<CoverFitMode>(props.fitMode || 'fill')
const uploading = ref(false)
const uploadError = ref('')
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

const previewLabel = computed(() => formatUploadPreviewLabel({
  url: inner.value,
  originalName: originalName.value,
  displayName: props.displayName
}))

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

function resolveUploadError(e: unknown): string {
  if (e && typeof e === 'object') {
    const body = e as { message?: string; code?: string | number }
    if (typeof body.message === 'string' && body.message.trim() && typeof body.code === 'number') {
      return body.message
    }
    if (body.code === 'ECONNABORTED' || /timeout/i.test(String((e as { message?: string }).message || ''))) {
      return '上传超时。大视频请保持页面不要关闭，并检查网络后重试'
    }
  }
  return '上传失败，请检查文件格式与大小，或联系技术人员协助'
}

async function handleUpload(options: UploadRequestOptions) {
  const file = options.file as File
  if (!file) return
  uploading.value = true
  uploadError.value = ''
  try {
    const res = await uploadFile(file, props.scene)
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

.preview-wrap--video {
  width: 200px;
  height: 112px;
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
