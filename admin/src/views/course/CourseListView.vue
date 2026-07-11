<template>
  <div class="page-card">
    <div class="page-header">
      <h2>课程管理</h2>
      <el-button v-if="canWrite" type="primary" :icon="Plus" @click="openDialog()">新建课程</el-button>
    </div>

    <p class="text-muted">
      维护在线课程信息与上下架；支持上传封面、教学视频与字幕文件。
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
      <el-table-column prop="name" label="课程名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="categoryName" label="分类" width="110" />
      <el-table-column label="时长" width="80" align="center">
        <template #default="{ row }">
          {{ row.durationMinutes ? row.durationMinutes + ' 分' : '—' }}
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开课时间" width="150" />
      <el-table-column label="字幕" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="subtitleTagType(row.subtitleStatus)" size="small">
            {{ row.subtitleStatusLabel }}
          </el-tag>
        </template>
      </el-table-column>
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

    <CourseEditDialog
      v-model:visible="dialogVisible"
      v-model:subtitle-url-input="subtitleUrlInput"
      :editing-id="editingId"
      :form="form"
      :categories="categories"
      :resource-options="resourceOptions"
      :saving="saving"
      :rules="rules"
      :can-write="canWrite"
      :subtitle-info="subtitleInfo"
      :subtitle-triggering="subtitleTriggering"
      :subtitle-saving="subtitleSaving"
      :subtitle-tag-type="subtitleTagType"
      @save="onSave"
      @trigger-subtitle="onTriggerSubtitle"
      @save-subtitle="onSaveSubtitle"
    />
  </div>
</template>

<script setup lang="ts">
/** 课程列表页：筛选表格与快捷入口，业务逻辑见 useCourseList */
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useCourseList } from '@/composables/useCourseList'
import CourseEditDialog from './CourseEditDialog.vue'

const {
  canWrite,
  canPublish,
  loading,
  saving,
  list,
  categories,
  resourceOptions,
  page,
  pageSize,
  total,
  filterCategoryId,
  filterStatus,
  dialogVisible,
  editingId,
  subtitleInfo,
  subtitleUrlInput,
  subtitleTriggering,
  subtitleSaving,
  form,
  rules,
  subtitleTagType,
  loadData,
  onFilter,
  openDialog,
  onSave,
  onTriggerSubtitle,
  onSaveSubtitle,
  onPublish,
  onUnpublish
} = useCourseList()
</script>

<style scoped lang="scss">
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
