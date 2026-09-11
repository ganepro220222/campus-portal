<template>
  <div class="page-card">
    <div class="page-header">
      <h2>首页推荐</h2>
    </div>
    <p class="text-muted">
      配置小程序首页「线上展馆」「最新动态」「热门课程」展示哪些内容。
      发布或上架不会自动出现在首页，须在此添加。排序数字越小越靠前。
      内容下架后推荐位仍保留，首页自动隐藏该条。
    </p>

    <section
      v-for="sec in HOME_RECOMMEND_SECTIONS"
      :key="sec.moduleType"
      class="recommend-block"
    >
      <div class="block-head">
        <div>
          <h3>{{ sec.title }}</h3>
          <p class="text-muted">建议不超过 {{ sec.softLimit }} 条，超出也可保存。</p>
        </div>
        <el-button type="primary" :icon="Plus" @click="openCreate(sec)">{{ sec.addLabel }}</el-button>
      </div>

      <el-table v-loading="loading" :data="rowsOf(sec.moduleType)" stripe border>
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column label="内容" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.targetMissing ? '（内容已删除）' : (row.title || '（未命名）') }}
          </template>
        </el-table-column>
        <el-table-column label="内容状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.targetMissing" type="danger" size="small">已删除</el-tag>
            <el-tag v-else-if="row.targetPublished" type="success" size="small">
              {{ row.moduleType === 'news' ? '已发布' : '已上架' }}
            </el-tag>
            <el-tag v-else type="warning" size="small">已下架</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="推荐位" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '上架' : '下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="首页" width="150" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1 && row.targetPublished" type="success" size="small">展示中</el-tag>
            <el-tag v-else type="info" size="small">不展示</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="onRemove(row)">移除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <span class="empty-text">{{ sec.empty }}</span>
        </template>
      </el-table>
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑推荐' : '添加推荐'"
      width="520px"
      destroy-on-close
      @closed="onDialogClosed"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item v-if="!editingId" :label="contentFieldLabel" prop="targetId">
          <el-select
            v-model="form.targetId"
            filterable
            clearable
            :loading="contentLoading"
            :disabled="!contentOptions.length"
            style="width: 100%"
            :placeholder="contentPlaceholder"
          >
            <el-option
              v-for="opt in contentOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <div class="form-tip">{{ contentTip }}</div>
        </el-form-item>
        <el-form-item v-else label="内容">
          <el-input :model-value="editingTitle" disabled />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
          <div class="form-tip">数字越小越靠前</div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createHomeRecommend,
  fetchHomeRecommends,
  removeHomeRecommend,
  updateHomeRecommend
} from '@/api/homeRecommend'
import type { HomeRecommendItem, HomeRecommendModule } from '@/types/api'
import {
  HOME_RECOMMEND_SECTIONS,
  nextRecommendSort,
  type HomeRecommendSection
} from '@/utils/homeRecommend'
import {
  loadBannerContentOptions,
  type BannerLinkOption
} from '@/utils/banner-link'

const loading = ref(false)
const saving = ref(false)
const contentLoading = ref(false)
const halls = ref<HomeRecommendItem[]>([])
const news = ref<HomeRecommendItem[]>([])
const courses = ref<HomeRecommendItem[]>([])
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const editingTitle = ref('')
const formRef = ref<FormInstance>()
const contentOptions = ref<BannerLinkOption[]>([])
const activeModule = ref<HomeRecommendModule>('news')

const form = reactive({
  targetId: '' as string,
  sort: 0,
  status: 1
})

const rules: FormRules = {
  targetId: [{ required: true, message: '请选择内容', trigger: 'change' }]
}

const contentFieldLabel = computed(() => {
  if (activeModule.value === 'hall') return '展馆'
  if (activeModule.value === 'course') return '课程'
  return '动态'
})

const contentPlaceholder = computed(() => {
  if (!contentOptions.value.length && !contentLoading.value) {
    return '暂无可添加的已发布内容'
  }
  return '搜索并选择已发布内容'
})

const contentTip = computed(() => {
  if (!contentOptions.value.length && !contentLoading.value) {
    return '没有可添加的已发布或已上架内容，或都已加入本板块'
  }
  return '仅展示尚未加入本板块的已发布 / 已上架内容'
})

function rowsOf(moduleType: HomeRecommendModule): HomeRecommendItem[] {
  if (moduleType === 'hall') return halls.value
  if (moduleType === 'course') return courses.value
  return news.value
}

function usedTargetIds(moduleType: HomeRecommendModule): Set<string> {
  return new Set(rowsOf(moduleType).map((row) => String(row.targetId)))
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchHomeRecommends()
    halls.value = res.halls || []
    news.value = res.news || []
    courses.value = res.courses || []
  } finally {
    loading.value = false
  }
}

async function openCreate(sec: HomeRecommendSection) {
  editingId.value = null
  editingTitle.value = ''
  activeModule.value = sec.moduleType
  form.targetId = ''
  form.sort = nextRecommendSort(rowsOf(sec.moduleType).map((row) => row.sort ?? 0))
  form.status = 1
  dialogVisible.value = true
  contentLoading.value = true
  try {
    const used = usedTargetIds(sec.moduleType)
    const options = await loadBannerContentOptions(sec.moduleType)
    contentOptions.value = options.filter((opt) => !used.has(opt.value))
  } finally {
    contentLoading.value = false
  }
}

function openEdit(row: HomeRecommendItem) {
  editingId.value = row.id
  editingTitle.value = row.targetMissing ? '（内容已删除）' : (row.title || '（未命名）')
  activeModule.value = row.moduleType
  form.targetId = String(row.targetId)
  form.sort = row.sort ?? 0
  form.status = row.status ?? 1
  contentOptions.value = []
  dialogVisible.value = true
}

function onDialogClosed() {
  contentOptions.value = []
  form.targetId = ''
}

async function onSave() {
  if (!editingId.value) {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return
  }
  if (!editingId.value && !form.targetId) {
    ElMessage.warning('请选择内容')
    return
  }
  const sec = HOME_RECOMMEND_SECTIONS.find((item) => item.moduleType === activeModule.value)
  if (!editingId.value && sec && rowsOf(sec.moduleType).length >= sec.softLimit) {
    await ElMessageBox.confirm(
      `该板块已有 ${rowsOf(sec.moduleType).length} 条，超过建议的 ${sec.softLimit} 条。首页仍会全部展示。确定继续添加？`,
      '条数提示',
      { type: 'warning' }
    )
  }
  saving.value = true
  try {
    if (editingId.value) {
      await updateHomeRecommend(editingId.value, { sort: form.sort, status: form.status })
      ElMessage.success('已更新')
    } else {
      await createHomeRecommend({
        moduleType: activeModule.value,
        targetId: Number(form.targetId),
        sort: form.sort,
        status: form.status
      })
      ElMessage.success('已添加')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function onRemove(row: HomeRecommendItem) {
  const name = row.targetMissing ? '该条' : `「${row.title || '未命名'}」`
  await ElMessageBox.confirm(
    `从首页移除${name}？内容本身不受影响，小程序首页不再展示该条。`,
    '移除确认',
    { type: 'warning' }
  )
  await removeHomeRecommend(row.id)
  ElMessage.success('已从首页移除')
  await loadData()
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.recommend-block {
  margin-top: 28px;

  &:first-of-type {
    margin-top: 22px;
  }
}

.block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;

  h3 {
    margin: 0 0 4px;
    font-size: 16px;
    font-weight: 700;
    color: var(--brand-primary);
  }

  .text-muted {
    margin: 0;
  }
}

.empty-text {
  color: var(--brand-muted);
  font-size: 13px;
}
</style>
