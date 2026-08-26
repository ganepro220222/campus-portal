<template>
  <div class="page-card">
    <div class="page-header">
      <h2>回收站</h2>
    </div>

    <p class="text-muted">
      内容与配置项删除后会先移入回收站，随时可以恢复。彻底删除会先算清这条记录连着什么：
      没有关联数据的直接删；连着报名、收藏等记录的会列出清单并要求重输管理员密码；
      分类下还挂着内容、角色下还挂着管理员的，会告诉你先处理什么。
    </p>

    <div class="rb-toolbar">
      <div class="rb-groups">
        <div v-for="group in groupedSummary" :key="group.name" class="rb-group">
          <span class="rb-group-name">{{ group.name }}</span>
          <div class="rb-chips">
            <button
              v-for="t in group.items"
              :key="t.type"
              type="button"
              class="rb-chip"
              :class="{ 'is-active': activeType === t.type }"
              @click="onSelectType(t.type)"
            >
              {{ t.label }}
              <span v-if="t.count > 0" class="rb-chip-count">{{ t.count > 99 ? '99+' : t.count }}</span>
            </button>
          </div>
        </div>
      </div>
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

function onSelectType(type: string) {
  if (activeType.value === type) {
    return
  }
  activeType.value = type
  loadItems()
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
.rb-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin: 8px 0 18px;
}

.rb-groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
  /* 分组区可以换行收缩，右侧刷新按钮不参与挤压 */
  min-width: 0;
  flex: 1;
}

.rb-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rb-group-name {
  flex: none;
  width: 56px;
  font-size: 12px;
  color: var(--brand-muted);
  text-align: right;
}

.rb-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

/* 用自绘 chip 而不是 el-radio-button：13 个按钮换行后，
   radio-button 只给首尾加圆角的「连排」样式会在断行处露出直角豁口 */
.rb-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--brand-line);
  border-radius: 999px;
  background: #fff;
  color: var(--brand-sub);
  font-size: 13px;
  font-family: inherit;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    color: var(--brand-primary);
  }

  &.is-active {
    border-color: var(--brand-primary);
    background: var(--brand-primary);
    color: #fff;
  }

  &:focus-visible {
    outline: 2px solid var(--el-color-primary-light-5);
    outline-offset: 2px;
  }
}

.rb-chip-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--el-color-danger);
  color: #fff;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 选中态下角标改用白底深字，避免红底压在深蓝底上糊成一团 */
.rb-chip.is-active .rb-chip-count {
  background: #fff;
  color: var(--brand-primary);
}

@media (max-width: 900px) {
  .rb-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  .rb-group {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }
  .rb-group-name {
    width: auto;
    text-align: left;
  }
}
</style>
