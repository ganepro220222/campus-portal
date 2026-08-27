<template>
  <div class="page-card">
    <div class="page-header">
      <h2>首页功能入口</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新建入口</el-button>
    </div>

    <p class="text-muted">配置首页功能入口矩阵的文案、图标与跳转路径。仅「上架」项会在小程序展示；下拉路径为白名单页面。</p>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="sort" label="排序" width="70" align="center" />
      <el-table-column prop="label" label="名称" min-width="140" />
      <el-table-column prop="icon" label="图标名" width="140" />
      <el-table-column prop="path" label="跳转路径" min-width="220" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
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
      :title="editingId ? '编辑入口' : '新建入口'"
      width="520px"
      destroy-on-close
      @closed="onDialogClosed"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="名称" prop="label">
          <el-input v-model="form.label" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-select v-model="form.icon" style="width: 100%">
            <el-option v-for="opt in ICON_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <div class="form-tip">对应小程序 icon 组件名，非图片 URL</div>
        </el-form-item>
        <el-form-item label="跳转路径" prop="path">
          <el-select v-model="form.path" style="width: 100%">
            <el-option v-for="opt in PATH_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
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
import { onMounted, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createNavItem, fetchNavItems, removeNavItem, updateNavItem } from '@/api/navItem'
import type { NavItemRecord } from '@/types/api'
import { MOVED_TO_RECYCLE_BIN, softDeleteConfirm } from '@/utils/recycleBinCopy'

const ICON_OPTIONS = [
  { label: '书院动态', value: 'entry-news' },
  { label: '展馆', value: 'museum' },
  { label: '课程', value: 'course' },
  { label: '资源下载', value: 'entry-resource' },
  { label: '报名', value: 'entry-enroll' },
  { label: '精品/文创', value: 'medal' },
  { label: '智能问答', value: 'robot' },
  { label: '搜索', value: 'search' },
  { label: '通用网格', value: 'grid' }
]

const PATH_OPTIONS = [
  { label: '动态 Tab', value: '/pages/news/index' },
  { label: '展馆 Tab', value: '/pages/hall/index' },
  { label: '课程 Tab', value: '/pages/course/index' },
  { label: '活动报名', value: '/pages/activity/index' },
  { label: '个人中心', value: '/pages/profile/index' },
  { label: '资源下载', value: '/packageB/resource/list' },
  { label: '精品好物列表', value: '/packageA/craft/list' },
  { label: '全局搜索', value: '/packageC/search/index' },
  { label: '智能问答', value: '/packageD/ai-chat/index' },
  { label: '关联小程序列表', value: '/packageC/college/list' }
]

const loading = ref(false)
const saving = ref(false)
const list = ref<NavItemRecord[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  label: '',
  icon: 'grid',
  path: '/pages/news/index',
  sort: 0,
  status: 1
})

const rules: FormRules = {
  label: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  icon: [{ required: true, message: '请选择图标', trigger: 'change' }],
  path: [{ required: true, message: '请选择路径', trigger: 'change' }]
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchNavItems(page.value, pageSize.value)
    list.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function openDialog(row?: NavItemRecord) {
  editingId.value = row?.id ?? null
  form.label = row?.label ?? ''
  form.icon = row?.icon ?? 'grid'
  form.path = row?.path ?? '/pages/news/index'
  form.sort = row?.sort ?? 0
  form.status = row?.status ?? 1
  dialogVisible.value = true
}

function onDialogClosed() {
  editingId.value = null
  formRef.value?.resetFields()
}

async function onSave() {
  await formRef.value?.validate()
  saving.value = true
  try {
    const payload = { ...form }
    if (editingId.value) {
      await updateNavItem(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await createNavItem(payload)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function onDelete(row: NavItemRecord) {
  await ElMessageBox.confirm(softDeleteConfirm(`「${row.label}」`), '删除确认', { type: 'warning' })
  await removeNavItem(row.id)
  ElMessage.success(MOVED_TO_RECYCLE_BIN)
  await loadData()
}

onMounted(loadData)
</script>

<style scoped>
.form-tip { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
