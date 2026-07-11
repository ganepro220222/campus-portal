<template>
  <div class="page-card">
    <div class="page-header">
      <h2>展馆管理</h2>
      <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openDialog()">新建展馆</el-button>
    </div>

    <p class="text-muted">
      维护 11 个 VR 展馆的名称、短名称、全景链接、轮播图文与语音讲解；下架后小程序不可见。
    </p>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="sort" label="排序" width="70" align="center" />
      <el-table-column prop="name" label="展馆名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="shortName" label="短名称" width="120" show-overflow-tooltip />
      <el-table-column label="VR" width="80" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.vrReady ? 'success' : 'info'">
            {{ row.vrReady ? '已配置' : '待配置' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="categoryName" label="分类" width="120" />
      <el-table-column prop="intro" label="简介" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <el-button v-if="canWrite" link type="primary" @click="openDialog(row)">编辑</el-button>
          <el-button
            v-if="canPublish && row.status !== 1"
            link
            type="success"
            @click="onPublish(row)"
          >上架</el-button>
          <el-button
            v-if="canPublish && row.status === 1"
            link
            type="warning"
            @click="onUnpublish(row)"
          >下架</el-button>
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

    <HallEditDialog
      v-model:visible="dialogVisible"
      :editing-id="editingId"
      :form="form"
      :categories="categories"
      :saving="saving"
      :rules="rules"
      @save="onSave"
    />
  </div>
</template>

<script setup lang="ts">
/** 展馆列表页：表格与快捷入口，业务逻辑见 useHallList */
import { Plus } from '@element-plus/icons-vue'
import { useHallList } from '@/composables/useHallList'
import HallEditDialog from './HallEditDialog.vue'

const {
  canWrite,
  canPublish,
  loading,
  saving,
  list,
  categories,
  page,
  pageSize,
  total,
  dialogVisible,
  editingId,
  form,
  rules,
  loadData,
  openDialog,
  onSave,
  onPublish,
  onUnpublish
} = useHallList()
</script>

<style scoped lang="scss">
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
