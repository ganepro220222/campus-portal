<template>
  <div class="page-card">
    <div class="page-header">
      <h2>分类管理</h2>
      <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openDialog()">新建分类</el-button>
    </div>

    <p class="text-muted">
      统一管理新闻、展馆、文创、课程、资源的分类标签；保存后各模块下拉与小程序 Tab 同步更新。
    </p>

    <div class="toolbar">
      <el-radio-group v-model="activeType" @change="loadData">
        <el-radio-button v-for="opt in CATEGORY_TYPE_OPTIONS" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </el-radio-button>
      </el-radio-group>
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="sort" label="排序" width="80" align="center" />
      <el-table-column prop="name" label="分类名称" min-width="180" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updateTime" label="更新时间" width="170" />
      <el-table-column v-if="canWrite" label="操作" width="160" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑分类' : '新建分类'"
      width="480px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="所属模块">
          <el-input :model-value="typeLabel" disabled />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" maxlength="50" show-word-limit placeholder="如：书院动态" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CATEGORY_TYPE_OPTIONS,
  createCategory,
  fetchAdminCategories,
  removeCategory,
  updateCategory,
  type CategoryType
} from '@/api/category'
import { useAuthStore } from '@/stores/auth'
import type { CategoryItem } from '@/types/api'

const auth = useAuthStore()
const canWrite = computed(() => auth.can('category:write'))

const loading = ref(false)
const saving = ref(false)
const list = ref<CategoryItem[]>([])
const activeType = ref<CategoryType>('news')
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  sort: 0,
  status: 1
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

const typeLabel = computed(() =>
  CATEGORY_TYPE_OPTIONS.find((o) => o.value === activeType.value)?.label || activeType.value
)

async function loadData() {
  loading.value = true
  try {
    list.value = await fetchAdminCategories(activeType.value)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.sort = list.value.length
  form.status = 1
}

function openDialog(row?: CategoryItem) {
  resetForm()
  editingId.value = row?.id ?? null
  if (row) {
    form.name = row.name
    form.sort = row.sort ?? 0
    form.status = row.status ?? 1
  }
  dialogVisible.value = true
}

async function onSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = {
      type: activeType.value,
      name: form.name,
      sort: form.sort,
      status: form.status
    }
    if (editingId.value) {
      await updateCategory(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await createCategory(payload)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function onDelete(row: CategoryItem) {
  await ElMessageBox.confirm(
    `删除「${row.name}」？若该分类下仍有内容将无法删除。`,
    '删除确认',
    { type: 'warning' }
  )
  await removeCategory(row.id)
  ElMessage.success('已删除')
  await loadData()
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
</style>
