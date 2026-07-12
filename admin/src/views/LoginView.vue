<template>
  <div class="login-page">
    <div class="login-card">
      <!-- 左侧品牌区 -->
      <div class="brand-side">
        <div class="stars"></div>
        <div class="brand-inner">
          <div class="seal"><img :src="shuMark" alt="书" /></div>
          <h1 class="brand-title">云端书院</h1>
          <div class="brand-divider"><span></span>❖<span></span></div>
          <p class="brand-sub">贵州交通职业大学 · 中华文化书院</p>
          <ul class="brand-feats">
            <li><el-icon><Document /></el-icon> 内容 · 展馆 · 文创统一管理</li>
            <li><el-icon><Calendar /></el-icon> 活动发布与报名审核导出</li>
            <li><el-icon><VideoCamera /></el-icon> 课程字幕与资源配套维护</li>
          </ul>
        </div>
        <div class="brand-foot">“马院 + 书院”协同育人 · 云端思政平台</div>
        <svg class="wave" viewBox="0 0 400 120" preserveAspectRatio="none">
          <path d="M0 70 Q60 40 120 66 T240 66 T400 54 V120 H0 Z" fill="#D0E7F7" opacity="0.14" />
          <path d="M0 92 Q70 68 150 88 T300 86 T400 78 V120 H0 Z" fill="#9CB6E8" opacity="0.12" />
        </svg>
      </div>

      <!-- 右侧表单区 -->
      <div class="form-side">
        <div class="form-head">
          <h2>管理员登录</h2>
          <p>请使用后台账号登录管理系统</p>
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
            登 录
          </el-button>
        </el-form>

        <p class="hint">开发环境默认账号 admin / Admin@123<br />生产环境请使用独立超管账号，并禁用默认 admin<br />连续 5 次密码错误将锁定 5 分钟</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Document, Calendar, VideoCamera } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import shuMark from '@/assets/brand-shu.png'

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
  background: radial-gradient(120% 88% at 50% 12%, #233362 0%, #2b356e 60%, #1e2654 100%);
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 860px;
  min-height: 500px;
  display: flex;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(12, 16, 36, 0.45);
}

/* 品牌区 */
.brand-side {
  position: relative;
  width: 46%;
  padding: 48px 40px;
  color: #fff;
  background: linear-gradient(160deg, #233362 0%, #2b356e 55%, #1e2654 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1.5px 1.5px at 20% 22%, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1.5px 1.5px at 70% 16%, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(1.5px 1.5px at 84% 40%, rgba(255, 255, 255, 0.45), transparent),
    radial-gradient(1.5px 1.5px at 35% 60%, rgba(255, 255, 255, 0.35), transparent);
  opacity: 0.7;
}
.brand-inner {
  position: relative;
  z-index: 2;
  flex: 1;
}
.seal {
  width: 66px;
  height: 66px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(201, 162, 39, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 32px rgba(150, 180, 235, 0.35);
}
.seal img {
  height: 40px;
  width: auto;
  display: block;
}
.brand-title {
  margin: 22px 0 0;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: 4px;
  font-family: KaiTi, STKaiti, 'STSong', serif;
}
.brand-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0;
  color: #c9a227;
  font-size: 13px;

  span {
    height: 1px;
    width: 40px;
    background: linear-gradient(90deg, transparent, rgba(201, 162, 39, 0.8));

    &:last-child {
      background: linear-gradient(90deg, rgba(201, 162, 39, 0.8), transparent);
    }
  }
}
.brand-sub {
  margin: 0;
  font-size: 13px;
  color: rgba(214, 224, 248, 0.9);
  letter-spacing: 1px;
}
.brand-feats {
  list-style: none;
  padding: 0;
  margin: 40px 0 0;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13.5px;
    color: rgba(214, 224, 248, 0.88);
    margin-bottom: 18px;

    .el-icon {
      color: #f0dca0;
    }
  }
}
.brand-foot {
  position: relative;
  z-index: 2;
  font-size: 12px;
  color: rgba(170, 184, 224, 0.7);
  letter-spacing: 1px;
}
.wave {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 120px;
  z-index: 1;
}

/* 表单区 */
.form-side {
  flex: 1;
  padding: 56px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.form-head {
  margin-bottom: 28px;

  h2 {
    margin: 0 0 6px;
    font-size: 24px;
    color: var(--brand-ink);
    font-weight: 700;
  }
  p {
    margin: 0;
    font-size: 13px;
    color: var(--brand-muted);
  }
}
.submit-btn {
  width: 100%;
  margin-top: 10px;
  height: 46px;
  font-size: 16px;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #3f57b5, #2b356e);
  border: none;

  &:hover {
    background: linear-gradient(135deg, #4a63c4, #323d7d);
  }
}
.hint {
  margin: 22px 0 0;
  text-align: center;
  font-size: 12px;
  color: #c0c4cc;
  line-height: 1.7;
}

@media (max-width: 720px) {
  .brand-side {
    display: none;
  }
  .login-card {
    max-width: 420px;
    min-height: 0;
  }
}
</style>
