import { computed, onMounted, reactive, ref } from 'vue'
import type { FormRules } from 'element-plus'
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

/** 课程列表页：筛选、分页、上下架、字幕与编辑弹窗状态 */
export function useCourseList() {
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

  return {
    canWrite,
    canPublish,
    loading,
    saving,
    list,
    categories,
    resourceOptions,
    page,
    pageSize,
    total,
    filterCategoryId,
    filterStatus,
    dialogVisible,
    editingId,
    subtitleInfo,
    subtitleUrlInput,
    subtitleTriggering,
    subtitleSaving,
    form,
    rules,
    subtitleTagType,
    loadData,
    onFilter,
    openDialog,
    onSave,
    onTriggerSubtitle,
    onSaveSubtitle,
    onPublish,
    onUnpublish
  }
}
