<template>
  <div class="page-card">
    <div class="page-header">
      <h2>内容配置</h2>
      <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
    </div>

    <p class="text-muted">
      维护小程序「关于云端书院」与「隐私与用户协议」页展示的内容。修改后无需发版即时生效。
    </p>

    <div v-loading="loading" class="doc-body">
      <!-- 关于页 -->
      <el-divider content-position="left">关于页</el-divider>
      <el-form label-width="88px" class="about-form">
        <el-form-item label="书院简介">
          <el-input v-model="form.intro" type="textarea" :rows="4" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="联系地址">
          <el-input v-model="form.address" maxlength="100" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" maxlength="40" />
        </el-form-item>
        <el-form-item label="联系邮箱">
          <el-input v-model="form.email" maxlength="100" />
        </el-form-item>
        <el-form-item label="备案号">
          <el-input v-model="form.icp" maxlength="100" placeholder="如：黔ICP备xxxxxxxx号（留空则不展示）" />
        </el-form-item>
      </el-form>

      <!-- 协议 -->
      <el-divider content-position="left">协议</el-divider>
      <div class="doc-block">
        <div class="doc-label">隐私政策</div>
        <WangEditor v-model="form.privacy" min-height="240px" placeholder="请输入隐私政策内容" />
      </div>
      <div class="doc-block">
        <div class="doc-label">用户协议</div>
        <WangEditor v-model="form.agreement" min-height="240px" placeholder="请输入用户协议内容" />
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
const form = reactive({
  privacy: '',
  agreement: '',
  intro: '',
  address: '',
  phone: '',
  email: '',
  icp: ''
})

async function load() {
  loading.value = true
  try {
    const res = await fetchContentDocs()
    form.privacy = res.privacy || ''
    form.agreement = res.agreement || ''
    const a = res.about || { intro: '', address: '', phone: '', email: '', icp: '' }
    form.intro = a.intro || ''
    form.address = a.address || ''
    form.phone = a.phone || ''
    form.email = a.email || ''
    form.icp = a.icp || ''
  } finally {
    loading.value = false
  }
}

async function onSave() {
  saving.value = true
  try {
    await saveContentDocs({ ...form })
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
.about-form {
  max-width: 720px;
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
