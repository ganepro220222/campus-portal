<template>
  <div class="page-card">
    <div class="page-header">
      <h2>首页概览</h2>
    </div>

    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">内容管理</div>
          <div class="stat-desc">新闻发布、展馆维护、Banner 配置</div>
          <el-button v-if="auth.can('news:read')" type="primary" link @click="$router.push('/news')">
            进入新闻管理 →
          </el-button>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">展馆管理</div>
          <div class="stat-desc">11 馆信息维护，下架后小程序不可见</div>
          <el-button v-if="auth.can('hall:read')" type="primary" link @click="$router.push('/halls')">
            进入展馆管理 →
          </el-button>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">文创管理</div>
          <div class="stat-desc">工艺品双语介绍、鉴赏图/3D 与咨询方式</div>
          <el-button v-if="auth.can('hall:read')" type="primary" link @click="$router.push('/crafts')">
            进入文创管理 →
          </el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="row-gap">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">课程管理</div>
          <div class="stat-desc">在线课程上下架、视频与字幕配置</div>
          <el-button v-if="auth.can('course:read')" type="primary" link @click="$router.push('/courses')">
            进入课程管理 →
          </el-button>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">资源管理</div>
          <div class="stat-desc">PDF/音视频资料上下架与下载统计</div>
          <el-button v-if="auth.can('course:read')" type="primary" link @click="$router.push('/resources')">
            进入资源管理 →
          </el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="row-gap">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">活动管理</div>
          <div class="stat-desc">活动发布、报名审核与 Excel 导出</div>
          <el-button v-if="auth.can('enroll:read')" type="primary" link @click="$router.push('/activities')">
            进入活动管理 →
          </el-button>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">系统设置</div>
          <div class="stat-desc">首页轮播图、公告通知条</div>
          <el-button v-if="auth.can('admin:super')" type="primary" link @click="$router.push('/banners')">
            Banner 管理 →
          </el-button>
          <el-button v-if="auth.can('admin:super')" type="primary" link @click="$router.push('/announcements')">
            公告管理 →
          </el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-alert
      class="notice"
      title="数据看板与统计报表将在后续 Phase 6 接入 ECharts"
      type="info"
      :closable="false"
      show-icon
    />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<style scoped lang="scss">
.stat-card {
  min-height: 140px;
}

.stat-label {
  font-size: 16px;
  font-weight: 600;
  color: #2b356e;
  margin-bottom: 8px;
}

.stat-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
  line-height: 1.5;
}

.row-gap {
  margin-top: 16px;
}

.notice {
  margin-top: 24px;
}
</style>
