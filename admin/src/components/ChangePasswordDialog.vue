<template>
  <el-dialog
    v-model="visible"
    :title="forced ? '首次登录须修改密码' : '修改密码'"
    width="480px"
    :close-on-click-modal="!forced"
    :close-on-press-escape="!forced"
    :show-close="!forced"
    destroy-on-close
  >
    <p v-if="forced" class="text-muted">
      为保障账号安全，请设置符合强度要求的新密码后再继续使用后台。
    </p>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
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
    </el-form>
    <template #footer>
      <el-button v-if="!forced" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="onSubmit">保存新密码</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { PASSWORD_HINT } from '@/utils/permissions'

const props = defineProps<{
  modelValue: boolean
  forced?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const auth = useAuthStore()
const visible = ref(props.modelValue)
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
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
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_r, v, cb) => {
        if (v !== form.newPassword) cb(new Error('两次输入不一致'))
        else cb()
      },
      trigger: 'blur'
    }
  ]
}

watch(
  () => props.modelValue,
  (v) => {
    visible.value = v
    if (v) {
      form.oldPassword = ''
      form.newPassword = ''
      form.confirmPassword = ''
    }
  }
)

watch(visible, (v) => emit('update:modelValue', v))

async function onSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await auth.changePassword(form.oldPassword, form.newPassword)
    ElMessage.success('密码已更新')
    visible.value = false
    emit('success')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #909399;
}
</style>
