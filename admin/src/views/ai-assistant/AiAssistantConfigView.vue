<template>
  <div class="page-card">
    <div class="page-header">
      <h2>AI 助手配置</h2>
      <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
    </div>

    <p class="text-muted">配置小程序悬浮「书院文化助手」欢迎语、推荐问题，以及搜索页热词（保存后小程序重新打开生效）。</p>

    <el-form label-width="120px" style="max-width: 720px">
      <el-form-item label="欢迎语">
        <el-input v-model="form.welcomeText" type="textarea" :rows="3" maxlength="300" show-word-limit />
      </el-form-item>
      <el-form-item label="推荐问题">
        <div class="chip-editor">
          <div v-for="(_q, idx) in form.suggestQuestions" :key="idx" class="chip-row">
            <el-input v-model="form.suggestQuestions[idx]" maxlength="80" />
            <el-button link type="danger" @click="removeQuestion(idx)">删除</el-button>
          </div>
          <el-button v-if="form.suggestQuestions.length < 6" @click="addQuestion">添加问题</el-button>
        </div>
      </el-form-item>
      <el-form-item label="搜索热词">
        <div class="chip-editor">
          <div v-for="(_t, idx) in form.searchHotTags" :key="'t' + idx" class="chip-row">
            <el-input v-model="form.searchHotTags[idx]" maxlength="20" />
            <el-button link type="danger" @click="removeTag(idx)">删除</el-button>
          </div>
          <el-button v-if="form.searchHotTags.length < 10" @click="addTag">添加热词</el-button>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchAiAssistantConfig, saveAiAssistantConfig } from '@/api/aiAssistant'

const saving = ref(false)
const form = reactive({
  welcomeText: '',
  suggestQuestions: [''] as string[],
  searchHotTags: [] as string[]
})

async function loadData() {
  const data = await fetchAiAssistantConfig()
  form.welcomeText = data.welcomeText
  form.suggestQuestions = data.suggestQuestions?.length ? [...data.suggestQuestions] : ['']
  form.searchHotTags = data.searchHotTags?.length ? [...data.searchHotTags] : []
}

function addQuestion() {
  form.suggestQuestions.push('')
}

function removeQuestion(idx: number) {
  form.suggestQuestions.splice(idx, 1)
  if (!form.suggestQuestions.length) form.suggestQuestions.push('')
}

function addTag() {
  form.searchHotTags.push('')
}

function removeTag(idx: number) {
  form.searchHotTags.splice(idx, 1)
}

async function onSave() {
  const questions = form.suggestQuestions.map((s) => s.trim()).filter(Boolean)
  const tags = form.searchHotTags.map((s) => s.trim()).filter(Boolean)
  if (!form.welcomeText.trim()) {
    ElMessage.warning('请填写欢迎语')
    return
  }
  if (!questions.length) {
    ElMessage.warning('请至少填写 1 条推荐问题')
    return
  }
  saving.value = true
  try {
    await saveAiAssistantConfig({
      welcomeText: form.welcomeText.trim(),
      suggestQuestions: questions,
      searchHotTags: tags
    })
    ElMessage.success('已保存')
    await loadData()
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.chip-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chip-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
