<template>
  <el-dialog
    :model-value="visible"
    :title="editingId ? '编辑文创' : '新建文创'"
    width="760px"
    destroy-on-close
    top="3vh"
    @update:model-value="emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="108px">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" maxlength="100" show-word-limit />
        <FieldHint :text="FIELD_HINTS.craftName" />
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
        <FieldHint :text="FIELD_HINTS.craftIntro" />
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
          <el-table-column label="排序" width="104" align="center">
            <template #default="{ row }">
              <el-input-number
                v-model="row.sort"
                :min="0"
                :max="99"
                size="small"
                controls-position="right"
                style="width: 100%"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="64" align="center">
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
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/** 文创新建/编辑弹窗：展示方式、鉴赏图与咨询方式 */
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { CraftImagePayload } from '@/api/craft'
import { PREVIEW_TYPE_OPTIONS } from '@/api/craft'
import CoverUploadField from '@/components/CoverUploadField.vue'
import FieldHint from '@/components/FieldHint.vue'
import OssUploadInput from '@/components/OssUploadInput.vue'
import type { CategoryOption } from '@/types/api'
import type { CoverFitMode } from '@/utils/cover'
import { FIELD_HINTS } from '@/utils/field-hints'

export interface CraftFormState {
  name: string
  cover: string
  coverFitMode: CoverFitMode
  categoryId: number | undefined
  introZh: string
  introEn: string
  previewType: string
  model3dUrl: string
  sort: number
  status: number
  images: CraftImagePayload[]
  contact: {
    phone: string
    wechat: string
    workWechat: string
    email: string
  }
}

const props = defineProps<{
  visible: boolean
  editingId: number | null
  form: CraftFormState
  categories: CategoryOption[]
  saving: boolean
  rules: FormRules
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: []
}>()

const formRef = ref<FormInstance>()

function addImage() {
  props.form.images.push({ imageUrl: '', angleLabel: '', sort: props.form.images.length })
}

function removeImage(index: number) {
  props.form.images.splice(index, 1)
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (valid) emit('save')
}
</script>

<style scoped lang="scss">
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
