<template>
  <div class="page-card">
    <div class="page-header">
      <h2>资源管理</h2>
      <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openDialog()">新建资源</el-button>
    </div>

    <p class="text-muted">
      维护 PDF/Word/PPT/音视频学习资料；下架后小程序不可见，下载次数由学员端下载接口自动累计。
    </p>

    <div class="toolbar">
      <el-select
        v-model="filterCategoryId"
        placeholder="分类"
        clearable
        style="width: 140px"
        @change="onFilter"
      >
        <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-select
        v-model="filterFileType"
        placeholder="格式"
        clearable
        style="width: 120px"
        @change="onFilter"
      >
        <el-option v-for="t in FILE_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 110px" @change="onFilter">
        <el-option label="上架" :value="1" />
        <el-option label="下架" :value="0" />
      </el-select>
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="name" label="资源名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="categoryName" label="分类" width="110" />
      <el-table-column label="格式" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ row.fileTypeLabel }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="fileSizeText" label="大小" width="90" align="center" />
      <el-table-column prop="downloadCount" label="下载次数" width="90" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="150" />
      <el-table-column label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <el-button v-if="canWrite" link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button
            v-if="canPublish && row.status !== 1"
            link
            type="success"
            @click="onPublish(row)"
          >上架</el-button>
          <el-button
            v-if="canPublish && row.status === 1"
            link
            type="warning"
            @click="onUnpublish(row)"
          >下架</el-button>
          <span v-if="!canWrite" class="text-muted">—</span>
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
      :title="editingId ? '编辑资源' : '新建资源'"
      width="600px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="资源名称" prop="name">
          <el-input v-model="form.name" maxlength="200" show-word-limit />
          <FieldHint :text="FIELD_HINTS.resourceName" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="文件格式" prop="fileType">
          <el-select v-model="form.fileType" placeholder="选择格式" style="width: 100%">
            <el-option v-for="t in FILE_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="学习资料" prop="fileUrl">
          <OssUploadInput
            v-model="form.fileUrl"
            scene="resource_file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3"
            upload-label="上传文件"
            done-text="文件已上传"
            hint="支持 PDF、Word、PPT、音视频等格式"
          />
        </el-form-item>
        <el-form-item label="在线预览">
          <OssUploadInput
            v-model="form.previewUrl"
            scene="resource_file"
            accept=".pdf,.mp4"
            upload-label="上传预览文件"
            done-text="预览文件已上传"
            hint="选填；可与学习资料相同，用于在线预览"
          />
        </el-form-item>
        <el-form-item label="大小(KB)">
          <el-input-number v-model="form.fileSizeKb" :min="1" :max="999999" />
        </el-form-item>
        <el-form-item label="上下架">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="editingId" label="下载次数">
          <span>{{ form.downloadCount }} 次（只读，由学员下载自动累计）</span>
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
import { fetchCategories } from '@/api/category'
import {
  createResource,
  fetchResource,
  fetchResources,
  FILE_TYPE_OPTIONS,
  publishResource,
  unpublishResource,
  updateResource
} from '@/api/resource'
import { useAuthStore } from '@/stores/auth'
import OssUploadInput from '@/components/OssUploadInput.vue'
import FieldHint from '@/components/FieldHint.vue'
import type { CategoryOption, ResourceItem } from '@/types/api'
import { FIELD_HINTS } from '@/utils/field-hints'

const auth = useAuthStore()
const canWrite = computed(() => auth.can('course:write'))
const canPublish = computed(() => auth.can('course:publish'))

const loading = ref(false)
const saving = ref(false)
const list = ref<ResourceItem[]>([])
const categories = ref<CategoryOption[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterCategoryId = ref<number | undefined>()
const filterFileType = ref('')
const filterStatus = ref<number | undefined>()
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  categoryId: undefined as number | undefined,
  fileType: 'pdf',
  fileUrl: '',
  previewUrl: '',
  fileSizeKb: undefined as number | undefined,
  status: 0,
  downloadCount: 0
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入资源名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  fileType: [{ required: true, message: '请选择文件格式', trigger: 'change' }],
  fileUrl: [{ required: true, message: '请填写文件地址', trigger: 'blur' }]
}

async function loadCategories() {
  categories.value = await fetchCategories('resource')
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchResources({
      page: page.value,
      size: pageSize.value,
      categoryId: filterCategoryId.value,
      fileType: filterFileType.value || undefined,
      status: filterStatus.value
    })
    list.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function onFilter() {
  page.value = 1
  loadData()
}

function resetForm() {
  form.name = ''
  form.categoryId = categories.value[0]?.id
  form.fileType = 'pdf'
  form.fileUrl = ''
  form.previewUrl = ''
  form.fileSizeKb = undefined
  form.status = 0
  form.downloadCount = 0
}

async function openDialog(row?: ResourceItem) {
  resetForm()
  editingId.value = row?.id ?? null
  if (row) {
    const detail = await fetchResource(row.id)
    form.name = detail.name
    form.categoryId = detail.categoryId ?? undefined
    form.fileType = detail.fileType
    form.fileUrl = detail.fileUrl
    form.previewUrl = detail.previewUrl || ''
    form.fileSizeKb = detail.fileSizeKb ?? undefined
    form.status = detail.status ?? 0
    form.downloadCount = detail.downloadCount ?? 0
  }
  dialogVisible.value = true
}

async function onSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      fileType: form.fileType,
      fileUrl: form.fileUrl,
      previewUrl: form.previewUrl || undefined,
      fileSizeKb: form.fileSizeKb,
      status: form.status
    }
    if (editingId.value) {
      await updateResource(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await createResource(payload)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function onPublish(row: ResourceItem) {
  await ElMessageBox.confirm(`上架「${row.name}」？上架后小程序端可下载，并同步搜索索引。`, '上架确认')
  await publishResource(row.id)
  ElMessage.success('已上架')
  await loadData()
}

async function onUnpublish(row: ResourceItem) {
  await ElMessageBox.confirm(`下架「${row.name}」？小程序端将不再可下载。`, '下架确认', { type: 'warning' })
  await unpublishResource(row.id)
  ElMessage.success('已下架')
  await loadData()
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
