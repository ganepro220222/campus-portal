<template>
  <div class="page-card">
    <div class="page-header">
      <h2>操作日志</h2>
    </div>

    <p class="text-muted">记录管理后台所有写操作（新增/修改/删除），可按时间与关键词检索，满足验收「操作有日志」。</p>

    <div class="filters">
      <el-input
        v-model="keyword"
        placeholder="搜索动作或路径"
        clearable
        style="width: 220px"
        @keyup.enter="onSearch"
        @clear="onSearch"
      />
      <el-date-picker
        v-model="dateRange"
        class="date-range"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        @change="onSearch"
      />
      <el-button type="primary" @click="onSearch">查询</el-button>
    </div>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="createdAt" label="时间" width="170" />
      <el-table-column prop="operatorName" label="操作人" width="120" show-overflow-tooltip />
      <el-table-column prop="action" label="动作" min-width="180" show-overflow-tooltip />
      <el-table-column prop="target" label="请求路径" min-width="240" show-overflow-tooltip />
      <el-table-column prop="ip" label="IP" width="140" show-overflow-tooltip />
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
import { fetchSysLogs } from '@/api/sysLog'
import type { SysLogItem } from '@/api/sysLog'

const loading = ref(false)
const list = ref<SysLogItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const dateRange = ref<[string, string] | null>(null)

async function loadData() {
  loading.value = true
  try {
    const res = await fetchSysLogs({
      page: page.value,
      size: pageSize.value,
      keyword: keyword.value.trim() || undefined,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1]
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

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
/* 日期区间控件固定为紧凑宽度，避免在 flex 行内被拉伸得过长 */
.filters :deep(.date-range.el-date-editor) {
  width: 340px;
  flex: none;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
