<template>
  <el-dialog
    :model-value="visible"
    :title="editingId ? '编辑展馆' : '新建展馆'"
    width="760px"
    destroy-on-close
    top="3vh"
    @update:model-value="emit('update:visible', $event)"
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
          <el-table-column label="排序" width="104" align="center">
            <template #default="{ row }">
              <el-input-number
                v-model="row.sort"
                :min="0"
                :max="999"
                size="small"
                controls-position="right"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="64" align="center">
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
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/** 展馆新建/编辑弹窗：章节、轮播图与语音讲解表单 */
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import CoverUploadField from '@/components/CoverUploadField.vue'
import FieldHint from '@/components/FieldHint.vue'
import OssUploadInput from '@/components/OssUploadInput.vue'
import type { CategoryOption, HallSectionItem, HallSlideItem } from '@/types/api'
import type { CoverFitMode } from '@/utils/cover'
import { FIELD_HINTS } from '@/utils/field-hints'

export interface HallFormState {
  name: string
  shortName: string
  cover: string
  coverFitMode: CoverFitMode
  intro: string
  vrUrl: string
  categoryId: number | undefined
  sort: number
  status: number
  slides: HallSlideItem[]
  sections: HallSectionItem[]
  audioUrl: string
  audioTime: string
}

const props = defineProps<{
  visible: boolean
  editingId: number | null
  form: HallFormState
  categories: CategoryOption[]
  saving: boolean
  rules: FormRules
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: []
}>()

const formRef = ref<FormInstance>()

function addSlide() {
  props.form.slides.push({ url: '', caption: '', sort: props.form.slides.length })
}

function removeSlide(index: number) {
  props.form.slides.splice(index, 1)
}

function addSection() {
  props.form.sections.push({ title: '', sort: props.form.sections.length, items: [] })
}

function removeSection(index: number) {
  props.form.sections.splice(index, 1)
}

function addSectionItem(sectionIndex: number) {
  const section = props.form.sections[sectionIndex]
  if (!section.items) section.items = []
  section.items.push({ url: '', caption: '', sort: section.items.length })
}

function removeSectionItem(sectionIndex: number, itemIndex: number) {
  props.form.sections[sectionIndex].items?.splice(itemIndex, 1)
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (valid) emit('save')
}
</script>

<style scoped lang="scss">
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
