<template>
  <div class="page-card">
    <div class="page-header">
      <h2>公告管理</h2>
      <el-button type="primary" :icon="Plus" @click="openDialog()">新建公告</el-button>
    </div>

    <p class="text-muted">
      配置首页滚动通知条；生效时间与失效时间控制展示窗口，保存后 5 分钟内同步至小程序（缓存 TTL）。
    </p>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="sort" label="排序" width="70" align="center" />
      <el-table-column prop="content" label="公告内容" min-width="260" show-overflow-tooltip />
      <el-table-column prop="startTime" label="生效时间" width="150" />
      <el-table-column prop="endTime" label="失效时间" width="150" />
      <el-table-column label="展示中" width="90" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.activeNow" type="success" size="small">是</el-tag>
          <el-tag v-else type="info" size="small">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right" align="center">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button link type="danger" @click="onDelete(row)">删除</el-button>
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
      :title="editingId ? '编辑公告' : '新建公告'"
      width="560px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-form-item label="公告内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="form.linkUrl" placeholder="选填，可填小程序内部页面路径" />
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="留空表示立即生效"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            style="width: 100%"
            clearable
          />
        </el-form-item>
        <el-form-item label="失效时间">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            placeholder="留空表示长期有效"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            style="width: 100%"
            clearable
          />
        </el-form-item>
        <el-form-item label="滚动显示">
          <el-switch v-model="form.isScroll" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
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
import { onMounted, reactive, ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  createAnnouncement,
  fetchAnnouncement,
  fetchAnnouncements,
  removeAnnouncement,
  updateAnnouncement
} from '@/api/announcement'
import type { AnnouncementItem } from '@/types/api'

const loading = ref(false)
const saving = ref(false)
const list = ref<AnnouncementItem[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  content: '',
  linkUrl: '',
  sort: 0,
  isScroll: 1,
  startTime: '',
  endTime: '',
  status: 1
})

const rules: FormRules = {
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }]
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetchAnnouncements(page.value, pageSize.value)
    list.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.content = ''
  form.linkUrl = ''
  form.sort = 0
  form.isScroll = 1
  form.startTime = ''
  form.endTime = ''
  form.status = 1
}

async function openDialog(row?: AnnouncementItem) {
  resetForm()
  editingId.value = row?.id ?? null
  if (row) {
    const detail = await fetchAnnouncement(row.id)
    form.content = detail.content
    form.linkUrl = detail.linkUrl || ''
    form.sort = detail.sort ?? 0
    form.isScroll = detail.isScroll ?? 1
    form.startTime = detail.startTime || ''
    form.endTime = detail.endTime || ''
    form.status = detail.status ?? 1
  }
  dialogVisible.value = true
}

async function onSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = {
      content: form.content,
      linkUrl: form.linkUrl || undefined,
      sort: form.sort,
      isScroll: form.isScroll,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      status: form.status
    }
    if (editingId.value) {
      await updateAnnouncement(editingId.value, payload)
      ElMessage.success('已更新')
    } else {
      await createAnnouncement(payload)
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await loadData()
  } finally {
    saving.value = false
  }
}

async function onDelete(row: AnnouncementItem) {
  await ElMessageBox.confirm(`确定删除该公告？`, '删除确认', { type: 'warning' })
  await removeAnnouncement(row.id)
  ElMessage.success('已删除')
  await loadData()
}

onMounted(loadData)
</script>

<style scoped lang="scss">
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
