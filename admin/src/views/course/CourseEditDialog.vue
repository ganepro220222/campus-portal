<template>
  <el-dialog
    :model-value="visible"
    :title="editingId ? '编辑课程' : '新建课程'"
    width="720px"
    destroy-on-close
    top="4vh"
    @update:model-value="emit('update:visible', $event)"
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
            :model-value="subtitleUrlInput"
            scene="subtitle"
            accept=".vtt,.srt"
            preview="file"
            upload-label="上传字幕"
            done-text="字幕已上传"
            @update:model-value="emit('update:subtitleUrlInput', $event)"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            v-if="canWrite"
            :loading="subtitleTriggering"
            :disabled="!form.videoUrl"
            @click="emit('trigger-subtitle')"
          >触发 ASR 生成</el-button>
          <el-button
            v-if="canWrite"
            type="primary"
            :loading="subtitleSaving"
            @click="emit('save-subtitle')"
          >
            保存字幕地址
          </el-button>
          <div class="form-tip">ASR 未配置时可手动上传 VTT/SRT 后保存；配置 ASR_* 环境变量后触发将自动轮询生成</div>
        </el-form-item>
      </template>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/** 课程新建/编辑弹窗：视频、配套资源与字幕管理 */
import { ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { SubtitleStatus } from '@/api/course'
import CoverUploadField from '@/components/CoverUploadField.vue'
import FieldHint from '@/components/FieldHint.vue'
import OssUploadInput from '@/components/OssUploadInput.vue'
import type { CategoryOption, ResourceOption } from '@/types/api'
import type { CoverFitMode } from '@/utils/cover'
import { FIELD_HINTS } from '@/utils/field-hints'

export interface CourseFormState {
  name: string
  cover: string
  coverFitMode: CoverFitMode
  categoryId: number | undefined
  targetAudience: string
  durationMinutes: number | undefined
  startTime: string
  intro: string
  videoUrl: string
  subtitleUrl: string
  status: number
  resourceIds: number[]
}

defineProps<{
  visible: boolean
  editingId: number | null
  form: CourseFormState
  categories: CategoryOption[]
  resourceOptions: ResourceOption[]
  saving: boolean
  rules: FormRules
  canWrite: boolean
  subtitleInfo: SubtitleStatus
  subtitleUrlInput: string
  subtitleTriggering: boolean
  subtitleSaving: boolean
  subtitleTagType: (status: string) => 'success' | 'warning' | 'danger' | 'info'
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'update:subtitleUrlInput': [value: string]
  save: []
  'trigger-subtitle': []
  'save-subtitle': []
}>()

const formRef = ref<FormInstance>()

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (valid) emit('save')
}
</script>

<style scoped lang="scss">
.inline-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #909399;
}
</style>
