<template>
  <div class="page-card">
    <div class="page-header">
      <h2>角色权限</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新建角色</el-button>
    </div>

    <p class="text-muted">
      按模块勾选权限，实现「编辑」与「发布/上架」分离。超级管理员角色固定拥有全部权限。
    </p>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="roleName" label="角色名称" min-width="140" />
      <el-table-column label="权限数" width="90" align="center">
        <template #default="{ row }">
          {{ row.permissions.includes('admin:super') ? '全部' : row.permissions.length }}
        </template>
      </el-table-column>
      <el-table-column prop="userCount" label="账号数" width="90" align="center" />
      <el-table-column label="类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.builtin" size="small" type="warning">内置</el-tag>
          <el-tag v-else size="small" type="info">自定义</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" width="160" />
      <el-table-column label="操作" width="160" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button v-if="!row.builtin" link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑角色' : '新建角色'"
      width="640px"
      destroy-on-close
      top="4vh"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" maxlength="50" :disabled="isBuiltinSuper" />
        </el-form-item>
        <el-form-item label="权限" prop="permissions">
          <div v-if="isBuiltinSuper" class="text-muted">内置超级管理员拥有全部权限，不可修改。</div>
          <div v-else class="perm-matrix">
            <div
              v-for="group in visibleGroups"
              :key="group.group"
              class="perm-group"
            >
              <div class="perm-group-title">{{ group.group }}</div>
              <el-checkbox-group v-model="form.permissions">
                <el-checkbox
                  v-for="p in group.permissions"
                  :key="p.key"
                  :value="p.key"
                >
                  {{ p.label }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createAdminRole,
  fetchAdminRoles,
  fetchPermissionCatalog,
  removeAdminRole,
  updateAdminRole,
  type AdminRoleItem
} from '@/api/adminRole'
import type { PermissionGroup, PermissionEntry } from '@/utils/permissions'

const loading = ref(false)
const saving = ref(false)
const list = ref<AdminRoleItem[]>([])
const catalog = ref<PermissionGroup[]>([])
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  roleName: '',
  permissions: [] as string[]
})

const isBuiltinSuper = computed(() => editingId.value === 1)

const visibleGroups = computed(() =>
  catalog.value
    .map((group) => ({
      ...group,
      permissions: visiblePermissions(group)
    }))
    .filter((group) => group.permissions.length > 0)
)

function visiblePermissions(group: PermissionGroup): PermissionEntry[] {
  if (isBuiltinSuper.value) return group.permissions
  return group.permissions.filter((p) => p.key !== 'admin:super')
}

const rules: FormRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  permissions: [
    {
      validator: (_r, _v, cb) => {
        if (isBuiltinSuper.value || form.permissions.length > 0) cb()
        else cb(new Error('请至少勾选一项权限'))
      },
      trigger: 'change'
    }
  ]
}

async function loadData() {
  loading.value = true
  try {
    list.value = await fetchAdminRoles()
  } finally {
    loading.value = false
  }
}

async function loadCatalog() {
  catalog.value = await fetchPermissionCatalog()
}

function openDialog(row?: AdminRoleItem) {
  editingId.value = row?.id ?? null
  form.roleName = row?.roleName ?? ''
  form.permissions = row?.permissions ? [...row.permissions] : []
  dialogVisible.value = true
}

async function onSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = {
      roleName: form.roleName.trim(),
      permissions: isBuiltinSuper.value ? ['admin:super'] : [...form.permissions]
    }
    if (editingId.value) {
      await updateAdminRole(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await createAdminRole(payload)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function onDelete(row: AdminRoleItem) {
  await ElMessageBox.confirm(`删除角色「${row.roleName}」？`, '删除确认', { type: 'warning' })
  await removeAdminRole(row.id)
  ElMessage.success('已删除')
  await loadData()
}

onMounted(async () => {
  await Promise.all([loadCatalog(), loadData()])
})
</script>

<style scoped lang="scss">
.perm-matrix {
  width: 100%;
}
.perm-group {
  margin-bottom: 14px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}
.perm-group-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--brand-ink);
}
:deep(.el-checkbox) {
  display: inline-flex;
  margin-right: 16px;
  margin-bottom: 6px;
}
</style>
