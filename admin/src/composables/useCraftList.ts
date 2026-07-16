import { computed, onMounted, reactive, ref } from 'vue'
import type { FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { fetchCategories } from '@/api/category'
import {
  createCraft,
  fetchCraft,
  fetchCrafts,
  publishCraft,
  removeCraft,
  unpublishCraft,
  updateCraft
} from '@/api/craft'
import type { CraftImagePayload } from '@/api/craft'
import { useAuthStore } from '@/stores/auth'
import type { CategoryOption, CraftItem } from '@/types/api'
import type { CoverFitMode } from '@/utils/cover'

/** 文创列表页：筛选、分页、上下架与编辑弹窗状态 */
export function useCraftList() {
  const auth = useAuthStore()
  const canWrite = computed(() => auth.can('hall:write'))
  const canPublish = computed(() => auth.can('hall:publish'))

  const loading = ref(false)
  const saving = ref(false)
  const list = ref<CraftItem[]>([])
  const categories = ref<CategoryOption[]>([])
  const page = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const filterCategoryId = ref<number | undefined>()
  const filterStatus = ref<number | undefined>()
  const dialogVisible = ref(false)
  const editingId = ref<number | null>(null)

  const form = reactive({
    name: '',
    cover: '',
    coverFitMode: 'fill' as CoverFitMode,
    categoryId: undefined as number | undefined,
    introZh: '',
    introEn: '',
    sort: 0,
    status: 0,
    images: [] as CraftImagePayload[],
    contact: {
      phone: '',
      wechat: '',
      workWechat: '',
      email: ''
    }
  })

  const rules: FormRules = {
    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
    categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
    introZh: [{ required: true, message: '请填写中文介绍', trigger: 'blur' }]
  }

  async function loadCategories() {
    categories.value = await fetchCategories('craft')
  }

  async function loadData() {
    loading.value = true
    try {
      const res = await fetchCrafts({
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
    form.introZh = ''
    form.introEn = ''
    form.sort = 0
    form.status = 0
    form.images = []
    form.contact = { phone: '', wechat: '', workWechat: '', email: '' }
  }

  async function openDialog(row?: CraftItem) {
    resetForm()
    editingId.value = row?.id ?? null
    if (row) {
      const detail = await fetchCraft(row.id)
      form.name = detail.name
      form.cover = detail.cover || ''
      form.coverFitMode = detail.coverFitMode === 'fit' ? 'fit' : 'fill'
      form.categoryId = detail.categoryId ?? undefined
      form.introZh = detail.introZh || ''
      form.introEn = detail.introEn || ''
      form.sort = detail.sort ?? 0
      form.status = detail.status ?? 0
      form.images = (detail.images || []).map((img) => ({
        imageUrl: img.imageUrl,
        angleLabel: img.angleLabel || '',
        sort: img.sort ?? 0
      }))
      if (detail.contact) {
        form.contact = {
          phone: detail.contact.phone || '',
          wechat: detail.contact.wechat || '',
          workWechat: detail.contact.workWechat || '',
          email: detail.contact.email || ''
        }
      }
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
        introZh: form.introZh,
        introEn: form.introEn || undefined,
        sort: form.sort,
        status: form.status,
        images: form.images.filter((img) => img.imageUrl?.trim()),
        contact: {
          phone: form.contact.phone || undefined,
          wechat: form.contact.wechat || undefined,
          workWechat: form.contact.workWechat || undefined,
          email: form.contact.email || undefined
        }
      }
      if (editingId.value) {
        await updateCraft(editingId.value, payload)
        ElMessage.success('已更新')
      } else {
        await createCraft(payload)
        ElMessage.success('已创建')
      }
      dialogVisible.value = false
      await loadData()
    } finally {
      saving.value = false
    }
  }

  async function onPublish(row: CraftItem) {
    await ElMessageBox.confirm(`上架「${row.name}」？上架后小程序端可见，并同步搜索索引。`, '上架确认')
    await publishCraft(row.id)
    ElMessage.success('已上架')
    await loadData()
  }

  async function onUnpublish(row: CraftItem) {
    await ElMessageBox.confirm(`下架「${row.name}」？小程序端将不再展示。`, '下架确认', { type: 'warning' })
    await unpublishCraft(row.id)
    ElMessage.success('已下架')
    await loadData()
  }

  async function onDelete(row: CraftItem) {
    await ElMessageBox.confirm(
      `删除「${row.name}」？将移入回收站，可在「回收站」中恢复或彻底删除。`,
      '删除确认',
      { type: 'warning' }
    )
    await removeCraft(row.id)
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
    filterCategoryId,
    filterStatus,
    dialogVisible,
    editingId,
    form,
    rules,
    loadData,
    onFilter,
    openDialog,
    onSave,
    onPublish,
    onUnpublish,
    onDelete
  }
}
