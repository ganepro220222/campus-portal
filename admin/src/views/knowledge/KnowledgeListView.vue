<template>
  <div class="page-card">
    <div class="page-header">
      <h2>AI 知识库</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">录入资料</el-button>
    </div>

    <p class="text-muted">
      录入书院文化文本后自动切分入库，小程序 AI 问答将基于这些资料作答。状态为「已就绪」后可被检索。
    </p>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="chunkCount" label="分段数" width="90" align="center" />
      <el-table-column prop="charCount" label="字数" width="90" align="center" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ready' ? 'success' : 'warning'" size="small">
            {{ row.statusLabel }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="录入时间" width="170" />
      <el-table-column label="操作" width="100" fixed="right" align="center">
        <template #default="{ row }">
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

    <el-dialog v-model="dialogVisible" title="录入知识库资料" width="640px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="正文" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="12" maxlength="20000" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { createKnowledgeDoc, deleteKnowledgeDoc, fetchKnowledgeDocs } from '@/api/knowledge'
import type { KnowledgeDocItem } from '@/api/knowledge'

const loading = ref(false)
const saving = ref(false)
const list = ref<KnowledgeDocItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const dialogVisible = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({ title: '', content: '' })
const rules: FormRules = {
  title: [{ required: true, message: '请填写标题', trigger: 'blur' }],
  content: [{ required: true, message: '请填写正文', trigger: 'blur' }]
}

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

function openDialog() {
  form.title = ''
  form.content = ''
  dialogVisible.value = true
}

async function onSave() {
  await formRef.value?.validate()
  saving.value = true
  try {
    await createKnowledgeDoc({ title: form.title.trim(), content: form.content.trim() })
    ElMessage.success('资料已入库')
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function onDelete(row: KnowledgeDocItem) {
  await ElMessageBox.confirm(`确定删除「${row.title}」？`, '删除确认')
  await deleteKnowledgeDoc(row.id)
  ElMessage.success('已删除')
  await loadData()
}

loadData()
</script>

<style scoped>
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
