<template>
  <div class="page-card">
    <div class="page-header">
      <h2>新闻管理</h2>
      <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openDialog()">新建新闻</el-button>
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
      <el-table-column label="操作" width="280" fixed="right" align="center">
        <template #default="{ row }">
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
      :title="editingId ? '编辑新闻' : '新建新闻'"
      width="860px"
      destroy-on-close
      top="5vh"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="标题" prop="title">
          <AiAssistBar
            v-if="canWrite"
            :source-text="titleAiSource"
            :actions="['title']"
            :min-length="8"
            :result-rows="5"
            @adopt="onTitleAiAdopt"
          />
          <el-input v-model="form.title" maxlength="200" show-word-limit />
          <FieldHint :text="FIELD_HINTS.listTitle" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面图">
          <CoverUploadField
            v-model="form.cover"
            v-model:fit-mode="form.coverFitMode"
            slot="newsList"
          />
        </el-form-item>
        <el-form-item label="摘要">
          <AiAssistBar
            v-if="canWrite"
            :source-text="summaryAiSource"
            :actions="['summarize']"
            :min-length="8"
            :result-rows="4"
            @adopt="onSummaryAiAdopt"
          />
          <el-input v-model="form.summary" type="textarea" :rows="2" maxlength="500" show-word-limit />
          <FieldHint :text="FIELD_HINTS.newsSummary" />
        </el-form-item>
        <el-form-item label="正文" prop="content">
          <AiAssistBar
            v-if="canWrite"
            :source-text="bodyAiSource"
            :actions="['polish', 'expand']"
            :min-length="8"
            @adopt="onBodyAiAdopt"
          />
          <WangEditor
            v-model="form.content"
            placeholder="撰写新闻正文，可插入图片与排版"
            @change="onContentChange"
          />
          <div class="form-tip">正文支持图文排版；AI 润色/扩写结果需确认采纳后才会写入</div>
          <FieldHint :text="FIELD_HINTS.editorBody" />
        </el-form-item>
        <el-form-item label="置顶">
          <el-switch v-model="form.isTop" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存草稿</el-button>
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
import { createNews, fetchNews, publishNews, removeNews, unpublishNews, updateNews } from '@/api/news'
import AiAssistBar from '@/components/AiAssistBar.vue'
import CoverUploadField from '@/components/CoverUploadField.vue'
import FieldHint from '@/components/FieldHint.vue'
const WangEditor = defineAsyncComponent(() => import('@/components/WangEditor.vue'))
import type { CoverFitMode } from '@/utils/cover'
import { FIELD_HINTS } from '@/utils/field-hints'
import { isEditorContentEmpty } from '@/utils/editor'
import { pickFirstTitleSuggestion, plainTextToHtml, stripHtml } from '@/utils/html'
import { useAuthStore } from '@/stores/auth'
import type { CategoryOption, NewsItem } from '@/types/api'

const auth = useAuthStore()
const canWrite = computed(() => auth.can('news:write'))
const canPublish = computed(() => auth.can('news:publish'))

const bodyAiSource = computed(() => stripHtml(form.content))
const summaryAiSource = computed(() => bodyAiSource.value || form.summary.trim())
const titleAiSource = computed(() => bodyAiSource.value || form.summary.trim() || form.title.trim())

const loading = ref(false)
const saving = ref(false)
const list = ref<NewsItem[]>([])
const categories = ref<CategoryOption[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterStatus = ref('')
const filterCategoryId = ref<number | undefined>()
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
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

function onBodyAiAdopt(payload: { action: AiPolishAction; text: string }) {
  if (payload.action !== 'polish' && payload.action !== 'expand') return
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
}

function openDialog(row?: NewsItem) {
  resetForm()
  editingId.value = row?.id ?? null
  if (row) {
    form.title = row.title
    form.cover = row.cover || ''
    form.coverFitMode = (row.coverFitMode === 'fit' ? 'fit' : 'fill')
    form.summary = row.summary || ''
    form.content = row.content || ''
    form.categoryId = row.categoryId ?? undefined
    form.isTop = row.isTop ?? 0
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
      await updateNews(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await createNews(payload)
      ElMessage.success('草稿已创建')
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

async function onDelete(row: NewsItem) {
  await ElMessageBox.confirm(
    `删除「${row.title}」？将移入回收站，可在「回收站」中恢复或彻底删除。`,
    '删除确认',
    { type: 'warning' }
  )
  await removeNews(row.id)
  ElMessage.success('已移入回收站')
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
