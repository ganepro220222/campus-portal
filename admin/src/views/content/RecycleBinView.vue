<template>
  <div class="page-card">
    <div class="page-header">
      <h2>回收站</h2>
    </div>

    <p class="text-muted">
      删除的内容会先进回收站，随时可以恢复。彻底删除前会先算清这条记录连着什么，
      并按影响大小要求不同的确认方式。
    </p>

    <div class="toolbar rb-toolbar">
      <!-- 13 个类型排一整条读不过来，按来源拆成三簇。
           每簇各是一个 el-radio-group，共用同一个 v-model：选中项只会有一个，
           视觉上却是三组独立的分段控件，和分类管理页的筛选是同一套组件。 -->
      <el-radio-group
        v-for="group in groupedSummary"
        :key="group.name"
        v-model="activeType"
        class="rb-cluster"
        @change="loadItems"
      >
        <el-radio-button v-for="t in group.items" :key="t.type" :value="t.type">
          {{ t.label }}
          <span v-if="t.count > 0" class="rb-count">{{ t.count > 99 ? '99+' : t.count }}</span>
        </el-radio-button>
      </el-radio-group>
      <el-button class="rb-refresh" :icon="Refresh" @click="refresh">刷新</el-button>
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

    <DangerDeleteDialog
      v-model="purgeVisible"
      :subject-label="impact?.typeLabel ?? ''"
      :name="impact?.name ?? pendingName"
      :risk="impact?.risk ?? 'LOW'"
      :references="impact?.references ?? []"
      :requires-password="impact?.requiresPassword ?? false"
      :can-proceed="impact?.canPurge ?? false"
      :loading-impact="impactLoading"
      :submitting="purging"
      @confirm="onPurgeConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DangerDeleteDialog from '@/components/DangerDeleteDialog.vue'
import {
  fetchRecycleImpact,
  fetchRecycleItems,
  fetchRecycleSummary,
  purgeRecycleItem,
  restoreRecycleItem,
  type DeleteImpact,
  type RecycleItem,
  type RecycleSummary
} from '@/api/recycleBin'

const loading = ref(false)
const summary = ref<RecycleSummary[]>([])
const items = ref<RecycleItem[]>([])
const activeType = ref('news')

const purgeVisible = ref(false)
const impactLoading = ref(false)
const purging = ref(false)
const impact = ref<DeleteImpact | null>(null)
const pendingId = ref<number | null>(null)
const pendingName = ref('')

/** 13 个类型平铺一排读不过来；分组由后端给，前端只负责保持顺序稳定 */
const groupedSummary = computed(() => {
  const order: string[] = []
  const map = new Map<string, RecycleSummary[]>()
  for (const t of summary.value) {
    const name = t.group || '其他'
    if (!map.has(name)) {
      map.set(name, [])
      order.push(name)
    }
    map.get(name)!.push(t)
  }
  return order.map((name) => ({ name, items: map.get(name)! }))
})

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
  pendingId.value = row.id
  pendingName.value = row.name
  impact.value = null
  impactLoading.value = true
  purgeVisible.value = true
  try {
    impact.value = await fetchRecycleImpact(activeType.value, row.id)
  } catch (e) {
    // 影响面算不出来就别让人往下点——宁可关掉重来，也不能在不知情的前提下删
    purgeVisible.value = false
    throw e
  } finally {
    impactLoading.value = false
  }
}

async function onPurgeConfirm(password: string) {
  if (pendingId.value == null) {
    return
  }
  purging.value = true
  try {
    await purgeRecycleItem(activeType.value, pendingId.value, password || undefined)
    purgeVisible.value = false
    ElMessage.success('已彻底删除')
    await refresh()
  } finally {
    purging.value = false
  }
}

onMounted(refresh)
</script>

<style scoped lang="scss">
/* 三簇分段控件之间留一口气，视觉上区分「内容 / 站点配置 / 系统」，
   又不必再单起一列灰色分组名——那一列把工具栏撑成了三行，和别的页对不上 */
.rb-toolbar {
  gap: 10px 18px;
}

/* 刷新按钮推到最右，和分类管理页的工具栏一致 */
.rb-refresh {
  margin-left: auto;
}

/* 计数贴在类型名后面，不用 el-badge：那是绝对定位的角标，
   在分段按钮里会顶出边框，且换行时位置会飘。
   用中性灰而不是危险红——回收站里有几条是中性信息，不是告警，
   一排红点会让整条工具栏看着像出了事。 */
.rb-count {
  display: inline-block;
  min-width: 16px;
  margin-left: 6px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--brand-line);
  color: var(--brand-sub);
  font-size: 11px;
  line-height: 16px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  vertical-align: 1px;
  transition: background-color 0.2s, color 0.2s;
}

/* 选中态底色是品牌深蓝，浅灰角标压上去几乎看不见，换成半透明白底白字 */
.rb-cluster :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) .rb-count {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}
</style>
