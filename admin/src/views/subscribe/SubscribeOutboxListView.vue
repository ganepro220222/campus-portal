<template>
  <div class="page-card">
    <div class="page-header">
      <h2>通知发送记录</h2>
    </div>

    <p class="text-muted">
      学生报名活动后，小程序会给他发一条微信通知。这里记录每一条通知发出去没有；
      若有学生反映「报名了但没收到通知」，在这里就能查到原因。
    </p>

    <el-alert type="info" :closable="false" show-icon class="page-hint">
      <template #title>
        「已跳过」通常不是故障——学生报名时没有点「允许接收通知」，系统就发不出去，这是正常的。
        需要处理的是<b>发送失败</b>，以及原因里写着「未配置」「缺少」的那几条。
      </template>
    </el-alert>

    <div class="filters">
      <el-radio-group v-model="status" @change="onSearch">
        <el-radio-button value="attention">需要关注</el-radio-button>
        <el-radio-button value="failed">发送失败</el-radio-button>
        <el-radio-button value="skipped">已跳过</el-radio-button>
        <el-radio-button value="sent">已发送</el-radio-button>
        <el-radio-button value="">全部</el-radio-button>
      </el-radio-group>
      <el-button :loading="loading" @click="loadData">刷新</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="list"
      stripe
      border
      :empty-text="emptyText"
    >
      <el-table-column label="活动" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.activityTitle">{{ row.activityTitle }}</span>
          <span v-else class="cell-empty">—</span>
        </template>
      </el-table-column>

      <el-table-column label="通知类型" width="160">
        <template #default="{ row }">{{ sceneLabel(row.scene) }}</template>
      </el-table-column>

      <el-table-column label="接收人" width="170" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.receiver">{{ row.receiver }}</span>
          <span v-else class="cell-empty">—</span>
        </template>
      </el-table-column>

      <el-table-column label="结果" width="110">
        <template #default="{ row }">
          <el-tag :type="statusTone(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="原因与处理建议" min-width="300">
        <template #default="{ row }">
          <div v-if="reasonOf(row).text" class="reason">
            <div class="reason-text">{{ reasonOf(row).text }}</div>
            <div v-if="reasonOf(row).hint" class="reason-hint">{{ reasonOf(row).hint }}</div>
          </div>
          <span v-else class="cell-empty">—</span>
        </template>
      </el-table-column>

      <el-table-column label="时间" width="170">
        <template #default="{ row }">
          <div>{{ row.sentAt || row.createTime }}</div>
          <div v-if="row.sentAt" class="time-note">送达</div>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="canRetry(row)"
            link
            type="primary"
            :loading="retryingId === row.id"
            @click="onRetry(row)"
          >
            重新发送
          </el-button>
          <span v-else class="cell-empty">—</span>
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  fetchSubscribeOutbox,
  retrySubscribeOutbox,
  type SubscribeOutboxItem
} from '@/api/subscribeOutbox'
import { reasonView, retryMakesSense, sceneLabel, statusLabel, statusTone } from './outboxLabels'

const loading = ref(false)
const list = ref<SubscribeOutboxItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const retryingId = ref<number | null>(null)
// 默认只看异常：老师打开这个页面就是因为有人没收到通知，
// 几千条「已发送」混在里面反而把要处理的那几条淹没了。
const status = ref('attention')

const emptyText = computed(() =>
  status.value === 'attention' ? '很好，暂时没有需要关注的通知' : '暂无记录'
)

function reasonOf(row: SubscribeOutboxItem) {
  return reasonView(row.reasonCode, row.lastError)
}

/** 后端允许重发（终态）+ 重发确实可能成功，两者都满足才给按钮 */
function canRetry(row: SubscribeOutboxItem) {
  return row.canRetry && retryMakesSense(row.reasonCode)
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchSubscribeOutbox({
      page: page.value,
      size: pageSize.value,
      status: status.value || undefined
    })
    list.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 1
  loadData()
}

async function onRetry(row: SubscribeOutboxItem) {
  const who = row.receiver || '该学生'
  await ElMessageBox.confirm(
    `将重新向 ${who} 发送一次「${sceneLabel(row.scene)}」。若原因尚未解决，仍会失败。`,
    '重新发送',
    { confirmButtonText: '重新发送', cancelButtonText: '取消', type: 'warning' }
  )
  retryingId.value = row.id
  try {
    await retrySubscribeOutbox(row.id)
    ElMessage.success('已重新加入发送队列，稍后可刷新查看结果')
    await loadData()
  } finally {
    retryingId.value = null
  }
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.page-hint {
  margin-bottom: 16px;
}
.filters {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
/* 结论一行、处置一行：行高换可读性，这个页面本来就是「出问题时才来看」 */
.reason-text {
  line-height: 1.5;
}
.reason-hint {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
.time-note {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.cell-empty {
  color: var(--el-text-color-placeholder);
}
</style>
