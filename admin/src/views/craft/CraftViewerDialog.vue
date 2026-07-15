<template>
  <el-dialog
    :model-value="visible"
    :title="`沉浸式鉴赏配置 · ${craft?.name || ''}`"
    width="680px"
    destroy-on-close
    @update:model-value="(v: boolean) => emit('update:visible', v)"
    @open="onOpen"
  >
    <div v-loading="loading">
      <!-- 开关 -->
      <div class="cv-row cv-switch">
        <div>
          <div class="cv-label">开启沉浸式鉴赏</div>
          <div class="cv-desc">开启后小程序文创详情将展示可拖动旋转的 3D 鉴赏；需先上传有效 GLB 模型。</div>
        </div>
        <el-switch v-model="form.viewerEnabled" />
      </div>

      <!-- GLB 模型 -->
      <div class="cv-section">
        <div class="cv-section-title">3D 模型（GLB）</div>
        <div class="cv-model">
          <el-tag v-if="form.model3dUrl" type="success" size="small" effect="plain">已配置模型</el-tag>
          <el-tag v-else type="info" size="small" effect="plain">未配置模型</el-tag>
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            accept=".glb,.gltf"
            :on-change="onPickGlb"
          >
            <el-button :loading="uploading" :icon="UploadFilled" size="small">
              {{ form.model3dUrl ? '重新上传' : '上传 GLB 模型' }}
            </el-button>
          </el-upload>
          <span class="cv-desc">仅 .glb / .gltf，建议 ≤ 8MB；上传即自动校验并按内容哈希入库</span>
        </div>
        <el-alert
          v-if="uploadSummary"
          class="cv-summary"
          :type="uploadSummary.warnings.length ? 'warning' : 'success'"
          :closable="false"
          show-icon
        >
          <template #title>
            校验通过：网格 {{ uploadSummary.meshCount }} · 材质 {{ uploadSummary.materialCount }} · 贴图 {{ uploadSummary.imageCount }}
          </template>
          <div v-if="uploadSummary.warnings.length" class="cv-warnings">
            <div v-for="(w, i) in uploadSummary.warnings" :key="i">· {{ w }}</div>
          </div>
        </el-alert>
      </div>

      <!-- 加载封面 -->
      <div class="cv-section">
        <div class="cv-section-title">加载封面（可选）</div>
        <OssUploadInput
          v-model="form.posterUrl"
          scene="image"
          accept="image/*"
          upload-label="上传封面图"
          hint="模型加载期间展示的占位图；留空则显示纯色背景"
        />
      </div>

      <!-- 机位 -->
      <div class="cv-section">
        <div class="cv-section-title">初始机位</div>
        <div class="cv-grid">
          <div class="cv-field">
            <span class="cv-field-label">视距</span>
            <el-input-number v-model="form.camera.distance" :min="1" :max="50" :step="0.1" :precision="2" size="small" controls-position="right" />
          </div>
          <div class="cv-field">
            <span class="cv-field-label">自动旋转</span>
            <el-switch v-model="form.camera.autoRotate" />
          </div>
        </div>
      </div>

      <!-- 材质 -->
      <div class="cv-section">
        <div class="cv-section-title">材质（PBR）</div>
        <div class="cv-slider">
          <span class="cv-field-label">粗糙度</span>
          <el-slider v-model="form.material.roughness" :min="0" :max="1" :step="0.01" show-input size="small" />
        </div>
        <div class="cv-slider">
          <span class="cv-field-label">金属度</span>
          <el-slider v-model="form.material.metalness" :min="0" :max="1" :step="0.01" show-input size="small" />
        </div>
        <div class="cv-slider">
          <span class="cv-field-label">环境光强</span>
          <el-slider v-model="form.material.envMapIntensity" :min="0" :max="3" :step="0.1" show-input size="small" />
        </div>
      </div>

      <!-- 高级 -->
      <el-collapse class="cv-advanced">
        <el-collapse-item title="高级参数（一般无需修改）">
          <div class="cv-grid">
            <div class="cv-field">
              <span class="cv-field-label">方位角 phi</span>
              <el-input-number v-model="form.camera.phi" :step="0.01" :precision="2" size="small" controls-position="right" />
            </div>
            <div class="cv-field">
              <span class="cv-field-label">俯仰角 theta</span>
              <el-input-number v-model="form.camera.theta" :step="0.01" :precision="2" size="small" controls-position="right" />
            </div>
          </div>
          <div class="cv-transform">
            <span class="cv-field-label">归一化参数</span>
            <span class="cv-desc">{{ transformText }}（由模型上传时的批处理 manifest 写入，此处只读）</span>
          </div>
          <el-button link type="primary" size="small" @click="resetParams">恢复机位 / 材质默认值</el-button>
        </el-collapse-item>
      </el-collapse>

      <el-alert
        v-if="form.viewerEnabled && !form.model3dUrl"
        class="cv-guard"
        type="warning"
        :closable="false"
        show-icon
        title="尚未配置模型，无法开启沉浸式鉴赏——请先上传 GLB 模型或关闭开关。"
      />
    </div>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="saving" :disabled="form.viewerEnabled && !form.model3dUrl" @click="onSave">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { UploadFile } from 'element-plus'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import OssUploadInput from '@/components/OssUploadInput.vue'
import {
  fetchCraftViewerConfig,
  saveCraftViewerConfig,
  uploadCraftModel,
  type CraftModelUploadResult
} from '@/api/craft'

const props = defineProps<{
  visible: boolean
  craft: { id: number; name: string } | null
}>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: []
}>()

const DEFAULT_CAMERA = { distance: 8.4, phi: 1.48, theta: 0.35, autoRotate: true }
const DEFAULT_MATERIAL = { roughness: 0.15, metalness: 0.02, envMapIntensity: 1.3 }

const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const uploadSummary = ref<CraftModelUploadResult | null>(null)

const form = reactive({
  viewerEnabled: false,
  posterUrl: '',
  model3dUrl: '',
  camera: { ...DEFAULT_CAMERA },
  material: { ...DEFAULT_MATERIAL },
  transform: null as Record<string, unknown> | null
})

const transformText = computed(() =>
  form.transform && Object.keys(form.transform).length ? JSON.stringify(form.transform) : '默认（scale 1, 无偏移）'
)

function toNumberRecord(src: Record<string, unknown> | null, defaults: Record<string, number>) {
  const out: Record<string, number> = { ...defaults }
  if (src) {
    for (const k of Object.keys(defaults)) {
      if (typeof src[k] === 'number') out[k] = src[k] as number
    }
  }
  return out
}

async function onOpen() {
  if (!props.craft) return
  loading.value = true
  uploadSummary.value = null
  try {
    const cfg = await fetchCraftViewerConfig(props.craft.id)
    form.viewerEnabled = cfg.viewerEnabled
    form.posterUrl = cfg.posterUrl || ''
    form.model3dUrl = cfg.model3dUrl || ''
    form.camera = { ...DEFAULT_CAMERA, ...toNumberRecord(cfg.camera as Record<string, unknown> | null, { distance: DEFAULT_CAMERA.distance, phi: DEFAULT_CAMERA.phi, theta: DEFAULT_CAMERA.theta }) }
    form.camera.autoRotate = cfg.camera && typeof cfg.camera.autoRotate === 'boolean' ? cfg.camera.autoRotate : DEFAULT_CAMERA.autoRotate
    form.material = toNumberRecord(cfg.material as Record<string, unknown> | null, DEFAULT_MATERIAL)
    form.transform = (cfg.transform as Record<string, unknown> | null) ?? null
  } finally {
    loading.value = false
  }
}

function onPickGlb(uploadFile: UploadFile) {
  const raw = uploadFile.raw
  if (!raw || !props.craft) return
  if (!/\.(glb|gltf)$/i.test(raw.name)) {
    ElMessage.warning('仅支持 .glb / .gltf 文件')
    return
  }
  uploading.value = true
  uploadCraftModel(props.craft.id, raw)
    .then((res) => {
      form.model3dUrl = res.model3dUrl
      if (res.transform) form.transform = res.transform as Record<string, unknown>
      uploadSummary.value = res
      ElMessage.success('模型已上传并校验通过')
    })
    .finally(() => {
      uploading.value = false
    })
}

function resetParams() {
  form.camera = { ...DEFAULT_CAMERA }
  form.material = { ...DEFAULT_MATERIAL }
}

async function onSave() {
  if (!props.craft) return
  saving.value = true
  try {
    await saveCraftViewerConfig(props.craft.id, {
      viewerEnabled: form.viewerEnabled,
      posterUrl: form.posterUrl || null,
      camera: { ...form.camera },
      material: { ...form.material }
    })
    ElMessage.success('已保存沉浸式鉴赏配置')
    emit('update:visible', false)
    emit('saved')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.cv-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.cv-switch { padding-bottom: 12px; border-bottom: 1px solid var(--el-border-color-lighter); }
.cv-section { margin-top: 18px; }
.cv-section-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); margin-bottom: 10px; }
.cv-label { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.cv-desc { font-size: 12px; color: var(--el-text-color-secondary); line-height: 1.5; }
.cv-model { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.cv-summary { margin-top: 12px; }
.cv-warnings { font-size: 12px; margin-top: 4px; line-height: 1.6; }
.cv-grid { display: flex; gap: 32px; flex-wrap: wrap; }
.cv-field { display: flex; align-items: center; gap: 10px; }
.cv-field-label { font-size: 13px; color: var(--el-text-color-regular); white-space: nowrap; }
.cv-slider { display: flex; align-items: center; gap: 14px; margin-bottom: 6px; }
.cv-slider .el-slider { flex: 1; max-width: 460px; }
.cv-advanced { margin-top: 16px; }
.cv-transform { display: flex; align-items: baseline; gap: 10px; margin: 10px 0; flex-wrap: wrap; }
.cv-guard { margin-top: 16px; }
</style>
