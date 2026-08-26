<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="520px"
    align-center
    destroy-on-close
    class="danger-delete-dialog"
    @opened="onOpened"
    @closed="onClosed"
  >
    <div v-loading="loadingImpact" class="dd-body">
      <p class="dd-subject">
        即将彻底删除{{ subjectLabel }}
        <strong>{{ name || '（未命名）' }}</strong>
      </p>

      <!-- 受阻：先把依赖迁走，照着做完就能删 -->
      <el-alert
        v-if="risk === 'BLOCKED'"
        type="error"
        :closable="false"
        show-icon
        title="暂时不能删除"
      >
        <span>下面这些内容还指着它。请先按提示处理，处理完再回来删除。</span>
      </el-alert>

      <!-- 高危：连带删除，明示清单 -->
      <el-alert
        v-else-if="risk === 'HIGH'"
        type="warning"
        :closable="false"
        show-icon
        title="删除后不可恢复，且会连带清除下列记录"
      >
        <span>往年的统计数据已按日归档，不会因此变动。</span>
      </el-alert>

      <!-- 低危：干净数据，一句话就够 -->
      <el-alert
        v-else
        type="warning"
        :closable="false"
        show-icon
        title="删除后不可恢复"
      >
        <span>这条记录没有任何关联数据，可以安全删除。</span>
      </el-alert>

      <!-- 列表可能超出而滚动。不写清总数的话，被截断的那一行看着就像坏掉的排版，
           老师不会意识到下面还有内容 -->
      <div v-if="references.length" class="dd-refs-title">
        共 {{ references.length }} 类{{ references.length > 3 ? '（可滚动查看）' : '' }}
      </div>
      <ul v-if="references.length" ref="refsRef" class="dd-refs" :class="{ 'is-scrollable': refsScrollable }">
        <li v-for="ref in references" :key="ref.label" class="dd-ref">
          <div class="dd-ref-head">
            <span class="dd-ref-label">{{ ref.label }}</span>
            <span class="dd-ref-count" :class="{ 'is-blocking': ref.blocking }">
              {{ ref.count }} 条
            </span>
          </div>
          <p v-if="ref.hint" class="dd-ref-hint">{{ ref.hint }}</p>
        </li>
      </ul>

      <div v-if="canProceed && requiresPassword" class="dd-password">
        <label class="dd-password-label" for="dd-password-input">
          请输入当前管理员密码以确认
        </label>
        <el-input
          id="dd-password-input"
          ref="passwordRef"
          v-model="password"
          type="password"
          show-password
          autocomplete="current-password"
          placeholder="登录后台用的密码"
          @keyup.enter="onConfirm"
        />
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">{{ canProceed ? '取消' : '知道了' }}</el-button>
      <el-button
        v-if="canProceed"
        type="danger"
        :loading="submitting"
        :disabled="requiresPassword && !password"
        @click="onConfirm"
      >{{ confirmText }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { InputInstance } from 'element-plus'

export interface DangerReference {
  label: string
  count: number
  /** true = 结构性依赖，挡住删除；false = 行为数据，会随删除一并清理 */
  blocking?: boolean
  hint?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    /** 「活动」「师生账号」之类的量词，拼在名称前面 */
    subjectLabel?: string
    name?: string
    risk?: 'LOW' | 'HIGH' | 'BLOCKED'
    references?: DangerReference[]
    requiresPassword?: boolean
    canProceed?: boolean
    confirmText?: string
    loadingImpact?: boolean
    submitting?: boolean
  }>(),
  {
    title: '彻底删除',
    subjectLabel: '',
    name: '',
    risk: 'LOW',
    references: () => [],
    requiresPassword: false,
    canProceed: true,
    confirmText: '彻底删除',
    loadingImpact: false,
    submitting: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [password: string]
}>()

const password = ref('')
const passwordRef = ref<InputInstance>()
const refsRef = ref<HTMLElement>()
const refsScrollable = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

/**
 * 影响面是打开后才异步取回来的，所以焦点与「是否可滚动」都要在数据到位后再算一次，
 * 光靠 el-dialog 的 opened 事件会赶在 loading 结束之前。
 */
async function syncAfterRender() {
  await nextTick()
  refsScrollable.value = !!refsRef.value && refsRef.value.scrollHeight > refsRef.value.clientHeight + 1
  if (props.canProceed && props.requiresPassword) {
    passwordRef.value?.focus()
  }
}

function onOpened() {
  syncAfterRender()
}

watch(
  () => [props.loadingImpact, props.references, props.canProceed, props.requiresPassword],
  () => {
    if (props.modelValue && !props.loadingImpact) {
      syncAfterRender()
    }
  },
  { deep: true }
)

function onConfirm() {
  if (props.requiresPassword && !password.value) {
    return
  }
  emit('confirm', password.value)
}

/** 关闭后立刻丢掉密码，不在组件状态里留驻 */
function onClosed() {
  password.value = ''
  refsScrollable.value = false
}
</script>

<style scoped lang="scss">
.dd-body {
  min-height: 96px;
}

.dd-subject {
  margin: 0 0 14px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--brand-ink);
  /* 名称可能很长，必须在框内换行，不能把对话框撑宽 */
  word-break: break-all;

  strong {
    color: var(--brand-primary);
  }
}

.dd-refs-title {
  margin: 14px 0 6px;
  font-size: 12px;
  color: var(--brand-muted);
}

/* 影响清单可能有好几项，超出就在自己框内滚动，别把对话框顶长。
   30vh 是为矮屏（1366×768 的办公本）留的：固定 208px 在那种屏上会把页脚按钮顶出视口。 */
.dd-refs {
  margin: 0;
  padding: 4px;
  list-style: none;
  max-height: min(208px, 30vh);
  overflow-y: auto;
  border: 1px solid var(--brand-line);
  border-radius: 10px;
  background: #fafbfe;
  /* 底部渐隐，提示「下面还有」——被裁掉半行时不至于看着像排版坏了 */
  mask-image: linear-gradient(to bottom, #000 calc(100% - 18px), transparent 100%);
}
/* 内容不足以滚动时不该有渐隐，否则最后一行平白变淡 */
.dd-refs:not(.is-scrollable) {
  mask-image: none;
}

.dd-ref {
  padding: 8px 10px;
  border-radius: 8px;

  & + & {
    margin-top: 2px;
    border-top: 1px solid var(--brand-line);
  }
}

.dd-ref-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.dd-ref-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--brand-ink);
}

.dd-ref-count {
  flex: none;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: var(--brand-sub);

  &.is-blocking {
    color: var(--el-color-danger);
    font-weight: 600;
  }
}

.dd-ref-hint {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--brand-muted);
}

.dd-password {
  margin-top: 16px;
}

.dd-password-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--brand-sub);
}
</style>

<style lang="scss">
/* el-alert 的正文默认字号偏小且贴着标题，这里给一点呼吸感。
   不加 scoped：alert 的内部结构在组件作用域外。 */
.danger-delete-dialog .el-alert__description {
  margin: 4px 0 0;
  font-size: 12.5px;
  line-height: 1.6;
}
</style>
