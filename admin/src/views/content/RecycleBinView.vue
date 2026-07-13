<template>
  <div class="page-card">
    <div class="page-header">
      <h2>回收站</h2>
    </div>

    <p class="text-muted">
      展馆、文创、课程、资源、新闻、活动删除后会移入回收站（需先下架 / 取消）。可随时恢复；
      彻底删除前会校验报名、收藏等业务引用，存在引用时将被拦截，以保证历史统计的完整性。
    </p>

    <div class="rb-tabs">
      <el-radio-group v-model="activeType" @change="loadItems">
        <el-radio-button v-for="t in summary" :key="t.type" :value="t.type">
          {{ t.label }}
          <el-badge
            v-if="t.count > 0"
            :value="t.count"
            :max="99"
            class="rb-badge"
            type="danger"
          />
        </el-radio-button>
      </el-radio-group>
      <el-button :icon="Refresh" @click="refresh">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="items" stripe border>
      <el-table-column type="index" label="#" width="60" align="center" />
      <el-table-column prop="name" label="名称" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.name || '（未命名）' }}
        </template>
      </el-table-column>
      <el-table-column prop="deletedTime" label="删除时间" width="200" />
      <el-table-column label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="onRestore(row)">恢复</el-button>
          <el-button link type="danger" @click="onPurge(row)">彻底删除</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="回收站为空" :image-size="90" />
      </template>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  fetchRecycleItems,
  fetchRecycleSummary,
  purgeRecycleItem,
  restoreRecycleItem,
  type RecycleItem,
  type RecycleSummary
} from '@/api/recycleBin'

const loading = ref(false)
const summary = ref<RecycleSummary[]>([])
const items = ref<RecycleItem[]>([])
const activeType = ref('news')

async function loadSummary() {
  summary.value = await fetchRecycleSummary()
  if (!summary.value.some((t) => t.type === activeType.value) && summary.value.length) {
    activeType.value = summary.value[0].type
  }
}

async function loadItems() {
  loading.value = true
  try {
    items.value = await fetchRecycleItems(activeType.value)
  } finally {
    loading.value = false
  }
}

async function refresh() {
  await loadSummary()
  await loadItems()
}

async function onRestore(row: RecycleItem) {
  await ElMessageBox.confirm(
    `恢复「${row.name}」？恢复后仍为下架 / 草稿状态，需另行上架方可对外展示。`,
    '恢复确认'
  )
  await restoreRecycleItem(activeType.value, row.id)
  ElMessage.success('已恢复')
  await refresh()
}

async function onPurge(row: RecycleItem) {
  await ElMessageBox.confirm(
    `彻底删除「${row.name}」？此操作不可撤销，将从数据库永久移除。若仍存在报名 / 收藏等业务引用，系统会自动拦截。`,
    '彻底删除',
    { type: 'warning', confirmButtonText: '彻底删除', confirmButtonClass: 'el-button--danger' }
  )
  await purgeRecycleItem(activeType.value, row.id)
  ElMessage.success('已彻底删除')
  await refresh()
}

onMounted(refresh)
</script>

<style scoped lang="scss">
.rb-tabs {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 4px 0 16px;
  flex-wrap: wrap;
}
.rb-badge {
  margin-left: 2px;
}
</style>
