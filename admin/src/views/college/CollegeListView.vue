<template>
  <div class="page-card">
    <div class="page-header">
      <h2>学院矩阵</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增学院</el-button>
    </div>

    <p class="text-muted">
      配置各二级学院入口与对接方式。保存并上架后，小程序「学院矩阵」页按排序展示。
      若使用「小程序跳转」，须在 <code>miniapp/app.json</code> 的 <code>navigateToMiniProgramAppIdList</code> 中声明目标 AppID。
    </p>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="sort" label="排序" width="70" align="center" />
      <el-table-column prop="name" label="学院名称" min-width="160" show-overflow-tooltip />
      <el-table-column label="对接方式" width="110" align="center">
        <template #default="{ row }">
          <el-tag size="small">{{ row.contentTypeLabel }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="简介" min-width="200" show-overflow-tooltip />
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
      :title="editingId ? '编辑学院' : '新增学院'"
      width="640px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="学院名称" prop="name">
          <el-input v-model="form.name" maxlength="100" show-word-limit />
          <FieldHint :text="FIELD_HINTS.collegeName" />
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="200" show-word-limit />
          <FieldHint :text="FIELD_HINTS.collegeDesc" />
        </el-form-item>
        <el-form-item label="学院图标">
          <OssUploadInput
            v-model="form.iconUrl"
            scene="image"
            accept="image/*"
            upload-label="上传图标"
            done-text="图标已上传"
            hint="选填，留空则使用默认色块"
          />
        </el-form-item>
        <el-form-item label="对接方式" prop="contentType">
          <el-select v-model="form.contentType" style="width: 100%">
            <el-option label="手动录入（卡片展示简介）" value="manual" />
            <el-option label="小程序跳转" value="jump" />
            <el-option label="H5 嵌入" value="embed_h5" />
            <el-option label="接口同步（预留）" value="api_sync" />
          </el-select>
        </el-form-item>
        <template v-if="form.contentType === 'jump'">
          <el-form-item label="AppID" prop="appid">
            <el-input v-model="form.appid" placeholder="目标小程序 AppID" />
          </el-form-item>
          <el-form-item label="页面路径" prop="path">
            <el-input v-model="form.path" placeholder="如 pages/index/index，可留空进首页" />
          </el-form-item>
        </template>
        <template v-if="form.contentType === 'embed_h5' || form.contentType === 'api_sync'">
          <el-form-item label="嵌入页面" prop="contentUrl">
            <el-input v-model="form.contentUrl" placeholder="粘贴技术人员提供的网页地址" />
          </el-form-item>
        </template>
        <el-form-item v-if="form.contentType === 'api_sync'" label="接口密钥" prop="apiToken">
          <el-input v-model="form.apiToken" placeholder="选填，由技术人员配置" show-password />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
          <div class="form-tip">数字越小越靠前</div>
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
import { reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createCollege, deleteCollege, fetchColleges, updateCollege } from '@/api/college'
import OssUploadInput from '@/components/OssUploadInput.vue'
import FieldHint from '@/components/FieldHint.vue'
import type { CollegeAppItem } from '@/api/college'
import { FIELD_HINTS } from '@/utils/field-hints'

const loading = ref(false)
const saving = ref(false)
const list = ref<CollegeAppItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  description: '',
  iconUrl: '',
  contentType: 'manual',
  appid: '',
  path: '',
  contentUrl: '',
  apiToken: '',
  sort: 0,
  status: 1
})

const rules: FormRules = {
  name: [{ required: true, message: '请填写学院名称', trigger: 'blur' }],
  contentType: [{ required: true, message: '请选择对接方式', trigger: 'change' }]
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchColleges(page.value, pageSize.value)
    list.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.description = ''
  form.iconUrl = ''
  form.contentType = 'manual'
  form.appid = ''
  form.path = ''
  form.contentUrl = ''
  form.apiToken = ''
  form.sort = 0
  form.status = 1
}

function openDialog(row?: CollegeAppItem) {
  resetForm()
  editingId.value = row?.id ?? null
  if (row) {
    form.name = row.name
    form.description = row.description || ''
    form.iconUrl = row.iconUrl || ''
    form.contentType = row.contentType || 'manual'
    form.appid = row.appid || ''
    form.path = row.path || ''
    form.contentUrl = row.contentUrl || ''
    form.sort = row.sort
    form.status = row.status
  }
  dialogVisible.value = true
}

async function onSave() {
  await formRef.value?.validate()
  saving.value = true
  try {
    const payload = { ...form }
    if (editingId.value) {
      await updateCollege(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await createCollege(payload)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function onDelete(row: CollegeAppItem) {
  await ElMessageBox.confirm(`确定删除「${row.name}」？`, '删除确认', { type: 'warning' })
  await deleteCollege(row.id)
  ElMessage.success('已删除')
  await loadData()
}

loadData()
</script>

<style scoped>
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
.form-tip { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
code { font-size: 12px; background: #f4f4f5; padding: 2px 6px; border-radius: 4px; }
</style>
