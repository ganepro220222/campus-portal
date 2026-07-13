<template>
  <div class="page-card">
    <div class="page-header">
      <h2>协议内容</h2>
      <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
    </div>

    <p class="text-muted">
      维护小程序「隐私与用户协议」页展示的内容。修改后无需发版即时生效；正式文本请以校方法务审定稿为准。
    </p>

    <div v-loading="loading" class="doc-body">
      <div class="doc-block">
        <div class="doc-label">隐私政策</div>
        <WangEditor v-model="form.privacy" min-height="260px" placeholder="请输入隐私政策内容" />
      </div>
      <div class="doc-block">
        <div class="doc-label">用户协议</div>
        <WangEditor v-model="form.agreement" min-height="260px" placeholder="请输入用户协议内容" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import WangEditor from '@/components/WangEditor.vue'
import { fetchContentDocs, saveContentDocs } from '@/api/contentDoc'

const loading = ref(false)
const saving = ref(false)
const form = reactive({ privacy: '', agreement: '' })

async function load() {
  loading.value = true
  try {
    const res = await fetchContentDocs()
    form.privacy = res.privacy || ''
    form.agreement = res.agreement || ''
  } finally {
    loading.value = false
  }
}

async function onSave() {
  saving.value = true
  try {
    await saveContentDocs({ privacy: form.privacy, agreement: form.agreement })
    ElMessage.success('已保存，小程序端即时生效')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped lang="scss">
.doc-body {
  margin-top: 8px;
}
.doc-block {
  margin-bottom: 22px;
}
.doc-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--brand-primary);
  margin-bottom: 10px;
}
</style>
