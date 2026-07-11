<template>
  <div class="page-card">
    <div class="page-header">
      <h2>文创管理</h2>
      <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openDialog()">新建文创</el-button>
    </div>

    <p class="text-muted">
      维护工艺品名称、介绍、展示图片或 3D 模型、咨询联系方式；上架后小程序「文化好物」中展示。
    </p>

    <div class="toolbar">
      <el-select
        v-model="filterCategoryId"
        placeholder="分类"
        clearable
        style="width: 140px"
        @change="onFilter"
      >
        <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" clearable style="width: 110px" @change="onFilter">
        <el-option label="上架" :value="1" />
        <el-option label="下架" :value="0" />
      </el-select>
      <el-button :icon="Refresh" @click="loadData">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="list" stripe border>
      <el-table-column prop="sort" label="排序" width="70" align="center" />
      <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
      <el-table-column prop="categoryName" label="分类" width="110" />
      <el-table-column label="展示方式" width="110" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.previewType === 'model3d' ? 'warning' : 'info'">
            {{ row.previewTypeLabel }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="introZh" label="中文简介" min-width="180" show-overflow-tooltip />
      <el-table-column label="状态" width="80" align="center">
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
          <span v-if="!canWrite" class="text-muted">—</span>
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

    <CraftEditDialog
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
/** 文创列表页：筛选表格与快捷入口，业务逻辑见 useCraftList */
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useCraftList } from '@/composables/useCraftList'
import CraftEditDialog from './CraftEditDialog.vue'

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
  filterCategoryId,
  filterStatus,
  dialogVisible,
  editingId,
  form,
  rules,
  loadData,
  onFilter,
  openDialog,
  onSave,
  onPublish,
  onUnpublish
} = useCraftList()
</script>

<style scoped lang="scss">
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
