<template>
  <div class="page-card">
    <div class="page-header">
      <h2>订阅消息发件箱</h2>
    </div>

    <p class="text-muted">
      展示活动报名等场景的微信订阅消息投递队列。若用户「报名成功但未收到通知」，请先查看 failed / skipped 记录与 lastError。
    </p>

    <div class="filters">
      <el-select v-model="status" clearable placeholder="全部状态" style="width: 160px" @change="onSearch">
        <el-option label="待发送 pending" value="pending" />
        <el-option label="已发送 sent" value="sent" />
        <el-option label="已跳过 skipped" value="skipped" />
        <el-option label="失败 failed" value="failed" />
        <el-option label="处理中 processing" value="processing" />
      </el-select>
      <el-button type="primary" @click="onSearch">查询</el-button>
    </div>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="memberId" label="用户 ID" width="100" />
      <el-table-column prop="scene" label="场景" width="150" />
      <el-table-column prop="status" label="状态" width="110" />
      <el-table-column prop="attemptCount" label="尝试次数" width="100" />
      <el-table-column prop="lastError" label="最近错误" min-width="220" show-overflow-tooltip />
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column prop="sentAt" label="发送时间" width="170" />
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
import { onMounted, ref } from 'vue'
import { fetchSubscribeOutbox, type SubscribeOutboxItem } from '@/api/subscribeOutbox'

const loading = ref(false)
const list = ref<SubscribeOutboxItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const status = ref<string | undefined>()

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

onMounted(loadData)
</script>

<style scoped lang="scss">
.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
