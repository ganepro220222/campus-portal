<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="brand">
        <div class="seal">书</div>
        <h1>云端书院</h1>
        <p>管理后台 · 贵州交通职业大学</p>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" size="large" @submit.prevent="onSubmit">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="管理员账号" prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            show-password
            @keyup.enter="onSubmit"
          />
        </el-form-item>
        <el-button type="primary" class="submit-btn" :loading="loading" @click="onSubmit">
          登录
        </el-button>
      </el-form>

      <p class="hint">默认超管 admin / Admin@123（开发环境）<br />连续 5 次密码错误将锁定 5 分钟</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await auth.login(form.username.trim(), form.password)
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.replace(redirect)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(120% 88% at 50% 12%, #233362 0%, #2b356e 80%, #36427c 100%);
  padding: 24px;
}

.login-panel {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 40px 36px 32px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.brand {
  text-align: center;
  margin-bottom: 32px;

  h1 {
    margin: 12px 0 4px;
    font-size: 22px;
    color: #2b356e;
    font-family: KaiTi, STKaiti, serif;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #909399;
  }
}

.seal {
  width: 56px;
  height: 56px;
  margin: 0 auto;
  border-radius: 50%;
  background: #fff;
  border: 2px solid #c9a227;
  color: #2b356e;
  font-size: 28px;
  line-height: 52px;
  font-family: KaiTi, STKaiti, serif;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
  background: #2b356e;
  border-color: #2b356e;

  &:hover {
    background: #36427c;
    border-color: #36427c;
  }
}

.hint {
  margin: 20px 0 0;
  text-align: center;
  font-size: 12px;
  color: #c0c4cc;
}
</style>
