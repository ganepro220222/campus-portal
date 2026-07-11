<template>
  <div class="page-card">
    <div class="page-header">
      <h2>首页轮播</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新建轮播图</el-button>
    </div>

    <p class="text-muted">配置首页轮播图与跳转链接，保存后小程序端可在缓存刷新后展示（验收标准：5 分钟内同步）。</p>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="sort" label="排序" width="70" align="center" />
      <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
      <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column label="跳转" min-width="160">
        <template #default="{ row }">
          <el-tag size="small">{{ linkTypeLabel(row.linkType) }}</el-tag>
          <span v-if="row.linkValue" class="link-value">{{ row.linkValue }}</span>
        </template>
      </el-table-column>
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
      :title="editingId ? '编辑轮播图' : '新建轮播图'"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit />
          <FieldHint :text="FIELD_HINTS.bannerTitle" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="2" maxlength="500" show-word-limit />
          <FieldHint :text="FIELD_HINTS.bannerDesc" />
        </el-form-item>
        <el-form-item label="轮播图片">
          <CoverUploadField
            v-model="form.imageUrl"
            v-model:fit-mode="form.coverFitMode"
            slot="banner"
            upload-label="上传图片"
            done-text="图片已上传"
          />
        </el-form-item>
        <el-form-item label="跳转类型" prop="linkType">
          <el-select v-model="form.linkType" style="width: 100%">
            <el-option label="无跳转" value="none" />
            <el-option label="小程序页面" value="page" />
            <el-option label="外部链接" value="url" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.linkType !== 'none'" label="跳转值" prop="linkValue">
          <el-input v-model="form.linkValue" placeholder="如 /packageA/news/detail?id=1" />
          <div class="form-tip">小程序页面填内部路径；外部链接填完整网页地址</div>
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
import { onMounted, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createBanner, fetchBanners, removeBanner, updateBanner } from '@/api/banner'
import CoverUploadField from '@/components/CoverUploadField.vue'
import FieldHint from '@/components/FieldHint.vue'
import type { BannerItem } from '@/types/api'
import type { CoverFitMode } from '@/utils/cover'
import { FIELD_HINTS } from '@/utils/field-hints'

const loading = ref(false)
const saving = ref(false)
const list = ref<BannerItem[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  title: '',
  description: '',
  imageUrl: '',
  coverFitMode: 'fill' as CoverFitMode,
  linkType: 'page',
  linkValue: '',
  sort: 0,
  status: 1
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  linkType: [{ required: true, message: '请选择跳转类型', trigger: 'change' }]
}

function linkTypeLabel(type: string) {
  const map: Record<string, string> = { none: '无', page: '页面', url: '外链' }
  return map[type] || type
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchBanners(page.value, pageSize.value)
    list.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.title = ''
  form.description = ''
  form.imageUrl = ''
  form.coverFitMode = 'fill'
  form.linkType = 'page'
  form.linkValue = ''
  form.sort = 0
  form.status = 1
}

function openDialog(row?: BannerItem) {
  resetForm()
  editingId.value = row?.id ?? null
  if (row) {
    form.title = row.title || ''
    form.description = row.description || ''
    form.imageUrl = row.imageUrl || ''
    form.coverFitMode = row.coverFitMode === 'fit' ? 'fit' : 'fill'
    form.linkType = row.linkType || 'none'
    form.linkValue = row.linkValue || ''
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
      await updateBanner(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await createBanner(payload)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function onDelete(row: BannerItem) {
  await ElMessageBox.confirm(`确定删除「${row.title}」？`, '删除确认', { type: 'warning' })
  await removeBanner(row.id)
  ElMessage.success('已删除')
  await loadData()
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.link-value {
  margin-left: 6px;
  font-size: 12px;
  color: #909399;
}

.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
