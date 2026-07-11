<template>
  <div class="page-card">
    <div class="page-header">
      <h2>课程管理</h2>
      <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openDialog()">新建课程</el-button>
    </div>

    <p class="text-muted">
      维护在线课程信息与上下架；支持上传封面、教学视频与字幕文件。
    </p>

    <div class="toolbar">
      <el-select
        v-model="filterCategoryId"
        placeholder="分类"
        clearable
        style="width: 140px"
        @change="onFilter"
      >
        <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 110px" @change="onFilter">
        <el-option label="上架" :value="1" />
        <el-option label="下架" :value="0" />
      </el-select>
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="name" label="课程名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="categoryName" label="分类" width="110" />
      <el-table-column label="时长" width="80" align="center">
        <template #default="{ row }">
          {{ row.durationMinutes ? row.durationMinutes + ' 分' : '—' }}
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开课时间" width="150" />
      <el-table-column label="字幕" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="subtitleTagType(row.subtitleStatus)" size="small">
            {{ row.subtitleStatusLabel }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <el-button v-if="canWrite" link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button
            v-if="canPublish && row.status !== 1"
            link
            type="success"
            @click="onPublish(row)"
          >上架</el-button>
          <el-button
            v-if="canPublish && row.status === 1"
            link
            type="warning"
            @click="onUnpublish(row)"
          >下架</el-button>
          <span v-if="!canWrite" class="text-muted">—</span>
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

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑课程' : '新建课程'"
      width="720px"
      destroy-on-close
      top="4vh"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="form.name" maxlength="200" show-word-limit />
          <FieldHint :text="FIELD_HINTS.courseName" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面图">
          <CoverUploadField
            v-model="form.cover"
            v-model:fit-mode="form.coverFitMode"
            slot="courseList"
          />
        </el-form-item>
        <el-form-item label="适合人群">
          <el-input v-model="form.targetAudience" maxlength="200" placeholder="如：全校学生" />
        </el-form-item>
        <el-form-item label="时长(分钟)">
          <el-input-number v-model="form.durationMinutes" :min="1" :max="9999" />
        </el-form-item>
        <el-form-item label="开课时间">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="选择开课时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="课程介绍">
          <el-input v-model="form.intro" type="textarea" :rows="4" maxlength="2000" show-word-limit />
          <FieldHint :text="FIELD_HINTS.courseIntro" />
        </el-form-item>
        <el-form-item label="教学视频">
          <OssUploadInput
            v-model="form.videoUrl"
            scene="video"
            accept="video/mp4,video/quicktime"
            preview="video"
            upload-label="上传视频"
            done-text="视频已上传"
            hint="支持 MP4 格式，文件较大时请耐心等待"
          />
        </el-form-item>
        <el-form-item label="配套资源">
          <el-select
            v-model="form.resourceIds"
            multiple
            filterable
            placeholder="选择配套下载资源"
            style="width: 100%"
          >
            <el-option
              v-for="r in resourceOptions"
              :key="r.id"
              :label="`${r.name}（${r.fileType}）`"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="上下架">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 字幕管理（编辑时可见） -->
        <template v-if="editingId">
          <el-divider content-position="left">字幕管理</el-divider>
          <el-form-item label="当前状态">
            <el-tag :type="subtitleTagType(subtitleInfo.subtitleStatus)" size="small">
              {{ subtitleInfo.subtitleStatusLabel || '未生成' }}
            </el-tag>
            <span v-if="subtitleInfo.subtitleTaskId" class="inline-tip">
              任务 {{ subtitleInfo.subtitleTaskId }}
            </span>
          </el-form-item>
          <el-form-item label="字幕文件">
            <OssUploadInput
              v-model="subtitleUrlInput"
              scene="subtitle"
              accept=".vtt,.srt"
              preview="file"
              upload-label="上传字幕"
              done-text="字幕已上传"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              v-if="canWrite"
              :loading="subtitleTriggering"
              :disabled="!form.videoUrl"
              @click="onTriggerSubtitle"
            >触发字幕生成</el-button>
            <el-button v-if="canWrite" type="primary" :loading="subtitleSaving" @click="onSaveSubtitle">
              保存字幕地址
            </el-button>
            <div class="form-tip">开发环境需手动上传字幕文件后保存</div>
          </el-form-item>
        </template>
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
import { Plus, Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchCategories } from '@/api/category'
import {
  createCourse,
  fetchCourse,
  fetchCourses,
  fetchSubtitleStatus,
  publishCourse,
  triggerSubtitle,
  unpublishCourse,
  updateCourse,
  updateSubtitle,
  type SubtitleStatus
} from '@/api/course'
import { fetchResourceOptions } from '@/api/resource'
import { useAuthStore } from '@/stores/auth'
import type { CategoryOption, CourseItem, ResourceOption } from '@/types/api'
import type { CoverFitMode } from '@/utils/cover'
import CoverUploadField from '@/components/CoverUploadField.vue'
import FieldHint from '@/components/FieldHint.vue'
import OssUploadInput from '@/components/OssUploadInput.vue'
import { FIELD_HINTS } from '@/utils/field-hints'

const auth = useAuthStore()
const canWrite = computed(() => auth.can('course:write'))
const canPublish = computed(() => auth.can('course:publish'))

const loading = ref(false)
const saving = ref(false)
const list = ref<CourseItem[]>([])
const categories = ref<CategoryOption[]>([])
const resourceOptions = ref<ResourceOption[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filterCategoryId = ref<number | undefined>()
const filterStatus = ref<number | undefined>()
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const subtitleInfo = ref<SubtitleStatus>({
  courseId: 0,
  subtitleStatus: 'none',
  subtitleStatusLabel: '未生成',
  subtitleUrl: null,
  subtitleTaskId: null,
  videoUrl: null
})
const subtitleUrlInput = ref('')
const subtitleTriggering = ref(false)
const subtitleSaving = ref(false)

const form = reactive({
  name: '',
  cover: '',
  coverFitMode: 'fill' as CoverFitMode,
  categoryId: undefined as number | undefined,
  targetAudience: '',
  durationMinutes: undefined as number | undefined,
  startTime: '',
  intro: '',
  videoUrl: '',
  subtitleUrl: '',
  status: 0,
  resourceIds: [] as number[]
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

function subtitleTagType(status: string) {
  if (status === 'ready') return 'success'
  if (status === 'processing') return 'warning'
  if (status === 'failed') return 'danger'
  return 'info'
}

async function loadCategories() {
  categories.value = await fetchCategories('course')
}

async function loadResourceOptions() {
  resourceOptions.value = await fetchResourceOptions()
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchCourses({
      page: page.value,
      size: pageSize.value,
      categoryId: filterCategoryId.value,
      status: filterStatus.value
    })
    list.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function onFilter() {
  page.value = 1
  loadData()
}

function resetForm() {
  form.name = ''
  form.cover = ''
  form.coverFitMode = 'fill'
  form.categoryId = categories.value[0]?.id
  form.targetAudience = '全校学生'
  form.durationMinutes = undefined
  form.startTime = ''
  form.intro = ''
  form.videoUrl = ''
  form.subtitleUrl = ''
  form.status = 0
  form.resourceIds = []
  subtitleUrlInput.value = ''
  subtitleInfo.value = {
    courseId: 0,
    subtitleStatus: 'none',
    subtitleStatusLabel: '未生成',
    subtitleUrl: null,
    subtitleTaskId: null,
    videoUrl: null
  }
}

async function openDialog(row?: CourseItem) {
  resetForm()
  editingId.value = row?.id ?? null
  if (row) {
    const detail = await fetchCourse(row.id)
    form.name = detail.name
    form.cover = detail.cover || ''
    form.coverFitMode = detail.coverFitMode === 'fit' ? 'fit' : 'fill'
    form.categoryId = detail.categoryId ?? undefined
    form.targetAudience = detail.targetAudience || ''
    form.durationMinutes = detail.durationMinutes ?? undefined
    form.startTime = detail.startTime || ''
    form.intro = detail.intro || ''
    form.videoUrl = detail.videoUrl || ''
    form.subtitleUrl = detail.subtitleUrl || ''
    form.status = detail.status ?? 0
    form.resourceIds = detail.resourceIds || []
    subtitleUrlInput.value = detail.subtitleUrl || ''
    subtitleInfo.value = await fetchSubtitleStatus(row.id)
  }
  dialogVisible.value = true
}

async function onSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = {
      name: form.name,
      cover: form.cover || undefined,
      categoryId: form.categoryId,
      targetAudience: form.targetAudience || undefined,
      durationMinutes: form.durationMinutes,
      startTime: form.startTime || undefined,
      intro: form.intro || undefined,
      videoUrl: form.videoUrl || undefined,
      subtitleUrl: form.subtitleUrl || undefined,
      status: form.status,
      resourceIds: form.resourceIds
    }
    if (editingId.value) {
      await updateCourse(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await createCourse(payload)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function onTriggerSubtitle() {
  if (!editingId.value) return
  subtitleTriggering.value = true
  try {
    subtitleInfo.value = await triggerSubtitle(editingId.value)
    ElMessage.success('已提交字幕任务（开发环境请上传字幕后保存）')
  } finally {
    subtitleTriggering.value = false
  }
}

async function onSaveSubtitle() {
  if (!editingId.value) return
  if (!subtitleUrlInput.value.trim()) {
    ElMessage.warning('请先上传字幕文件')
    return
  }
  subtitleSaving.value = true
  try {
    subtitleInfo.value = await updateSubtitle(editingId.value, subtitleUrlInput.value.trim())
    form.subtitleUrl = subtitleUrlInput.value.trim()
    ElMessage.success('字幕已保存')
    await loadData()
  } finally {
    subtitleSaving.value = false
  }
}

async function onPublish(row: CourseItem) {
  await ElMessageBox.confirm(`上架「${row.name}」？上架后小程序端可见，并同步搜索索引。`, '上架确认')
  await publishCourse(row.id)
  ElMessage.success('已上架')
  await loadData()
}

async function onUnpublish(row: CourseItem) {
  await ElMessageBox.confirm(`下架「${row.name}」？小程序端将不再展示。`, '下架确认', { type: 'warning' })
  await unpublishCourse(row.id)
  ElMessage.success('已下架')
  await loadData()
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadResourceOptions()])
  await loadData()
})
</script>

<style scoped lang="scss">
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.inline-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}
</style>
