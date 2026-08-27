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
      <el-radio-group
        v-for="group in groupedSummary"
        :key="group.name"
        v-model="activeType"
        class="rb-cluster"
        :disabled="typeSwitchLocked"
        @change="loadItems"
      >
        <el-radio-button v-for="t in group.items" :key="t.type" :value="t.type">
          {{ t.label }}
          <span v-if="t.count > 0" class="rb-count">{{ t.count > 99 ? '99+' : t.count }}</span>
        </el-radio-button>
      </el-radio-group>
      <el-button class="rb-refresh" :icon="Refresh" :disabled="typeSwitchLocked" @click="refresh" />
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
      :can-proceed="purgeCanProceed"
      :loading-impact="impactLoading"
      :submitting="purging"
      @confirm="onPurgeConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import DangerDeleteDialog from '@/components/DangerDeleteDialog.vue'
import {
  deleteImpactMatchesPending,
  shouldApplyDeleteImpactResult
} from '@/utils/deleteImpactRequest'
import { shouldApplyRecycleListResult } from '@/utils/recycleBinListRequest'
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
let listRequestSeq = 0

const purgeVisible = ref(false)
const impactLoading = ref(false)
const purging = ref(false)
const impact = ref<DeleteImpact | null>(null)
const pendingId = ref<number | null>(null)
const pendingType = ref<string | null>(null)
const pendingName = ref('')
let impactRequestSeq = 0

const typeSwitchLocked = computed(() => purgeVisible.value || impactLoading.value)

const purgeCanProceed = computed(
  () =>
    (impact.value?.canPurge ?? false) &&
    deleteImpactMatchesPending(impact.value, pendingId.value, pendingType.value)
)

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

function invalidatePurgeImpactRequest() {
  impactRequestSeq++
  pendingId.value = null
  pendingType.value = null
  pendingName.value = ''
  impact.value = null
  impactLoading.value = false
}

watch(purgeVisible, (visible) => {
  if (!visible) {
    invalidatePurgeImpactRequest()
  }
})

async function loadSummary() {
  summary.value = await fetchRecycleSummary()
  if (!summary.value.some((t) => t.type === activeType.value) && summary.value.length) {
    activeType.value = summary.value[0].type
  }
}

async function loadItems() {
  const type = activeType.value
  const seq = ++listRequestSeq
  loading.value = true
  items.value = []
  try {
    const result = await fetchRecycleItems(type)
    if (!shouldApplyRecycleListResult(type, activeType.value, seq, listRequestSeq)) {
      return
    }
    items.value = result
  } finally {
    if (seq === listRequestSeq) {
      loading.value = false
    }
  }
}

async function refresh() {
  await loadSummary()
  await loadItems()
}

function restoreConfirmMessage(type: string, name: string): string {
  const subject = `恢复「${name}」？`
  switch (type) {
    case 'announcement':
    case 'banner':
    case 'nav_item':
    case 'college_app':
    case 'category':
      return `${subject}恢复后为禁用状态，不会立即对外展示，需手动启用。`
    case 'sys_user':
      return `${subject}恢复后为禁用状态，旧登录会话已失效，需手动启用后方可登录。`
    case 'sys_role':
      return `${subject}恢复后可在角色管理中继续配置。`
    default:
      return `${subject}恢复后仍为下架 / 草稿状态，需另行上架方可对外展示。`
  }
}

async function onRestore(row: RecycleItem) {
  await ElMessageBox.confirm(restoreConfirmMessage(row.type, row.name), '恢复确认')
  await restoreRecycleItem(row.type, row.id)
  ElMessage.success('已恢复')
  await refresh()
}

async function onPurge(row: RecycleItem) {
  const type = row.type
  const id = row.id
  const seq = ++impactRequestSeq

  pendingId.value = id
  pendingType.value = type
  pendingName.value = row.name
  impact.value = null
  impactLoading.value = true
  purgeVisible.value = true

  try {
    const result = await fetchRecycleImpact(type, id)
    if (
      !shouldApplyDeleteImpactResult({
        requestedId: id,
        requestedType: type,
        currentId: pendingId.value,
        currentType: pendingType.value,
        seq,
        latestSeq: impactRequestSeq,
        dialogVisible: purgeVisible.value
      })
    ) {
      return
    }
    impact.value = result
  } catch (e) {
    if (
      shouldApplyDeleteImpactResult({
        requestedId: id,
        requestedType: type,
        currentId: pendingId.value,
        currentType: pendingType.value,
        seq,
        latestSeq: impactRequestSeq,
        dialogVisible: purgeVisible.value
      })
    ) {
      purgeVisible.value = false
    }
    throw e
  } finally {
    if (seq === impactRequestSeq) {
      impactLoading.value = false
    }
  }
}

async function onPurgeConfirm(password: string) {
  if (
    pendingId.value == null ||
    pendingType.value == null ||
    !deleteImpactMatchesPending(impact.value, pendingId.value, pendingType.value)
  ) {
    return
  }
  purging.value = true
  try {
    await purgeRecycleItem(pendingType.value, pendingId.value, password || undefined)
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
  gap: 10px 18px;
}

.rb-refresh {
  margin-left: auto;
}

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

.rb-cluster :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) .rb-count {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}
</style>
