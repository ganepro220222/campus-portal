<template>
  <div class="page-card">
    <div class="page-header">
      <div class="header-title">
        <el-button :icon="ArrowLeft" link @click="router.back()">返回</el-button>
        <h2>报名管理</h2>
        <el-tag v-if="activity" :type="statusTagType(activity.status)" size="small">
          {{ statusLabel(activity.status) }}
        </el-tag>
      </div>
      <el-button
        v-if="canExport"
        type="primary"
        :icon="Download"
        :loading="exporting"
        @click="onExport('audit')"
      >导出审核台账</el-button>
      <el-button
        v-if="canExport"
        :icon="Download"
        :loading="exporting"
        @click="onExport('checkin')"
      >导出签到名单</el-button>
    </div>

    <div v-if="activity" class="activity-brief">
      <span class="brief-title">{{ activity.title }}</span>
      <span class="brief-meta">{{ activity.location }} · {{ activity.startTime }}</span>
      <span class="brief-meta">
        名额 {{ activity.enrolledCount }}/{{ activity.quota > 0 ? activity.quota : '不限' }}
        <template v-if="activity.needReview"> · 需审核</template>
      </span>
    </div>

    <div class="toolbar">
      <el-select v-model="filterStatus" placeholder="报名状态" clearable style="width: 130px" @change="onFilter">
        <el-option label="待审核" value="pending" />
        <el-option label="已通过" value="approved" />
        <el-option label="已拒绝" value="rejected" />
      </el-select>
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="name" label="姓名" width="100" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="college" label="学院" min-width="120" show-overflow-tooltip />
      <el-table-column prop="grade" label="年级" width="90" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="enrollTagType(row.status)" size="small">{{ row.statusLabel }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="voucherCode" label="凭证码" width="120" show-overflow-tooltip />
      <el-table-column prop="createTime" label="报名时间" width="150" />
      <el-table-column prop="rejectReason" label="拒绝原因" min-width="140" show-overflow-tooltip />
      <el-table-column label="操作" width="140" fixed="right" align="center">
        <template #default="{ row }">
          <template v-if="canReview && row.status === 'pending'">
            <el-button link type="success" @click="onApprove(row)">通过</el-button>
            <el-button link type="danger" @click="openReject(row)">拒绝</el-button>
          </template>
          <span v-else class="text-muted">—</span>
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

    <el-dialog v-model="rejectVisible" title="拒绝报名" width="440px" destroy-on-close>
      <el-form label-width="80px">
        <el-form-item label="学员">
          <span>{{ rejecting?.name }}（{{ rejecting?.phone }}）</span>
        </el-form-item>
        <el-form-item label="拒绝原因">
          <el-input
            v-model="rejectReason"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="将通知学员并释放名额"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="rejectingSaving" @click="onRejectConfirm">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Download, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  approveEnroll,
  fetchActivity,
  fetchEnrolls,
  rejectEnroll
} from '@/api/activity'
import { useAuthStore } from '@/stores/auth'
import { downloadFile } from '@/utils/download'
import type { ActivityItem, EnrollItem } from '@/types/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const activityId = computed(() => Number(route.params.id))
const canReview = computed(() => auth.can('enroll:read'))
const canExport = computed(() => auth.can('enroll:export'))

const loading = ref(false)
const exporting = ref(false)
const activity = ref<ActivityItem | null>(null)
const list = ref<EnrollItem[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterStatus = ref('')

const rejectVisible = ref(false)
const rejecting = ref<EnrollItem | null>(null)
const rejectReason = ref('')
const rejectingSaving = ref(false)

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

function enrollTagType(status: string) {
  if (status === 'approved') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'rejected') return 'danger'
  return 'info'
}

async function loadActivity() {
  activity.value = await fetchActivity(activityId.value)
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchEnrolls(activityId.value, {
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

async function onApprove(row: EnrollItem) {
  await ElMessageBox.confirm(`通过「${row.name}」的报名？`, '审核确认')
  await approveEnroll(row.id)
  ElMessage.success('已通过，已发送站内通知')
  await Promise.all([loadData(), loadActivity()])
}

function openReject(row: EnrollItem) {
  rejecting.value = row
  rejectReason.value = ''
  rejectVisible.value = true
}

async function onRejectConfirm() {
  if (!rejecting.value) return
  rejectingSaving.value = true
  try {
    await rejectEnroll(rejecting.value.id, rejectReason.value.trim() || undefined)
    ElMessage.success('已拒绝，名额已释放')
    rejectVisible.value = false
    await Promise.all([loadData(), loadActivity()])
  } finally {
    rejectingSaving.value = false
  }
}

async function onExport(scope: 'audit' | 'checkin') {
  exporting.value = true
  try {
    const suffix = scope === 'checkin' ? '签到名单' : '审核台账'
    await downloadFile(
      `/admin/activities/${activityId.value}/enrolls/export`,
      `活动报名_${suffix}_${activityId.value}.xlsx`,
      { scope }
    )
  } finally {
    exporting.value = false
  }
}

onMounted(async () => {
  await loadActivity()
  await loadData()
})
</script>

<style scoped lang="scss">
.header-title {
  display: flex;
  align-items: center;
  gap: 8px;

  h2 {
    margin: 0;
  }
}

.activity-brief {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
}

.brief-title {
  font-weight: 600;
  color: #303133;
}

.brief-meta {
  color: #606266;
}

.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
