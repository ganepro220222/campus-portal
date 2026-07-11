<template>
  <div class="page-card">
    <div class="page-header">
      <h2>账号管理</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新建账号</el-button>
    </div>

    <p class="text-muted">
      为书院运营老师创建后台账号并分配角色。新建或重置密码后，用户首次登录须修改密码。
    </p>

    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索账号 / 姓名"
        clearable
        style="width: 220px"
        @keyup.enter="onSearch"
        @clear="onSearch"
      />
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="username" label="登录账号" min-width="160" />
      <el-table-column prop="realName" label="姓名" min-width="140" show-overflow-tooltip />
      <el-table-column prop="roleName" label="角色" min-width="150" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="须改密" width="90" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.mustChangePassword" type="warning" size="small">待修改</el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" min-width="170" />
      <el-table-column label="操作" width="240" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="warning" @click="onResetPassword(row)">重置密码</el-button>
          <el-button
            v-if="row.id !== auth.profile?.adminId"
            link
            type="danger"
            @click="onDelete(row)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadData"
      />
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑账号' : '新建账号'"
      width="520px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="form.username" maxlength="50" placeholder="3～50 位字母数字" />
        </el-form-item>
        <el-form-item v-if="!editingId" label="初始密码">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="留空则系统自动生成临时密码"
          />
          <p class="hint">{{ PASSWORD_HINT }}</p>
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.realName" maxlength="50" placeholder="如：张老师" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="form.roleId" placeholder="选择角色" style="width: 100%">
            <el-option v-for="r in roleOptions" :key="r.id" :label="r.roleName" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createAdminUser,
  fetchAdminUsers,
  fetchRoleOptions,
  removeAdminUser,
  resetAdminUserPassword,
  updateAdminUser,
  type AdminUserItem,
  type RoleOption
} from '@/api/adminUser'
import { useAuthStore } from '@/stores/auth'
import { PASSWORD_HINT } from '@/utils/permissions'

const auth = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const list = ref<AdminUserItem[]>([])
const roleOptions = ref<RoleOption[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const keyword = ref('')
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  password: '',
  realName: '',
  roleId: undefined as number | undefined,
  status: 1
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchAdminUsers(keyword.value || undefined, page.value, pageSize.value)
    list.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function loadRoleOptions() {
  roleOptions.value = await fetchRoleOptions()
}

function onSearch() {
  page.value = 1
  loadData()
}

function openDialog(row?: AdminUserItem) {
  editingId.value = row?.id ?? null
  form.username = row?.username ?? ''
  form.password = ''
  form.realName = row?.realName ?? ''
  form.roleId = row?.roleId
  form.status = row?.status ?? 1
  dialogVisible.value = true
}

async function onSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || !form.roleId) return
  saving.value = true
  try {
    if (editingId.value) {
      await updateAdminUser(editingId.value, {
        username: form.username.trim(),
        realName: form.realName.trim() || undefined,
        roleId: form.roleId,
        status: form.status
      })
      ElMessage.success('已更新')
    } else {
      const created = await createAdminUser({
        username: form.username.trim(),
        password: form.password.trim() || undefined,
        realName: form.realName.trim() || undefined,
        roleId: form.roleId,
        status: form.status
      })
      if (created.temporaryPassword) {
        await ElMessageBox.alert(
          `账号已创建。临时密码（请妥善告知用户，仅显示一次）：\n\n${created.temporaryPassword}`,
          '临时密码',
          { type: 'warning' }
        )
      } else {
        ElMessage.success('账号已创建')
      }
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function onResetPassword(row: AdminUserItem) {
  await ElMessageBox.confirm(`重置「${row.username}」的密码？重置后须下次登录修改。`, '重置确认', {
    type: 'warning'
  })
  const res = await resetAdminUserPassword(row.id)
  await ElMessageBox.alert(
    `新临时密码（仅显示一次）：\n\n${res.temporaryPassword}`,
    '密码已重置',
    { type: 'warning' }
  )
  await loadData()
}

async function onDelete(row: AdminUserItem) {
  await ElMessageBox.confirm(`删除账号「${row.username}」？此操作不可恢复。`, '删除确认', {
    type: 'warning'
  })
  await removeAdminUser(row.id)
  ElMessage.success('已删除')
  await loadData()
}

onMounted(async () => {
  await Promise.all([loadRoleOptions(), loadData()])
})
</script>

<style scoped lang="scss">
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: #909399;
}
</style>
