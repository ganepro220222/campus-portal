<template>
  <OssUploadInput
    :model-value="modelValue"
    :fit-mode="fitMode"
    scene="cover"
    accept="image/*"
    preview="image"
    show-cover-fit
    :aspect-hint="aspectHint"
    :upload-label="uploadLabel"
    :done-text="doneText"
    @update:model-value="$emit('update:modelValue', $event)"
    @update:fit-mode="$emit('update:fitMode', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import OssUploadInput from '@/components/OssUploadInput.vue'
import { COVER_ASPECT_HINTS, type CoverFitMode, type CoverSlot } from '@/utils/cover'

const props = withDefaults(defineProps<{
  modelValue?: string
  fitMode?: CoverFitMode
  slot?: CoverSlot
  uploadLabel?: string
  doneText?: string
}>(), {
  modelValue: '',
  fitMode: 'fill',
  uploadLabel: '上传封面',
  doneText: '封面已上传'
})

defineEmits<{
  'update:modelValue': [value: string]
  'update:fitMode': [value: CoverFitMode]
}>()

const aspectHint = computed(() => (props.slot ? COVER_ASPECT_HINTS[props.slot] : ''))
</script>
