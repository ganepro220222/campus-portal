<template>
  <p v-if="text" class="form-tip field-hint">{{ text }}</p>
</template>

<script setup lang="ts">
defineProps<{ text?: string }>()
</script>
