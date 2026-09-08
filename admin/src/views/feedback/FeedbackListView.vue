<template>
  <div class="page-card">
    <div class="page-header">
      <h2>意见反馈</h2>
      <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 140px" @change="onFilter">
        <el-option label="待处理" value="pending" />
        <el-option label="已回复" value="replied" />
      </el-select>
    </div>

    <p class="text-muted">
      查看小程序用户提交的意见反馈及附图。提交回复后，用户会在小程序消息中心收到通知。
      测试或误提交的条目可以删除，不会进入回收站。
    </p>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="createTime" label="提交时间" width="150" />
      <el-table-column prop="memberNickname" label="用户" width="120" show-overflow-tooltip />
      <el-table-column prop="type" label="类型" width="100" />
      <el-table-column prop="content" label="反馈内容" min-width="240" show-overflow-tooltip />
      <el-table-column prop="contact" label="联系方式" width="130" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'replied' ? 'success' : 'warning'" size="small">
            {{ row.status === 'replied' ? '已回复' : '待处理' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openReply(row)">
            {{ row.status === 'replied' ? '查看' : '回复' }}
          </el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" destroy-on-close>
      <div v-if="current" class="detail-block">
        <div class="detail-row"><span class="label">用户</span>{{ current.memberNickname || '—' }}</div>
        <div class="detail-row"><span class="label">类型</span>{{ current.type }}</div>
        <div class="detail-row"><span class="label">联系方式</span>{{ current.contact || '—' }}</div>
        <div class="detail-row"><span class="label">提交时间</span>{{ current.createTime }}</div>
        <div class="detail-content">
          <span class="label">反馈内容</span>
          <p>{{ current.content }}</p>
        </div>
        <div v-if="current.images?.length" class="detail-content">
          <span class="label">反馈附图</span>
          <div class="detail-images">
            <el-image
              v-for="(url, index) in current.images"
              :key="`${url}-${index}`"
              :src="url"
              :preview-src-list="current.images"
              :initial-index="index"
              fit="cover"
              class="detail-image"
              preview-teleported
            />
          </div>
        </div>
        <div v-if="current.reply" class="detail-content replied">
          <span class="label">已回复</span>
          <p>{{ current.reply }}</p>
          <small v-if="current.repliedAt" class="text-muted">于 {{ current.repliedAt }}</small>
        </div>
      </div>
      <el-form v-if="canReply" ref="formRef" :model="form" :rules="rules" label-width="80px" class="reply-form">
        <el-form-item label="回复" prop="reply">
          <el-input v-model="form.reply" type="textarea" :rows="4" maxlength="2000" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="danger" plain :loading="deleting" @click="current && onDelete(current)">删除</el-button>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button v-if="canReply" type="primary" :loading="saving" @click="onSaveReply">提交回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteFeedback, fetchFeedbacks, replyFeedback } from '@/api/feedback'
import type { FeedbackItem } from '@/types/api'
import {
  loadFeedbackListPage,
  runFeedbackReplyAndReload
} from '@/utils/feedbackListPage.mjs'
import { normalizeListPage } from '@/utils/listPageNormalize'
import { shouldApplyListResult } from '@/utils/listRequestSeq'

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const list = ref<FeedbackItem[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const statusFilter = ref<string | undefined>()
let listRequestSeq = 0

const dialogVisible = ref(false)
const current = ref<FeedbackItem | null>(null)
const formRef = ref<FormInstance>()
const form = reactive({ reply: '' })

const rules: FormRules = {
  reply: [{ required: true, message: '请填写回复内容', trigger: 'blur' }]
}

const canReply = computed(() => current.value?.status === 'pending')
const dialogTitle = computed(() => (canReply.value ? '回复反馈' : '反馈详情'))

async function loadData() {
  const seq = ++listRequestSeq
  loading.value = true
  try {
    const res = await loadFeedbackListPage({
      page: page.value,
      pageSize: pageSize.value,
      statusFilter: statusFilter.value,
      fetchFeedbacks,
      normalizeListPage
    })
    if (!shouldApplyListResult(seq, listRequestSeq)) {
      return
    }
    page.value = res.page
    list.value = res.records as FeedbackItem[]
    total.value = res.total
  } finally {
    if (shouldApplyListResult(seq, listRequestSeq)) {
      loading.value = false
    }
  }
}

function onFilter() {
  page.value = 1
  loadData()
}

function openReply(row: FeedbackItem) {
  current.value = row
  form.reply = row.reply || ''
  dialogVisible.value = true
}

async function onDelete(row: FeedbackItem) {
  await ElMessageBox.confirm(
    '删除这条反馈？管理端和学生的「我的反馈」都不再显示。已发出的站内消息会保留，但不能再打开原单。',
    '删除确认',
    { type: 'warning', confirmButtonText: '确定删除', confirmButtonClass: 'el-button--danger' }
  )
  deleting.value = true
  try {
    await deleteFeedback(row.id)
    ElMessage.success('已删除')
    if (current.value?.id === row.id) {
      dialogVisible.value = false
      current.value = null
    }
    await loadData()
  } finally {
    deleting.value = false
  }
}

async function onSaveReply() {
  if (!current.value || !formRef.value) return
  await formRef.value.validate()
  saving.value = true
  try {
    await runFeedbackReplyAndReload({
      currentId: current.value.id,
      reply: form.reply.trim(),
      replyFeedback,
      reloadList: loadData,
      onSaved({ successMessage }) {
        ElMessage.success(successMessage)
        dialogVisible.value = false
        current.value = null
      }
    })
  } finally {
    saving.value = false
  }
}

loadData()
</script>

<style scoped>
.detail-block { margin-bottom: 8px; }
.detail-row { margin-bottom: 10px; font-size: 14px; color: #303133; }
.detail-content { margin-top: 14px; }
.detail-content p {
  margin: 8px 0 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
}
.detail-content.replied p { background: #f0f9eb; }
.detail-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}
.detail-image {
  width: 96px;
  height: 96px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  cursor: zoom-in;
}
.label {
  display: inline-block;
  width: 72px;
  color: #909399;
  font-size: 13px;
}
.reply-form { margin-top: 16px; }
</style>
