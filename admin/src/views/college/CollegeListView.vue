<template>
  <div class="page-card">
    <div class="page-header">
      <h2>关联小程序</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新增入口</el-button>
    </div>

    <p class="text-muted">
      配置关联小程序或 H5 入口与对接方式。保存并上架后，小程序「关联小程序」页按排序展示；
      首页「关联应用」横滑仅展示「小程序跳转」类型。
      选用「小程序跳转」时填写对方 AppID，页面路径可留空以打开首页。对方小程序需已发布。
    </p>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="sort" label="排序" width="70" align="center" />
      <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
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
      :title="editingId ? '编辑入口' : '新增入口'"
      width="640px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="100" show-word-limit />
          <FieldHint :text="FIELD_HINTS.collegeName" />
        </el-form-item>
        <el-form-item label="简介" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="200" show-word-limit />
          <FieldHint :text="FIELD_HINTS.collegeDesc" />
        </el-form-item>
        <el-form-item label="图标">
          <OssUploadInput
            v-model="form.iconUrl"
            v-model:fit-mode="form.iconFitMode"
            v-model:icon-shape="form.iconShape"
            scene="image"
            accept=".png,.jpg,.jpeg"
            upload-label="上传图标"
            done-text="图标已上传"
            preview-variant="icon"
            show-cover-fit
            show-icon-shape
            aspect-hint="建议正方形 PNG/JPG，边长 200–512px。只有圆形小程序图标时，选「圆形」并按预览选裁切方式。"
            hint="选填，留空则使用默认色块。微信无法自动获取对方 logo。方形官方图选「方形」；只有圆形图标时选「圆形」。"
          />
        </el-form-item>
        <el-form-item label="对接方式" prop="contentType">
          <el-select v-model="form.contentType" style="width: 100%" @change="onContentTypeChange">
            <el-option label="手动录入（卡片展示简介）" value="manual" />
            <el-option label="小程序跳转" value="jump" />
            <el-option label="H5 嵌入" value="embed_h5" />
            <el-option label="接口同步（暂未开放）" value="api_sync" disabled />
          </el-select>
        </el-form-item>
        <template v-if="form.contentType === 'jump'">
          <el-form-item label="AppID" prop="appid">
            <el-input v-model="form.appid" placeholder="wx 开头的 18 位 AppID" maxlength="32" @blur="trimAppid" />
            <FieldHint :text="MINI_PROGRAM_APPID_HINT" />
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
          <el-input
            v-model="form.apiToken"
            :placeholder="editingId ? '留空表示不修改；输入新值可更换' : '选填，由技术人员配置'"
            show-password
          />
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
import {
  MINI_PROGRAM_APPID_HINT,
  normalizeMiniProgramAppId,
  validateMiniProgramAppId
} from '@/utils/miniProgramAppId.mjs'
import {
  normalizeCollegeIconFit,
  normalizeCollegeIconShape
} from '@/utils/collegeIcon.mjs'
import { MOVED_TO_RECYCLE_BIN, softDeleteConfirm } from '@/utils/recycleBinCopy'

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
  iconFitMode: 'fit',
  iconShape: 'square',
  contentType: 'jump',
  appid: '',
  path: '',
  contentUrl: '',
  apiToken: '',
  sort: 0,
  status: 1
})

const rules: FormRules = {
  name: [{ required: true, message: '请填写学院名称', trigger: 'blur' }],
  contentType: [{ required: true, message: '请选择对接方式', trigger: 'change' }],
  appid: [{
    validator: (_rule, value, callback) => {
      if (form.contentType !== 'jump') {
        callback()
        return
      }
      const result = validateMiniProgramAppId(value)
      if (!result.ok) callback(new Error(result.message))
      else callback()
    },
    trigger: ['blur', 'change']
  }]
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
  form.iconFitMode = 'fit'
  form.iconShape = 'square'
  form.contentType = 'jump'
  form.appid = ''
  form.path = ''
  form.contentUrl = ''
  form.apiToken = ''
  form.sort = 0
  form.status = 1
}

function trimAppid() {
  form.appid = normalizeMiniProgramAppId(form.appid)
}

function onContentTypeChange() {
  formRef.value?.clearValidate(['appid'])
}

function openDialog(row?: CollegeAppItem) {
  resetForm()
  editingId.value = row?.id ?? null
  if (row) {
    form.name = row.name
    form.description = row.description || ''
    form.iconUrl = row.iconUrl || ''
    form.iconFitMode = normalizeCollegeIconFit(row.iconFitMode)
    form.iconShape = normalizeCollegeIconShape(row.iconShape)
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
  trimAppid()
  await formRef.value?.validate()
  saving.value = true
  try {
    const payload = { ...form }
    if (editingId.value && !form.apiToken.trim()) {
      delete (payload as Partial<typeof form>).apiToken
    }
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
  await ElMessageBox.confirm(softDeleteConfirm(`「${row.name}」`), '删除确认', { type: 'warning' })
  await deleteCollege(row.id)
  ElMessage.success(MOVED_TO_RECYCLE_BIN)
  await loadData()
}

loadData()
</script>

<style scoped>
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
.form-tip { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
code { font-size: 12px; background: #f4f4f5; padding: 2px 6px; border-radius: 4px; }
</style>
