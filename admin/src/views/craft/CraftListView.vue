<template>
  <div class="page-card">
    <div class="page-header">
      <h2>文创管理</h2>
      <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openDialog()">新建文创</el-button>
    </div>

    <p class="text-muted">
      维护工艺品名称、介绍、展示图片或 3D 模型、咨询联系方式；上架后小程序「文化好物」中展示。
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
      <el-table-column prop="sort" label="排序" width="70" align="center" />
      <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
      <el-table-column prop="categoryName" label="分类" width="110" />
      <el-table-column label="展示方式" width="110" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.previewType === 'model3d' ? 'warning' : 'info'">
            {{ row.previewTypeLabel }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="introZh" label="中文简介" min-width="180" show-overflow-tooltip />
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right" align="center">
        <template #default="{ row }">
          <el-button v-if="canWrite" link type="primary" @click="openDialog(row)">编辑</el-button>
          <span v-else class="text-muted">—</span>
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
      :title="editingId ? '编辑文创' : '新建文创'"
      width="760px"
      destroy-on-close
      top="3vh"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="100" show-word-limit />
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
            slot="craftList"
          />
        </el-form-item>
        <el-form-item label="展示方式" prop="previewType">
          <el-radio-group v-model="form.previewType">
            <el-radio v-for="t in PREVIEW_TYPE_OPTIONS" :key="t.value" :value="t.value">
              {{ t.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.previewType === 'model3d'" label="3D 模型" prop="model3dUrl">
          <OssUploadInput
            v-model="form.model3dUrl"
            scene="model3d"
            accept=".glb,.gltf"
            upload-label="上传 3D 模型"
            done-text="模型已上传"
            hint="请上传校方提供的 3D 模型文件；也可改用「多角度图片」展示"
          />
        </el-form-item>
        <el-form-item label="中文介绍" prop="introZh">
          <el-input v-model="form.introZh" type="textarea" :rows="3" maxlength="2000" show-word-limit />
        </el-form-item>
        <el-form-item label="英文介绍">
          <el-input v-model="form.introEn" type="textarea" :rows="3" maxlength="2000" show-word-limit />
          <div class="form-tip">选填，用于双语展示</div>
        </el-form-item>

        <el-divider content-position="left">产品鉴赏图</el-divider>
        <div v-if="form.previewType === 'multi_image'" class="images-block">
          <el-button type="primary" link :icon="Plus" @click="addImage">添加一张图片</el-button>
          <el-table :data="form.images" size="small" border class="images-table">
            <el-table-column label="图片" min-width="200">
              <template #default="{ row }">
                <OssUploadInput
                  v-model="row.imageUrl"
                  scene="image"
                  accept="image/*"
                  upload-label="上传图片"
                  done-text="已上传"
                />
              </template>
            </el-table-column>
            <el-table-column label="角度标签" width="120">
              <template #default="{ row }">
                <el-input v-model="row.angleLabel" placeholder="正面" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="排序" width="90" align="center">
              <template #default="{ row }">
                <el-input-number v-model="row.sort" :min="0" :max="99" size="small" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column label="" width="60" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" @click="removeImage($index)">删</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <p v-else class="text-muted images-hint">3D 模式下可额外添加图片作为备用展示（选填）</p>

        <el-divider content-position="left">合作与咨询</el-divider>
        <el-form-item label="联系电话">
          <el-input v-model="form.contact.phone" maxlength="20" placeholder="一键拨打" />
        </el-form-item>
        <el-form-item label="微信号">
          <el-input v-model="form.contact.wechat" maxlength="100" placeholder="一键复制" />
        </el-form-item>
        <el-form-item label="企业微信">
          <el-input v-model="form.contact.workWechat" maxlength="100" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.contact.email" maxlength="100" placeholder="调起邮件客户端" />
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="上下架">
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
import { Plus, Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { fetchCategories } from '@/api/category'
import {
  createCraft,
  fetchCraft,
  fetchCrafts,
  PREVIEW_TYPE_OPTIONS,
  updateCraft
} from '@/api/craft'
import type { CraftImagePayload } from '@/api/craft'
import CoverUploadField from '@/components/CoverUploadField.vue'
import OssUploadInput from '@/components/OssUploadInput.vue'
import { useAuthStore } from '@/stores/auth'
import type { CategoryOption, CraftItem } from '@/types/api'
import type { CoverFitMode } from '@/utils/cover'

const auth = useAuthStore()
const canWrite = computed(() => auth.can('hall:write'))

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
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  cover: '',
  coverFitMode: 'fill' as CoverFitMode,
  categoryId: undefined as number | undefined,
  introZh: '',
  introEn: '',
  previewType: 'multi_image',
  model3dUrl: '',
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
  introZh: [{ required: true, message: '请填写中文介绍', trigger: 'blur' }],
  previewType: [{ required: true, message: '请选择展示方式', trigger: 'change' }],
  model3dUrl: [{
    validator: (_rule, value, callback) => {
      if (form.previewType === 'model3d' && !value?.trim()) {
        callback(new Error('请上传 3D 模型文件'))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  }]
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
  form.previewType = 'multi_image'
  form.model3dUrl = ''
  form.sort = 0
  form.status = 0
  form.images = []
  form.contact = { phone: '', wechat: '', workWechat: '', email: '' }
}

function addImage() {
  form.images.push({ imageUrl: '', angleLabel: '', sort: form.images.length })
}

function removeImage(index: number) {
  form.images.splice(index, 1)
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
    form.previewType = detail.previewType || 'multi_image'
    form.model3dUrl = detail.model3dUrl || ''
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
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = {
      name: form.name,
      cover: form.cover || undefined,
      categoryId: form.categoryId,
      introZh: form.introZh,
      introEn: form.introEn || undefined,
      previewType: form.previewType,
      model3dUrl: form.previewType === 'model3d' ? form.model3dUrl : undefined,
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

onMounted(async () => {
  await loadCategories()
  await loadData()
})
</script>

<style scoped lang="scss">
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.images-block {
  margin-bottom: 16px;
}

.images-table {
  margin-top: 8px;
}

.images-hint {
  margin: 0 0 16px 108px;
  font-size: 13px;
}
</style>
