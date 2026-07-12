<template>
  <div class="page-card">
    <div class="page-header">
      <h2>师生账号</h2>
      <div class="header-actions">
        <el-button @click="onDownloadTemplate">下载导入模板</el-button>
        <el-upload
          :show-file-list="false"
          accept=".xlsx,.xls"
          :http-request="onImport"
        >
          <el-button type="primary">Excel 批量导入</el-button>
        </el-upload>
      </div>
    </div>

    <p class="text-muted">
      由校方导入学号账号，初始密码默认身份证后 6 位（无身份证则取学号后 6 位）。学生首次微信登录须绑定学号。
    </p>

    <div class="toolbar">
      <el-input v-model="keyword" placeholder="学号 / 姓名" clearable style="width: 220px" @keyup.enter="loadData" />
      <el-select v-model="statusFilter" placeholder="状态" clearable style="width: 120px" @change="loadData">
        <el-option label="正常" :value="1" />
        <el-option label="禁用" :value="0" />
      </el-select>
      <el-button @click="loadData">查询</el-button>
    </div>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="studentNo" label="学号" width="120" />
      <el-table-column prop="realName" label="姓名" width="100" />
      <el-table-column prop="college" label="学院" min-width="160" show-overflow-tooltip />
      <el-table-column prop="grade" label="年级" width="80" />
      <el-table-column prop="phone" label="手机号" width="120" />
      <el-table-column prop="points" label="积分" width="80" align="center" />
      <el-table-column label="微信绑定" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.wxBound ? 'success' : 'info'" size="small">{{ row.wxBound ? '已绑定' : '未绑定' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? '正常' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170" />
      <el-table-column label="操作" width="120" fixed="right" align="center">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 1"
            link
            type="danger"
            @click="onToggleStatus(row, 0)"
          >禁用</el-button>
          <el-button
            v-else
            link
            type="primary"
            @click="onToggleStatus(row, 1)"
          >启用</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { UploadRequestOptions } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  downloadMemberImportTemplate,
  fetchMembers,
  importMembers,
  updateMemberStatus,
  type MemberItem
} from '@/api/member'

const loading = ref(false)
const list = ref<MemberItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const statusFilter = ref<number | undefined>()

async function loadData() {
  loading.value = true
  try {
    const res = await fetchMembers(keyword.value || undefined, statusFilter.value, page.value, pageSize.value)
    list.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function onDownloadTemplate() {
  await downloadMemberImportTemplate()
}

async function onImport(options: UploadRequestOptions) {
  try {
    const result = await importMembers(options.file as File)
    const msg = `导入完成：成功 ${result.successCount}，跳过 ${result.skippedCount}，失败 ${result.failedCount}`
    if (result.errors?.length) {
      await ElMessageBox.alert(
        result.errors.join('\n'),
        msg,
        { confirmButtonText: '知道了' }
      )
    } else {
      ElMessage.success(msg)
    }
    await loadData()
  } catch {
    // 错误由 request 拦截器提示
  }
}

async function onToggleStatus(row: MemberItem, status: number) {
  const action = status === 1 ? '启用' : '禁用'
  await ElMessageBox.confirm(`确定${action}学号 ${row.studentNo} 吗？`, '确认')
  await updateMemberStatus(row.id, status)
  ElMessage.success(`${action}成功`)
  await loadData()
}

onMounted(loadData)
</script>

<style scoped>
.header-actions {
  display: flex;
  gap: 8px;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
