<template>
  <div class="page-card">
    <div class="page-header">
      <h2>活动管理</h2>
      <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openDialog()">新建活动</el-button>
    </div>

    <p class="text-muted">
      维护活动基础信息与发布状态；发布后小程序端可见。报名审核与导出请进入「报名管理」。
    </p>

    <div class="toolbar">
      <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 120px" @change="onFilter">
        <el-option label="草稿" value="draft" />
        <el-option label="已发布" value="published" />
        <el-option label="已取消" value="cancelled" />
      </el-select>
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="title" label="活动名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="location" label="地点" width="120" show-overflow-tooltip />
      <el-table-column prop="startTime" label="开始时间" width="150" />
      <el-table-column label="名额" width="100" align="center">
        <template #default="{ row }">
          <span :class="{ 'text-danger': row.full }">
            {{ row.enrolledCount }}/{{ row.quota > 0 ? row.quota : '不限' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="审核" width="80" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.needReview" type="warning" size="small">需审核</el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right" align="center">
        <template #default="{ row }">
          <el-button v-if="canWrite && row.status !== 'cancelled'" link type="primary" @click="openDialog(row)">
            编辑
          </el-button>
          <el-button
            v-if="canWrite && row.status === 'draft'"
            link
            type="success"
            @click="onPublish(row)"
          >发布</el-button>
          <el-button
            v-if="canWrite && row.status !== 'cancelled'"
            link
            type="warning"
            @click="onCancel(row)"
          >取消活动</el-button>
          <el-button v-if="canEnroll" link type="primary" @click="goEnrolls(row)">报名管理</el-button>
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
      :title="editingId ? '编辑活动' : '新建活动'"
      width="640px"
      destroy-on-close
      top="5vh"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="活动名称" prop="title">
          <el-input v-model="form.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="封面图">
          <CoverUploadField
            v-model="form.cover"
            v-model:fit-mode="form.coverFitMode"
            slot="activityHero"
          />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.intro" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="活动地点">
          <el-input v-model="form.location" maxlength="100" />
        </el-form-item>
        <el-form-item label="活动时间" required>
          <div class="time-row">
            <el-date-picker
              v-model="form.startTime"
              type="datetime"
              placeholder="开始"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm"
              style="width: 100%"
            />
            <span class="time-sep">至</span>
            <el-date-picker
              v-model="form.endTime"
              type="datetime"
              placeholder="结束"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm"
              style="width: 100%"
            />
          </div>
        </el-form-item>
        <el-form-item label="报名时间">
          <div class="time-row">
            <el-date-picker
              v-model="form.enrollStartTime"
              type="datetime"
              placeholder="开始"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm"
              style="width: 100%"
            />
            <span class="time-sep">至</span>
            <el-date-picker
              v-model="form.enrollEndTime"
              type="datetime"
              placeholder="截止"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm"
              style="width: 100%"
            />
          </div>
          <div class="form-tip">不填则默认与活动时间一致，由后端校验</div>
        </el-form-item>
        <el-form-item label="名额">
          <el-input-number v-model="form.quota" :min="0" :max="99999" />
          <span class="inline-tip">0 表示不限名额</span>
        </el-form-item>
        <el-form-item label="报名审核">
          <el-switch v-model="form.needReview" :active-value="1" :inactive-value="0" />
          <span class="inline-tip">开启后提交即占位，需管理员审核通过</span>
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
import { useRouter } from 'vue-router'
import { Plus, Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  cancelActivity,
  createActivity,
  fetchActivities,
  publishActivity,
  updateActivity
} from '@/api/activity'
import { useAuthStore } from '@/stores/auth'
import CoverUploadField from '@/components/CoverUploadField.vue'
import type { ActivityItem } from '@/types/api'
import type { CoverFitMode } from '@/utils/cover'

const router = useRouter()
const auth = useAuthStore()
const canWrite = computed(() => auth.can('admin:super'))
const canEnroll = computed(() => auth.can('enroll:read'))

const loading = ref(false)
const saving = ref(false)
const list = ref<ActivityItem[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterStatus = ref('')
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  title: '',
  cover: '',
  coverFitMode: 'fill' as CoverFitMode,
  intro: '',
  location: '',
  startTime: '',
  endTime: '',
  enrollStartTime: '',
  enrollEndTime: '',
  quota: 0,
  needReview: 0
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入活动名称', trigger: 'blur' }]
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    cancelled: '已取消'
  }
  return map[status] || status
}

function statusTagType(status: string) {
  if (status === 'published') return 'success'
  if (status === 'cancelled') return 'info'
  return 'warning'
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchActivities({
      page: page.value,
      size: pageSize.value,
      status: filterStatus.value || undefined
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
  form.title = ''
  form.cover = ''
  form.coverFitMode = 'fill'
  form.intro = ''
  form.location = ''
  form.startTime = ''
  form.endTime = ''
  form.enrollStartTime = ''
  form.enrollEndTime = ''
  form.quota = 0
  form.needReview = 0
}

function openDialog(row?: ActivityItem) {
  resetForm()
  editingId.value = row?.id ?? null
  if (row) {
    form.title = row.title
    form.cover = row.cover || ''
    form.coverFitMode = row.coverFitMode === 'fit' ? 'fit' : 'fill'
    form.intro = row.intro || ''
    form.location = row.location || ''
    form.startTime = row.startTime || ''
    form.endTime = row.endTime || ''
    form.enrollStartTime = row.enrollStartTime || ''
    form.enrollEndTime = row.enrollEndTime || ''
    form.quota = row.quota ?? 0
    form.needReview = row.needReview ? 1 : 0
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
      await updateActivity(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await createActivity(payload)
      ElMessage.success('活动已创建（草稿）')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function onPublish(row: ActivityItem) {
  await ElMessageBox.confirm(`发布「${row.title}」？发布后学员可在小程序报名。`, '发布确认')
  await publishActivity(row.id)
  ElMessage.success('已发布')
  await loadData()
}

async function onCancel(row: ActivityItem) {
  await ElMessageBox.confirm(
    `取消「${row.title}」？取消后不可再编辑，已有报名需另行处理。`,
    '取消活动',
    { type: 'warning' }
  )
  await cancelActivity(row.id)
  ElMessage.success('活动已取消')
  await loadData()
}

function goEnrolls(row: ActivityItem) {
  router.push({ name: 'ActivityEnrolls', params: { id: row.id } })
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.time-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.time-sep {
  color: #909399;
  flex-shrink: 0;
}

.inline-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}

.text-danger {
  color: #f56c6c;
  font-weight: 500;
}
</style>
