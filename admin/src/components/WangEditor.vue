<template>
  <div class="wang-editor" :class="{ 'is-disabled': disabled }">
    <Toolbar
      class="wang-toolbar"
      :editor="editorRef"
      :default-config="toolbarConfig"
      mode="default"
    />
    <Editor
      v-model="html"
      class="wang-body"
      :default-config="editorConfig"
      mode="default"
      @on-created="onCreated"
      @on-change="onChange"
    />
  </div>
</template>

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, shallowRef, watch } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import { ElMessage } from 'element-plus'
import { uploadFile } from '@/api/upload'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  disabled?: boolean
  minHeight?: string
}>(), {
  modelValue: '',
  placeholder: '请输入正文内容',
  disabled: false,
  minHeight: '320px'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const editorRef = shallowRef<IDomEditor>()
const html = shallowRef(props.modelValue || '')

watch(() => props.modelValue, (v) => {
  const next = v || ''
  if (next !== html.value) html.value = next
})

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ['group-video', 'fullScreen']
}

const editorConfig: Partial<IEditorConfig> = {
  placeholder: props.placeholder,
  readOnly: props.disabled,
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: (url: string, alt?: string, href?: string) => void) {
        try {
          const res = await uploadFile(file, 'image')
          insertFn(res.url, '', '')
        } catch {
          ElMessage.error('图片上传失败，请检查文件格式与大小，或联系技术人员')
        }
      }
    }
  }
}

function onCreated(editor: IDomEditor) {
  editorRef.value = editor
}

function onChange(editor: IDomEditor) {
  const val = editor.getHtml()
  emit('update:modelValue', val)
  emit('change', val)
}

onBeforeUnmount(() => {
  editorRef.value?.destroy()
})
</script>

<style scoped lang="scss">
.wang-editor {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  /* 勿设 overflow:hidden，否则会裁切「网络图片」等工具栏浮层 */
  overflow: visible;
}

.wang-toolbar {
  border-bottom: 1px solid var(--el-border-color-light);
  background: #f8f9fc;
  border-radius: 6px 6px 0 0;
  overflow: visible;
}

/* 工具栏按钮换行时更紧凑整齐 */
:deep(.w-e-bar-item) {
  padding: 4px 2px;
}

.wang-body {
  min-height: v-bind(minHeight);
  /* 勿用 overflow-y:hidden —— 会令 overflow-x 计算为 auto，裁切「网络图片」等浮层弹窗 */
  overflow: visible;
}

/* WangEditor 内置工具栏下拉 / 弹层（网络图片、字号、字体、行高等）需完整显示 */
:deep(.w-e-toolbar),
:deep(.w-e-bar),
:deep(.w-e-bar-item-menus-container),
:deep(.w-e-text-container),
:deep(.w-e-drop-panel),
:deep(.w-e-select-list),
:deep(.w-e-modal) {
  overflow: visible;
}

.is-disabled {
  opacity: 0.72;
  pointer-events: none;
}
</style>
