import { computed, onMounted, reactive, ref } from 'vue'
import type { FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchCategories } from '@/api/category'
import { createHall, fetchHallDetail, fetchHalls, publishHall, removeHall, unpublishHall, updateHall } from '@/api/hall'
import { useAuthStore } from '@/stores/auth'
import type { CategoryOption, HallItem, HallSectionItem, HallSlideItem } from '@/types/api'
import type { CoverFitMode } from '@/utils/cover'

/** 展馆列表页：分页、上下架与编辑弹窗状态 */
export function useHallList() {
  const auth = useAuthStore()
  const canWrite = computed(() => auth.can('hall:write'))
  const canPublish = computed(() => auth.can('hall:publish'))

  const loading = ref(false)
  const saving = ref(false)
  const list = ref<HallItem[]>([])
  const categories = ref<CategoryOption[]>([])
  const page = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const dialogVisible = ref(false)
  const editingId = ref<number | null>(null)

  const form = reactive({
    name: '',
    shortName: '',
    cover: '',
    coverFitMode: 'fill' as CoverFitMode,
    intro: '',
    vrUrl: '',
    categoryId: undefined as number | undefined,
    sort: 0,
    status: 1,
    slides: [] as HallSlideItem[],
    sections: [] as HallSectionItem[],
    audioUrl: '',
    audioTime: ''
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入展馆名称', trigger: 'blur' }]
  }

  async function loadCategories() {
    categories.value = await fetchCategories('hall')
  }

  async function loadData() {
    loading.value = true
    try {
      const res = await fetchHalls(page.value, pageSize.value)
      list.value = res.records
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  function resetForm() {
    form.name = ''
    form.shortName = ''
    form.cover = ''
    form.coverFitMode = 'fill'
    form.intro = ''
    form.vrUrl = ''
    form.categoryId = categories.value[0]?.id
    form.sort = 0
    form.status = 1
    form.slides = []
    form.sections = []
    form.audioUrl = ''
    form.audioTime = ''
  }

  async function openDialog(row?: HallItem) {
    resetForm()
    editingId.value = row?.id ?? null
    if (row?.id) {
      const detail = await fetchHallDetail(row.id)
      form.name = detail.name
      form.shortName = detail.shortName || ''
      form.cover = detail.cover || ''
      form.coverFitMode = detail.coverFitMode === 'fit' ? 'fit' : 'fill'
      form.intro = detail.intro || ''
      form.vrUrl = detail.vrUrl || ''
      form.categoryId = detail.categoryId ?? undefined
      form.sort = detail.sort ?? 0
      form.status = detail.status ?? 1
      form.slides = (detail.slides || []).map((s) => ({
        url: s.url || '',
        caption: s.caption || '',
        sort: s.sort ?? 0
      }))
      form.sections = (detail.sections || []).map((sec, idx) => ({
        title: sec.title || '',
        sort: sec.sort ?? idx,
        items: (sec.items || []).map((it, i) => ({
          url: it.url || '',
          caption: it.caption || '',
          sort: it.sort ?? i
        }))
      }))
      form.audioUrl = detail.audioUrl || ''
      form.audioTime = detail.audioTime || ''
    }
    dialogVisible.value = true
  }

  async function onSave() {
    saving.value = true
    try {
      const payload = {
        ...form,
        slides: form.slides.filter((s) => s.url?.trim()),
        sections: form.sections
          .filter((sec) => sec.title?.trim())
          .map((sec, idx) => ({
            title: sec.title.trim(),
            sort: sec.sort ?? idx,
            items: (sec.items || []).filter((it) => it.url?.trim())
          }))
      }
      if (editingId.value) {
        await updateHall(editingId.value, payload)
        ElMessage.success('已更新')
      } else {
        await createHall(payload)
        ElMessage.success('已创建')
      }
      dialogVisible.value = false
      await loadData()
    } finally {
      saving.value = false
    }
  }

  async function onPublish(row: HallItem) {
    await ElMessageBox.confirm(`上架「${row.name}」？上架后小程序端可见，并同步搜索索引。`, '上架确认')
    await publishHall(row.id)
    ElMessage.success('已上架')
    await loadData()
  }

  async function onUnpublish(row: HallItem) {
    await ElMessageBox.confirm(`下架「${row.name}」？小程序端将不再展示。`, '下架确认', { type: 'warning' })
    await unpublishHall(row.id)
    ElMessage.success('已下架')
    await loadData()
  }

  async function onDelete(row: HallItem) {
    await ElMessageBox.confirm(
      `删除「${row.name}」？将移入回收站，可在「回收站」中恢复或彻底删除。`,
      '删除确认',
      { type: 'warning' }
    )
    await removeHall(row.id)
    ElMessage.success('已移入回收站')
    await loadData()
  }

  onMounted(async () => {
    await loadCategories()
    await loadData()
  })

  return {
    canWrite,
    canPublish,
    loading,
    saving,
    list,
    categories,
    page,
    pageSize,
    total,
    dialogVisible,
    editingId,
    form,
    rules,
    loadData,
    openDialog,
    onSave,
    onPublish,
    onUnpublish,
    onDelete
  }
}
