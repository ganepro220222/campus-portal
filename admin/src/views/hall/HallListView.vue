<template>
  <div class="page-card">
    <div class="page-header">
      <h2>展馆管理</h2>
      <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openDialog()">新建展馆</el-button>
    </div>

    <p class="text-muted">
      维护 11 个 VR 展馆的名称、短名称、全景链接、轮播图文与语音讲解；下架后小程序不可见。
    </p>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="sort" label="排序" width="70" align="center" />
      <el-table-column prop="name" label="展馆名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="shortName" label="短名称" width="120" show-overflow-tooltip />
      <el-table-column label="VR" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.vrReady ? 'success' : 'info'">
            {{ row.vrReady ? '已配置' : '待配置' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="categoryName" label="分类" width="120" />
      <el-table-column prop="intro" label="简介" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right" align="center">
        <template #default="{ row }">
          <el-button v-if="canWrite" link type="primary" @click="openDialog(row)">编辑</el-button>
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
      :title="editingId ? '编辑展馆' : '新建展馆'"
      width="760px"
      destroy-on-close
      top="3vh"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="100" show-word-limit placeholder="完整展馆名称" />
          <FieldHint :text="FIELD_HINTS.hallName" />
        </el-form-item>
        <el-form-item label="短名称">
          <el-input v-model="form.shortName" maxlength="50" show-word-limit placeholder="列表卡片显示，如「交通博物馆」" />
          <FieldHint :text="FIELD_HINTS.hallShortName" />
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
            slot="hallList"
          />
        </el-form-item>
        <el-form-item label="VR 全景链接">
          <el-input v-model="form.vrUrl" placeholder="粘贴全景服务商提供的展馆链接（可向技术人员索取）" />
        </el-form-item>
        <el-form-item label="简介" prop="intro">
          <el-input v-model="form.intro" type="textarea" :rows="3" maxlength="500" show-word-limit />
          <FieldHint :text="FIELD_HINTS.hallIntro" />
        </el-form-item>

        <el-divider content-position="left">沉浸式章节</el-divider>
        <p class="text-muted section-tip">按章节组织长卷图文，小程序端连续滚动展示（验收 §2.4）</p>
        <FieldHint :text="FIELD_HINTS.hallSectionTitle" />
        <div class="sections-block">
          <el-button type="primary" link :icon="Plus" @click="addSection">添加章节</el-button>
          <div v-for="(section, sIdx) in form.sections" :key="sIdx" class="section-card">
            <div class="section-head">
              <el-input v-model="section.title" placeholder="章节标题，如「办学历程」" maxlength="100" />
              <el-button link type="danger" @click="removeSection(sIdx)">删除章节</el-button>
            </div>
            <el-table :data="section.items" size="small" border class="slides-table">
              <el-table-column label="图片" min-width="200">
                <template #default="{ row }">
                  <OssUploadInput
                    v-model="row.url"
                    scene="image"
                    accept="image/*"
                    upload-label="上传图片"
                    done-text="已上传"
                  />
                </template>
              </el-table-column>
              <el-table-column label="图说" min-width="180">
                <template #default="{ row }">
                  <el-input v-model="row.caption" placeholder="图片说明" size="small" maxlength="200" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="70" align="center">
                <template #default="{ $index }">
                  <el-button link type="danger" @click="removeSectionItem(sIdx, $index)">删</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" link :icon="Plus" @click="addSectionItem(sIdx)">添加章节图片</el-button>
          </div>
        </div>

        <el-divider content-position="left">轮播图文</el-divider>
        <FieldHint :text="FIELD_HINTS.hallCaption" />
        <div class="slides-block">
          <el-button type="primary" link :icon="Plus" @click="addSlide">添加图片</el-button>
          <el-table :data="form.slides" size="small" border class="slides-table">
            <el-table-column label="图片" min-width="200">
              <template #default="{ row }">
                <OssUploadInput
                  v-model="row.url"
                  scene="image"
                  accept="image/*"
                  upload-label="上传图片"
                  done-text="已上传"
                />
              </template>
            </el-table-column>
            <el-table-column label="图说" min-width="180">
              <template #default="{ row }">
                <el-input v-model="row.caption" placeholder="图片说明" size="small" maxlength="200" />
              </template>
            </el-table-column>
            <el-table-column label="排序" width="90" align="center">
              <template #default="{ row }">
                <el-input-number v-model="row.sort" :min="0" :max="999" size="small" controls-position="right" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" @click="removeSlide($index)">删</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-divider content-position="left">语音讲解</el-divider>
        <el-form-item label="语音讲解">
          <OssUploadInput
            v-model="form.audioUrl"
            scene="audio"
            accept="audio/*"
            upload-label="上传语音"
            done-text="语音已上传"
            hint="支持 MP3 等常见音频格式"
          />
        </el-form-item>
        <el-form-item label="时长说明">
          <el-input v-model="form.audioTime" placeholder="如：语音讲解 03:48" maxlength="50" />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
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
import { ElMessage } from 'element-plus'
import { fetchCategories } from '@/api/category'
import { createHall, fetchHallDetail, fetchHalls, updateHall } from '@/api/hall'
import CoverUploadField from '@/components/CoverUploadField.vue'
import FieldHint from '@/components/FieldHint.vue'
import OssUploadInput from '@/components/OssUploadInput.vue'
import { useAuthStore } from '@/stores/auth'
import type { CategoryOption, HallItem, HallSectionItem, HallSlideItem } from '@/types/api'
import type { CoverFitMode } from '@/utils/cover'
import { FIELD_HINTS } from '@/utils/field-hints'

const auth = useAuthStore()
const canWrite = computed(() => auth.can('hall:write'))

const loading = ref(false)
const saving = ref(false)
const list = ref<HallItem[]>([])
const categories = ref<CategoryOption[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

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

function addSlide() {
  form.slides.push({ url: '', caption: '', sort: form.slides.length })
}

function removeSlide(index: number) {
  form.slides.splice(index, 1)
}

function addSection() {
  form.sections.push({ title: '', sort: form.sections.length, items: [] })
}

function removeSection(index: number) {
  form.sections.splice(index, 1)
}

function addSectionItem(sectionIndex: number) {
  const section = form.sections[sectionIndex]
  if (!section.items) section.items = []
  section.items.push({ url: '', caption: '', sort: section.items.length })
}

function removeSectionItem(sectionIndex: number, itemIndex: number) {
  form.sections[sectionIndex].items?.splice(itemIndex, 1)
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
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
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

.slides-block {
  margin-bottom: 8px;
}

.slides-table {
  margin-top: 8px;
}

.section-tip {
  margin: 0 0 8px;
  font-size: 13px;
}

.sections-block {
  margin-bottom: 12px;
}

.section-card {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.section-head {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}
</style>
