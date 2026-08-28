<template>
  <div class="cp-page">
    <div class="cp-card">
      <div class="cp-head">
        <h1>首次登录须修改密码</h1>
        <p>为保障账号安全，请设置符合强度要求的新密码后再继续使用后台。</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px" size="large" @submit.prevent="onSubmit">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="form.oldPassword" type="password" show-password autocomplete="current-password" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="form.newPassword" type="password" show-password autocomplete="new-password" />
          <p class="hint">{{ PASSWORD_HINT }}</p>
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password autocomplete="new-password" />
        </el-form-item>
        <el-button type="primary" class="submit-btn" :loading="saving" @click="onSubmit">保存新密码</el-button>
      </el-form>
      <p class="foot-hint">
        若不清楚当前密码（例如管理员刚重置过），可
        <el-button link type="primary" @click="onLogout">退出并切换账号</el-button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { PASSWORD_HINT } from '@/utils/permissions'

const router = useRouter()
const auth = useAuthStore()
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const rules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 12, message: '至少 12 位', trigger: 'blur' },
    {
      validator: (_r, v, cb) => {
        if (!v || !/[A-Z]/.test(v) || !/[a-z]/.test(v) || !/[0-9]/.test(v)) {
          cb(new Error('须包含大写、小写字母和数字'))
          return
        }
        cb()
      },
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_r, v, cb) => {
        if (v !== form.newPassword) cb(new Error('两次输入不一致'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await auth.changePassword(form.oldPassword, form.newPassword)
    ElMessage.success('密码已更新')
    router.replace({ name: 'Dashboard' })
  } finally {
    saving.value = false
  }
}

function onLogout() {
  auth.logout()
  router.replace({ name: 'Login' })
}
</script>

<style scoped lang="scss">
.cp-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(120% 88% at 50% 12%, #233362 0%, #2b356e 60%, #1e2654 100%);
  padding: 24px;
}
.cp-card {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: 16px;
  padding: 40px 36px 32px;
  box-shadow: 0 24px 64px rgba(12, 16, 36, 0.35);
}
.cp-head {
  margin-bottom: 24px;
  h1 {
    margin: 0 0 8px;
    font-size: 22px;
    color: var(--brand-ink);
  }
  p {
    margin: 0;
    font-size: 13px;
    color: var(--brand-muted);
    line-height: 1.6;
  }
}
.submit-btn {
  width: 100%;
  margin-top: 8px;
}
.hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #909399;
}
.foot-hint {
  margin: 20px 0 0;
  text-align: center;
  font-size: 13px;
  color: #909399;
}
</style>
