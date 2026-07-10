<template>
  <div class="oss-upload">
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
    <p v-if="hint" class="hint">{{ hint }}</p>
    <p v-if="uploadError" class="hint error">{{ uploadError }}</p>
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
  uploadLabel?: string
  doneText?: string
  hint?: string
}>(), {
  modelValue: '',
  scene: 'image',
  accept: 'image/*',
  uploadLabel: '上传文件',
  doneText: '已上传',
  hint: '上传后小程序端自动展示；若按钮不可用请联系技术人员'
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const inner = ref(props.modelValue || '')
const uploading = ref(false)
const uploadError = ref('')

watch(() => props.modelValue, (v) => {
  inner.value = v || ''
})

async function handleUpload(options: UploadRequestOptions) {
  const file = options.file as File
  if (!file) return
  uploading.value = true
  uploadError.value = ''
  try {
    const res = await uploadFile(file, props.scene)
    inner.value = res.url
    emit('update:modelValue', res.url)
    ElMessage.success('上传成功')
    options.onSuccess?.(res)
  } catch {
    uploadError.value = '上传失败，请检查文件格式与大小，或联系技术人员协助'
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

function clear() {
  inner.value = ''
  emit('update:modelValue', '')
}
</script>

<style scoped>
.oss-upload { width: 100%; }
.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.status-ok { font-size: 13px; color: var(--el-color-success); }
.hint { margin: 6px 0 0; font-size: 12px; color: var(--el-text-color-secondary); }
.hint.error { color: var(--el-color-danger); }
</style>
