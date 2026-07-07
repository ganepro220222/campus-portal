<template>
  <div class="oss-upload">
    <div class="row">
      <el-input v-model="inner" :placeholder="placeholder" clearable @update:model-value="onInput" />
      <el-upload
        :show-file-list="false"
        :http-request="handleUpload"
        :accept="accept"
        :disabled="uploading"
      >
        <el-button :loading="uploading" type="primary">上传</el-button>
      </el-upload>
    </div>
    <p v-if="hint" class="hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, type UploadRequestOptions } from 'element-plus'
import { uploadFile } from '@/api/upload'

const props = withDefaults(defineProps<{
  modelValue?: string
  scene?: string
  accept?: string
  placeholder?: string
  hint?: string
}>(), {
  modelValue: '',
  scene: 'image',
  accept: '*/*',
  placeholder: '上传或粘贴 CDN 地址',
  hint: '未配置 OSS 时可手动粘贴 CDN 地址'
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const inner = ref(props.modelValue || '')
const uploading = ref(false)

watch(() => props.modelValue, (v) => {
  inner.value = v || ''
})

function onInput(v: string) {
  emit('update:modelValue', v)
}

async function handleUpload(options: UploadRequestOptions) {
  const file = options.file as File
  if (!file) return
  uploading.value = true
  try {
    const res = await uploadFile(file, props.scene)
    inner.value = res.url
    emit('update:modelValue', res.url)
    ElMessage.success('上传成功')
    options.onSuccess?.(res)
  } catch (e) {
    options.onError?.(e as Error)
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.oss-upload { width: 100%; }
.row { display: flex; gap: 8px; align-items: center; }
.row :deep(.el-input) { flex: 1; }
.hint { margin: 6px 0 0; font-size: 12px; color: var(--el-text-color-secondary); }
</style>
