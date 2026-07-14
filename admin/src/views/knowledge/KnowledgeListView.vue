<template>
  <div class="page-card">
    <div class="page-header">
      <h2>AI 知识库</h2>
      <el-button type="primary" :icon="Plus" @click="openCreate()">录入资料</el-button>
    </div>

    <p class="text-muted">
      录入书院文化文本后自动切分入库，小程序 AI 问答将基于这些资料作答。状态为「已就绪」后可被检索；
      编辑后会重新切分入库。
    </p>

    <!-- 检索自测「试问」 -->
    <div class="kb-test">
      <div class="kb-test-bar">
        <el-input
          v-model="testQuery"
          placeholder="输入一个问题，测试会命中哪些资料片段（如：什么是知行合一？）"
          clearable
          @keyup.enter="onTest"
        >
          <template #prepend>试问</template>
        </el-input>
        <el-button type="primary" :icon="Search" :loading="testing" @click="onTest">检索</el-button>
      </div>
      <div v-if="tested" class="kb-test-result">
        <el-empty v-if="!hits.length" description="未命中任何片段（可调整措辞，或补充相关资料后再试）" :image-size="70" />
        <div v-else>
          <div class="kb-test-hint">命中 {{ hits.length }} 个片段，按相关度排序：</div>
          <div v-for="(h, i) in hits" :key="i" class="kb-hit">
            <div class="kb-hit-head">
              <span class="kb-hit-title">{{ h.docTitle }}</span>
              <el-tag size="small" type="info" effect="plain">第 {{ h.chunkIndex + 1 }} 段</el-tag>
              <el-tag size="small" type="success" effect="plain">相关度 {{ h.score }}</el-tag>
            </div>
            <div class="kb-hit-text">{{ h.chunkText }}</div>
          </div>
        </div>
      </div>
    </div>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="chunkCount" label="分段数" width="90" align="center" />
      <el-table-column prop="charCount" label="字数" width="90" align="center" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">
            {{ row.statusLabel }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="参与检索" width="100" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status === 'ready'"
            :disabled="row.status !== 'ready' && row.status !== 'disabled'"
            @change="(val: string | number | boolean) => onToggleEnabled(row, val === true)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="录入时间" width="170" />
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button link type="primary" @click="openChunks(row)">查看分段</el-button>
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

    <!-- 录入 / 编辑 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑知识库资料' : '录入知识库资料'"
      width="640px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" v-loading="detailLoading">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="正文" prop="content">
          <div class="content-toolbar">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept=".txt,text/plain"
              :on-change="onPickTxt"
            >
              <el-button link type="primary" :icon="Upload">从 txt 文件导入</el-button>
            </el-upload>
            <span class="content-toolbar-tip">仅 .txt（UTF-8 编码），导入后可在下方编辑核对再入库</span>
          </div>
          <el-input v-model="form.content" type="textarea" :rows="12" maxlength="20000" show-word-limit />
          <el-alert
            v-if="contentRecoveredHint"
            class="content-recovered-alert"
            type="warning"
            :closable="false"
            show-icon
            title="该正文由历史分段近似还原，可能与原始录入不完全一致，保存前请核对。"
          />
          <div v-else class="form-tip">保存后将自动按约 500 字/段重新切分入库，原有分段会被替换。</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">{{ editingId ? '保存并重新入库' : '入库' }}</el-button>
      </template>
    </el-dialog>

    <!-- 查看分段 -->
    <el-dialog v-model="chunksVisible" :title="`分段预览 · ${chunksTitle}`" width="720px" destroy-on-close>
      <div v-loading="chunksLoading" class="kb-chunks">
        <el-empty v-if="!chunksLoading && !chunks.length" description="暂无分段" :image-size="70" />
        <div v-for="c in chunks" :key="c.chunkIndex" class="kb-chunk">
          <div class="kb-chunk-head">
            <el-tag size="small" type="info">第 {{ c.chunkIndex + 1 }} 段</el-tag>
            <span class="kb-chunk-meta">{{ c.charCount }} 字</span>
          </div>
          <div class="kb-chunk-text">{{ c.chunkText }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Upload } from '@element-plus/icons-vue'
import {
  createKnowledgeDoc,
  deleteKnowledgeDoc,
  fetchKnowledgeChunks,
  fetchKnowledgeDocDetail,
  fetchKnowledgeDocs,
  setKnowledgeDocEnabled,
  testKnowledgeRetrieve,
  updateKnowledgeDoc
} from '@/api/knowledge'
import type { KnowledgeChunkItem, KnowledgeDocItem, KnowledgeHit } from '@/api/knowledge'

function statusTagType(status: string) {
  if (status === 'ready') return 'success'
  if (status === 'disabled') return 'info'
  if (status === 'failed') return 'danger'
  return 'warning'
}

const loading = ref(false)
const saving = ref(false)
const list = ref<KnowledgeDocItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const dialogVisible = ref(false)
const detailLoading = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({ title: '', content: '' })
const contentRecoveredHint = ref(false)
const rules: FormRules = {
  title: [{ required: true, message: '请填写标题', trigger: 'blur' }],
  content: [{ required: true, message: '请填写正文', trigger: 'blur' }]
}

// 试问
const testQuery = ref('')
const testing = ref(false)
const tested = ref(false)
const hits = ref<KnowledgeHit[]>([])

// 分段预览
const chunksVisible = ref(false)
const chunksLoading = ref(false)
const chunksTitle = ref('')
const chunks = ref<KnowledgeChunkItem[]>([])

async function loadData() {
  loading.value = true
  try {
    const res = await fetchKnowledgeDocs(page.value, pageSize.value)
    list.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  contentRecoveredHint.value = false
  form.title = ''
  form.content = ''
  dialogVisible.value = true
}

async function openEdit(row: KnowledgeDocItem) {
  editingId.value = row.id
  contentRecoveredHint.value = false
  form.title = row.title
  form.content = ''
  dialogVisible.value = true
  detailLoading.value = true
  try {
    const detail = await fetchKnowledgeDocDetail(row.id)
    form.title = detail.title
    form.content = detail.content || ''
    contentRecoveredHint.value = detail.contentRecovered === true
  } finally {
    detailLoading.value = false
  }
}

async function onSave() {
  await formRef.value?.validate()
  saving.value = true
  try {
    const payload = { title: form.title.trim(), content: form.content.trim() }
    if (editingId.value) {
      await updateKnowledgeDoc(editingId.value, payload)
      ElMessage.success('已保存并重新入库')
    } else {
      await createKnowledgeDoc(payload)
      ElMessage.success('资料已入库')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function openChunks(row: KnowledgeDocItem) {
  chunksTitle.value = row.title
  chunks.value = []
  chunksVisible.value = true
  chunksLoading.value = true
  try {
    chunks.value = await fetchKnowledgeChunks(row.id)
  } finally {
    chunksLoading.value = false
  }
}

async function onTest() {
  const q = testQuery.value.trim()
  if (!q) {
    ElMessage.warning('请先输入一个问题')
    return
  }
  testing.value = true
  try {
    hits.value = await testKnowledgeRetrieve(q, 5)
    tested.value = true
  } finally {
    testing.value = false
  }
}

async function onToggleEnabled(row: KnowledgeDocItem, enabled: boolean) {
  try {
    await setKnowledgeDocEnabled(row.id, enabled)
    ElMessage.success(enabled ? '已启用，将参与 AI 检索' : '已停用，不再参与 AI 检索')
    await loadData()
  } catch {
    await loadData() // 失败时重载，让开关回到服务端真实状态
  }
}

/** 本地读取 .txt（UTF-8）回填录入表单，管理员核对后再入库——不经服务端，无解析风险 */
function onPickTxt(uploadFile: UploadFile) {
  const raw = uploadFile.raw
  if (!raw) return
  if (!/\.txt$/i.test(raw.name)) {
    ElMessage.warning('仅支持 .txt 文件')
    return
  }
  if (raw.size > 2 * 1024 * 1024) {
    ElMessage.warning('文件不超过 2MB')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result || '').trim()
    if (!text) {
      ElMessage.warning('文件内容为空')
      return
    }
    if (!form.title.trim()) {
      form.title = raw.name.replace(/\.txt$/i, '').slice(0, 200)
    }
    form.content = text.slice(0, 20000)
    contentRecoveredHint.value = false
    ElMessage.success('已读取，请核对后入库')
  }
  reader.onerror = () => ElMessage.error('文件读取失败')
  reader.readAsText(raw, 'utf-8')
}

async function onDelete(row: KnowledgeDocItem) {
  await ElMessageBox.confirm(`确定删除「${row.title}」？删除后不可恢复。`, '删除确认', { type: 'warning' })
  await deleteKnowledgeDoc(row.id)
  ElMessage.success('已删除')
  await loadData()
}

loadData()
</script>

<style scoped lang="scss">
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
.form-tip { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 6px; line-height: 1.5; }
.content-recovered-alert { margin-top: 8px; }
.content-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
.content-toolbar-tip { font-size: 12px; color: var(--el-text-color-secondary); }

.kb-test {
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
}
.kb-test-bar { display: flex; gap: 10px; }
.kb-test-bar .el-input { flex: 1; }
.kb-test-result { margin-top: 12px; }
.kb-test-hint { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 8px; }
.kb-hit {
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.kb-hit-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.kb-hit-title { font-weight: 600; color: var(--el-text-color-primary); font-size: 13px; }
.kb-hit-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.kb-chunks { max-height: 60vh; overflow-y: auto; }
.kb-chunk {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 10px;
}
.kb-chunk-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.kb-chunk-meta { font-size: 12px; color: var(--el-text-color-secondary); }
.kb-chunk-text { font-size: 13px; color: var(--el-text-color-regular); line-height: 1.7; white-space: pre-wrap; }
</style>
