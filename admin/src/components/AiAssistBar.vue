<template>
  <div class="ai-assist">
    <div v-if="actions.length" class="ai-assist-bar">
      <span class="ai-label">AI 辅助</span>
      <el-button
        v-for="action in actions"
        :key="action"
        size="small"
        :loading="loading && currentAction === action"
        :disabled="loading || !canRun"
        @click="run(action)"
      >
        {{ labels[action] }}
      </el-button>
      <span v-if="quotaText" class="ai-quota" :class="{ 'is-exhausted': remainingToday === 0 }">
        {{ quotaText }}
      </span>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="640px"
      destroy-on-close
      append-to-body
    >
      <el-alert
        v-if="usedFallback"
        type="info"
        :closable="false"
        show-icon
        title="当前为演示模式（未配置大模型 Key），结果仅供预览与采纳编辑。"
        class="ai-fallback-tip"
      />
      <el-input
        v-model="resultText"
        type="textarea"
        :rows="resultRows"
        maxlength="10000"
        show-word-limit
      />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onAdopt">采纳</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { polishContent, type AiPolishAction } from '@/api/ai'

const props = withDefaults(defineProps<{
  sourceText?: string
  actions?: AiPolishAction[]
  minLength?: number
  resultRows?: number
}>(), {
  sourceText: '',
  actions: () => ['polish', 'expand', 'summarize', 'title'],
  minLength: 4,
  resultRows: 8
})

const emit = defineEmits<{
  adopt: [payload: { action: AiPolishAction; text: string }]
}>()

const labels: Record<AiPolishAction, string> = {
  polish: '润色',
  expand: '扩写',
  summarize: '生成摘要',
  title: '生成标题'
}

const dialogTitles: Record<AiPolishAction, string> = {
  polish: '润色结果（确认后采纳）',
  expand: '扩写结果（确认后采纳）',
  summarize: '摘要建议（确认后采纳）',
  title: '标题建议（确认后采纳）'
}

const loading = ref(false)
const dialogVisible = ref(false)
const resultText = ref('')
const currentAction = ref<AiPolishAction>('polish')
const usedFallback = ref(false)

const canRun = computed(() => (props.sourceText || '').trim().length >= props.minLength)
const dialogTitle = computed(() => dialogTitles[currentAction.value])

/**
 * 剩余次数：只有真正调用过一次才知道，所以先不显示，拿到结果或撞上限后再常驻。
 * 不为它单开一个接口——编辑用一次刷新一次已经够用。
 */
const remainingToday = ref<number | null>(null)

const quotaText = computed(() => {
  if (remainingToday.value === null) return ''
  return remainingToday.value > 0 ? `今日剩余 ${remainingToday.value} 次` : '今日次数已用完'
})

async function run(action: AiPolishAction) {
  const content = (props.sourceText || '').trim()
  if (content.length < props.minLength) {
    ElMessage.warning('请先输入足够的内容后再使用 AI 辅助')
    return
  }
  loading.value = true
  currentAction.value = action
  try {
    const res = await polishContent(action, content)
    resultText.value = res.content || ''
    usedFallback.value = !!res.fallback
    if (typeof res.remainingToday === 'number') {
      remainingToday.value = res.remainingToday
    }
    dialogVisible.value = true
  } catch (e) {
    // 提示已由 request 拦截器统一弹出，这里只负责把余额同步成 0，
    // 顺便兜住这个 rejection——不接的话会变成一条 unhandled rejection
    if ((e as { code?: number } | null)?.code === 429) {
      remainingToday.value = 0
    }
  } finally {
    loading.value = false
  }
}

function onAdopt() {
  const text = resultText.value.trim()
  if (!text) {
    ElMessage.warning('采纳内容不能为空')
    return
  }
  emit('adopt', { action: currentAction.value, text })
  dialogVisible.value = false
  ElMessage.success('已采纳，可继续编辑后保存')
}
</script>

<style scoped lang="scss">
.ai-assist-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.ai-label {
  font-size: 12px;
  color: var(--el-color-primary);
  font-weight: 600;
}

/* 余额是提示不是操作，压在按钮右侧、弱化处理；用完才提到警示色 */
.ai-quota {
  margin-left: 2px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--brand-muted);

  &.is-exhausted {
    color: var(--el-color-warning);
    font-weight: 600;
  }
}

.ai-fallback-tip {
  margin-bottom: 12px;
}
</style>
