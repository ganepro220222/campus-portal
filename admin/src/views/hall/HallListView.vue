<template>
  <div class="page-card">
    <div class="page-header">
      <h2>展馆管理</h2>
      <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openDialog()">新建展馆</el-button>
    </div>

    <p class="text-muted">维护 11 馆基础信息；下架（status=0）后小程序不可见，并会从搜索索引移除。</p>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="sort" label="排序" width="70" align="center" />
      <el-table-column prop="name" label="展馆名称" min-width="140" />
      <el-table-column prop="categoryName" label="分类" width="110" />
      <el-table-column prop="intro" label="简介" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right" align="center">
        <template #default="{ row }">
          <el-button v-if="canWrite" link type="primary" @click="openDialog(row)">编辑</el-button>
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
      :title="editingId ? '编辑展馆' : '新建展馆'"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面 URL">
          <el-input v-model="form.cover" placeholder="750×750 封面图" />
        </el-form-item>
        <el-form-item label="简介" prop="intro">
          <el-input v-model="form.intro" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
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
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { fetchCategories } from '@/api/category'
import { createHall, fetchHalls, updateHall } from '@/api/hall'
import { useAuthStore } from '@/stores/auth'
import type { CategoryOption, HallItem } from '@/types/api'

const auth = useAuthStore()
const canWrite = computed(() => auth.can('hall:write'))

const loading = ref(false)
const saving = ref(false)
const list = ref<HallItem[]>([])
const categories = ref<CategoryOption[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  cover: '',
  intro: '',
  categoryId: undefined as number | undefined,
  sort: 0,
  status: 1
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入展馆名称', trigger: 'blur' }]
}

async function loadCategories() {
  categories.value = await fetchCategories('hall')
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchHalls(page.value, pageSize.value)
    list.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.cover = ''
  form.intro = ''
  form.categoryId = categories.value[0]?.id
  form.sort = 0
  form.status = 1
}

function openDialog(row?: HallItem) {
  resetForm()
  editingId.value = row?.id ?? null
  if (row) {
    form.name = row.name
    form.cover = row.cover || ''
    form.intro = row.intro || ''
    form.categoryId = row.categoryId ?? undefined
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
    const payload = { ...form }
    if (editingId.value) {
      await updateHall(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await createHall(payload)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadCategories()
  await loadData()
})
</script>

<style scoped lang="scss">
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
