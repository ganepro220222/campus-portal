<template>
  <div class="page-card">
    <div class="page-header">
      <h2>动态管理</h2>
      <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openDialog()">新建动态</el-button>
    </div>

    <div class="toolbar">
      <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px" @change="onFilter">
        <el-option label="草稿" value="draft" />
        <el-option label="已发布" value="published" />
      </el-select>
      <el-select
        v-model="filterCategoryId"
        placeholder="分类"
        clearable
        style="width: 140px"
        @change="onFilter"
      >
        <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="categoryName" label="分类" width="110" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
            {{ row.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="置顶" width="70" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.isTop" type="warning" size="small">置顶</el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column prop="viewCount" label="阅读" width="80" align="center" />
      <el-table-column prop="publishTime" label="发布时间" width="160" />
      <el-table-column label="操作" width="340" fixed="right" align="center">
        <template #default="{ row }">
          <el-button v-if="canRead" link @click="openView(row)">查看</el-button>
          <el-button v-if="canWrite" link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button
            v-if="canPublish && row.status === 'draft'"
            link
            type="success"
            @click="onPublish(row)"
          >发布</el-button>
          <el-button
            v-if="canPublish && row.status === 'published'"
            link
            type="warning"
            @click="onUnpublish(row)"
          >下架</el-button>
          <el-button
            v-if="canWrite && row.status !== 'published'"
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
      :title="dialogTitle"
      width="860px"
      destroy-on-close
      top="5vh"
    >
      <el-alert
        v-if="!readonly && saveMode.warning"
        :title="saveMode.warning"
        type="warning"
        :closable="false"
        show-icon
        class="live-save-alert"
      />
      <el-form
        ref="formRef"
        :model="form"
        :rules="readonly ? {} : rules"
        label-width="88px"
      >
        <el-form-item label="标题" prop="title">
          <AiAssistBar
            v-if="canWrite && !readonly"
            :source-text="titleAiSource"
            :actions="['title']"
            :min-length="8"
            :result-rows="5"
            @adopt="onTitleAiAdopt"
          />
          <el-input v-model="form.title" maxlength="200" show-word-limit :disabled="readonly" />
          <FieldHint v-if="!readonly" :text="FIELD_HINTS.listTitle" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%" :disabled="readonly">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面图">
          <CoverUploadField
            v-model="form.cover"
            v-model:fit-mode="form.coverFitMode"
            slot="newsList"
            :readonly="readonly"
          />
        </el-form-item>
        <el-form-item label="摘要">
          <AiAssistBar
            v-if="canWrite && !readonly"
            :source-text="summaryAiSource"
            :actions="['summarize']"
            :min-length="8"
            :result-rows="4"
            @adopt="onSummaryAiAdopt"
          />
          <el-input v-model="form.summary" type="textarea" :rows="2" maxlength="500" show-word-limit :disabled="readonly" />
          <FieldHint v-if="!readonly" :text="FIELD_HINTS.newsSummary" />
        </el-form-item>
        <el-form-item label="正文" prop="content">
          <AiAssistBar
            v-if="canWrite && !readonly"
            :source-text="bodyAiSource"
            :actions="['polish', 'expand']"
            :min-length="8"
            @adopt="onBodyAiAdopt"
          />
          <WangEditor
            v-model="form.content"
            placeholder="撰写动态正文，可插入图片与排版"
            :disabled="readonly"
            @change="onContentChange"
          />
          <FieldHint v-if="!readonly" :text="FIELD_HINTS.editorBody" />
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch v-model="form.isTop" :active-value="1" :inactive-value="0" :disabled="readonly" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ dialogFooter.closeText }}</el-button>
        <el-button
          v-if="dialogFooter.showSave"
          type="primary"
          :loading="saving || detailLoading"
          :disabled="detailLoading"
          @click="onSave"
        >{{ saveMode.buttonText }}</el-button>
        <el-button
          v-if="dialogFooter.showPublish"
          type="success"
          :disabled="dialogFooter.publishDisabled"
          @click="onPublishFromDialog"
        >{{ dialogFooter.publishLabel }}</el-button>
        <el-button
          v-if="dialogFooter.showUnpublish"
          type="warning"
          :disabled="dialogFooter.publishDisabled"
          @click="onUnpublishFromDialog"
        >{{ dialogFooter.unpublishLabel }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, reactive, ref } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { AiPolishAction } from '@/api/ai'
import { fetchCategories } from '@/api/category'
import { createNews, fetchNews, fetchNewsDetail, publishNews, removeNews, unpublishNews, updateNews } from '@/api/news'
import AiAssistBar from '@/components/AiAssistBar.vue'
import CoverUploadField from '@/components/CoverUploadField.vue'
import FieldHint from '@/components/FieldHint.vue'
import {
  resolveContentDialogFooter,
  resolveContentDialogMode,
  resolveContentDialogTitle
} from '@/utils/contentReviewActions.mjs'
import {
  createNewsDetailDialogSession,
  isNewsDraftSaveLocked,
  openNewsDetailDialog
} from '@/utils/newsDetailDialog.mjs'
import { resolveNewsSaveMode } from '@/utils/newsSaveMode.mjs'
import type { CoverFitMode } from '@/utils/cover'
import { FIELD_HINTS } from '@/utils/field-hints'
import { isEditorContentEmpty } from '@/utils/editor'
import { pickFirstTitleSuggestion, plainTextToHtml, stripHtml } from '@/utils/html'
import { useAuthStore } from '@/stores/auth'
import type { CategoryOption, NewsItem } from '@/types/api'
import { confirmCoverClearIfNeeded } from '@/utils/coverClearConfirm.mjs'
import { MOVED_TO_RECYCLE_BIN, softDeleteConfirm } from '@/utils/recycleBinCopy'

const WangEditor = defineAsyncComponent(() => import('@/components/WangEditor.vue'))

const auth = useAuthStore()
const canRead = computed(() => auth.can('news:read'))
const canWrite = computed(() => auth.can('news:write'))
const canPublish = computed(() => auth.can('news:publish'))

const bodyAiSource = computed(() => stripHtml(form.content))
const summaryAiSource = computed(() => bodyAiSource.value || form.summary.trim())
const titleAiSource = computed(() => bodyAiSource.value || form.summary.trim() || form.title.trim())

const loading = ref(false)
const saving = ref(false)
const detailLoading = ref(false)
const list = ref<NewsItem[]>([])
const categories = ref<CategoryOption[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterStatus = ref('')
const filterCategoryId = ref<number | undefined>()
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const editingStatus = ref<'draft' | 'published' | ''>('')
const detailReady = ref(false)
const detailSession = createNewsDetailDialogSession()
const readonly = computed(() => dialogMode.value === 'view')
const saveMode = computed(() => resolveNewsSaveMode({
  editingId: editingId.value,
  status: editingStatus.value
}))
const dialogTitle = computed(() => resolveContentDialogTitle({
  moduleLabel: '动态',
  mode: dialogMode.value
}))
const dialogFooter = computed(() => resolveContentDialogFooter({
  mode: dialogMode.value,
  canPublish: canPublish.value,
  published: editingStatus.value === 'published',
  detailReady: detailReady.value,
  detailLoading: detailLoading.value,
  publishLabel: '发布'
}))
const coverSavedUrl = ref('')
const formRef = ref<FormInstance>()

const form = reactive({
  title: '',
  cover: '',
  coverFitMode: 'fill' as CoverFitMode,
  summary: '',
  content: '',
  categoryId: undefined as number | undefined,
  isTop: 0
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{
    validator: (_rule, value, callback) => {
      if (isEditorContentEmpty(value)) callback(new Error('请输入正文'))
      else callback()
    },
    trigger: 'change'
  }]
}

async function loadCategories() {
  categories.value = await fetchCategories('news')
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchNews({
      page: page.value,
      size: pageSize.value,
      status: filterStatus.value || undefined,
      categoryId: filterCategoryId.value
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

function onContentChange() {
  formRef.value?.validateField('content').catch(() => {})
}

function onTitleAiAdopt(payload: { action: AiPolishAction; text: string }) {
  if (payload.action !== 'title') return
  form.title = pickFirstTitleSuggestion(payload.text)
}

function onSummaryAiAdopt(payload: { action: AiPolishAction; text: string }) {
  if (payload.action !== 'summarize') return
  form.summary = payload.text.slice(0, 500)
}

async function onBodyAiAdopt(payload: { action: AiPolishAction; text: string }) {
  if (payload.action !== 'polish' && payload.action !== 'expand') return
  try {
    await ElMessageBox.confirm(
      '采纳后会替换当前正文，已有图片、表格和文字样式都会丢失。是否继续？',
      '替换正文',
      { type: 'warning', confirmButtonText: '采纳并替换', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  form.content = plainTextToHtml(payload.text)
  onContentChange()
}

function resetForm() {
  form.title = ''
  form.cover = ''
  form.coverFitMode = 'fill'
  form.summary = ''
  form.content = ''
  form.categoryId = categories.value[0]?.id
  form.isTop = 0
  coverSavedUrl.value = ''
}

function applyNewsDetail(row: NewsItem) {
  form.title = row.title
  form.cover = row.cover || ''
  coverSavedUrl.value = form.cover
  form.coverFitMode = (row.coverFitMode === 'fit' ? 'fit' : 'fill')
  form.summary = row.summary || ''
  form.content = row.content || ''
  form.categoryId = row.categoryId ?? undefined
  form.isTop = row.isTop ?? 0
  if (row.status === 'published' || row.status === 'draft') {
    editingStatus.value = row.status
  }
}

async function openDialog(row?: NewsItem, requested?: 'view' | 'edit') {
  dialogMode.value = resolveContentDialogMode({
    hasRow: Boolean(row),
    canWrite: canWrite.value,
    requested: row ? requested : 'create'
  })
  editingStatus.value = row?.status === 'published' || row?.status === 'draft' ? row.status : ''
  detailReady.value = false
  const result = await openNewsDetailDialog({
    row,
    session: detailSession,
    resetForm,
    applyForm: applyNewsDetail,
    fetchDetail: fetchNewsDetail,
    setEditingId: (id) => { editingId.value = id },
    setDialogVisible: (visible) => { dialogVisible.value = visible },
    setDetailLoading: (loading) => { detailLoading.value = loading },
    onLoadError: () => {
      ElMessage.error('动态正文加载失败，请重试')
    }
  })
  if (result.outcome === 'loaded' || result.outcome === 'create') {
    detailReady.value = true
  }
}

function openView(row: NewsItem) {
  return openDialog(row, 'view')
}

async function onSave() {
  if (readonly.value) return
  if (isNewsDraftSaveLocked({ saving: saving.value, detailLoading: detailLoading.value })) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    await confirmCoverClearIfNeeded(coverSavedUrl.value, form.cover, ({ message, title }) =>
      ElMessageBox.confirm(message, title, { type: 'warning', confirmButtonText: '确定清空', cancelButtonText: '取消' })
    )
  } catch {
    return
  }
  if (saveMode.value.needsLiveConfirm) {
    try {
      await ElMessageBox.confirm(saveMode.value.confirmMessage, saveMode.value.confirmTitle, {
        type: 'warning',
        confirmButtonText: '保存并更新',
        cancelButtonText: '取消'
      })
    } catch {
      return
    }
  }
  saving.value = true
  try {
    const payload = { ...form }
    if (editingId.value) {
      await updateNews(editingId.value, payload)
      ElMessage.success(saveMode.value.successText)
    } else {
      await createNews(payload)
      ElMessage.success(saveMode.value.successText)
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function onPublish(row: NewsItem) {
  await ElMessageBox.confirm(`发布「${row.title}」？发布后将同步至搜索索引。`, '发布确认')
  await publishNews(row.id)
  ElMessage.success('已发布')
  await loadData()
}

async function onUnpublish(row: NewsItem) {
  await ElMessageBox.confirm(`下架「${row.title}」？小程序端将不再展示。`, '下架确认', { type: 'warning' })
  await unpublishNews(row.id)
  ElMessage.success('已下架')
  await loadData()
}

async function onPublishFromDialog() {
  if (!editingId.value || dialogFooter.value.publishDisabled) return
  const title = form.title || '该动态'
  await ElMessageBox.confirm(`发布「${title}」？发布后将同步至搜索索引。`, '发布确认')
  await publishNews(editingId.value)
  ElMessage.success('已发布')
  dialogVisible.value = false
  await loadData()
}

async function onUnpublishFromDialog() {
  if (!editingId.value || dialogFooter.value.publishDisabled) return
  const title = form.title || '该动态'
  await ElMessageBox.confirm(`下架「${title}」？小程序端将不再展示。`, '下架确认', { type: 'warning' })
  await unpublishNews(editingId.value)
  ElMessage.success('已下架')
  dialogVisible.value = false
  await loadData()
}

async function onDelete(row: NewsItem) {
  await ElMessageBox.confirm(softDeleteConfirm(`「${row.title}」`), '删除确认', { type: 'warning' })
  await removeNews(row.id)
  ElMessage.success(MOVED_TO_RECYCLE_BIN)
  await loadData()
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadData()])
})
</script>

<style scoped lang="scss">
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.live-save-alert {
  margin-bottom: 12px;
}
</style>
