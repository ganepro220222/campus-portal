<template>
  <div class="dashboard">
    <!-- 欢迎横幅 -->
    <div class="welcome">
      <div class="welcome-txt">
        <h2>{{ greeting }}，{{ auth.displayName }} 👋</h2>
        <p>欢迎回到云端书院管理后台 · {{ today }}</p>
      </div>
      <div class="welcome-role">
        <el-icon><UserFilled /></el-icon>
        <span>{{ auth.profile?.roleName || '管理员' }}</span>
      </div>
      <div class="welcome-seal">书</div>
    </div>

    <StatsPanel />

    <!-- 模块卡片 -->
    <div class="mod-grid">
      <div
        v-for="mod in visibleModules"
        :key="mod.path"
        class="mod-card"
        @click="$router.push(mod.path)"
      >
        <div class="mod-ic" :style="{ background: mod.grad }">
          <el-icon :size="22"><component :is="mod.icon" /></el-icon>
        </div>
        <div class="mod-body">
          <div class="mod-title">{{ mod.title }}</div>
          <div class="mod-desc">{{ mod.desc }}</div>
        </div>
        <el-icon class="mod-arrow"><ArrowRightBold /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Document, OfficeBuilding, Goods, VideoCamera, FolderOpened,
  Calendar, Picture, Bell, UserFilled, ArrowRightBold
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import StatsPanel from '@/components/StatsPanel.vue'

const auth = useAuthStore()

const modules = [
  { title: '新闻管理', desc: '新闻发布、分类维护与置顶推荐', path: '/news', perm: 'news:read', icon: Document, grad: 'linear-gradient(135deg,#3F57B5,#2B356E)' },
  { title: '展馆管理', desc: '11 馆信息维护，下架后小程序不可见', path: '/halls', perm: 'hall:read', icon: OfficeBuilding, grad: 'linear-gradient(135deg,#365E8C,#2E7C8C)' },
  { title: '文创管理', desc: '工艺品双语介绍、鉴赏图 / 3D 与咨询方式', path: '/crafts', perm: 'hall:read', icon: Goods, grad: 'linear-gradient(135deg,#7A2E36,#A0505A)' },
  { title: '课程管理', desc: '在线课程上下架、视频与 AI 字幕配置', path: '/courses', perm: 'course:read', icon: VideoCamera, grad: 'linear-gradient(135deg,#5A4E86,#7E72B0)' },
  { title: '资源管理', desc: 'PDF / 音视频资料上下架与下载统计', path: '/resources', perm: 'course:read', icon: FolderOpened, grad: 'linear-gradient(135deg,#3F6B4A,#5C9A6B)' },
  { title: '活动管理', desc: '活动发布、报名审核与 Excel 导出', path: '/activities', perm: 'enroll:read', icon: Calendar, grad: 'linear-gradient(135deg,#C0A24E,#9C7C2E)' },
  { title: '首页轮播', desc: '首页轮播图配置与排序', path: '/banners', perm: 'admin:super', icon: Picture, grad: 'linear-gradient(135deg,#4E7CC4,#2F5E92)' },
  { title: '公告管理', desc: '首页公告通知条内容维护', path: '/announcements', perm: 'admin:super', icon: Bell, grad: 'linear-gradient(135deg,#6E8FCB,#46639E)' }
]

const visibleModules = computed(() => modules.filter((m) => !m.perm || auth.can(m.perm)))

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const today = computed(() => {
  const d = new Date()
  const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()]
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 ${week}`
})
</script>

<style scoped lang="scss">
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 欢迎横幅 */
.welcome {
  position: relative;
  overflow: hidden;
  padding: 28px 32px;
  border-radius: 18px;
  background: linear-gradient(120deg, #1e2654 0%, #2b356e 55%, #3f57b5 100%);
  color: #fff;
  display: flex;
  align-items: center;
  box-shadow: 0 14px 34px rgba(31, 40, 90, 0.24);
}
.welcome-txt {
  flex: 1;
  z-index: 2;

  h2 {
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 700;
  }
  p {
    margin: 0;
    font-size: 13.5px;
    color: rgba(214, 224, 248, 0.85);
  }
}
.welcome-role {
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 20px;
}
.welcome-seal {
  position: absolute;
  right: -10px;
  bottom: -30px;
  font-size: 160px;
  line-height: 1;
  font-family: KaiTi, STKaiti, serif;
  color: rgba(255, 255, 255, 0.06);
  z-index: 1;
}

/* 模块卡片 */
.mod-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
}
.mod-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border: 1px solid var(--brand-line);
  border-radius: 16px;
  padding: 20px 22px;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
  box-shadow: 0 6px 18px rgba(31, 40, 90, 0.05);
}
.mod-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 34px rgba(31, 40, 90, 0.14);

  .mod-arrow {
    color: var(--brand-primary);
    transform: translateX(4px);
  }
}
.mod-ic {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 8px 18px rgba(31, 40, 90, 0.18);
}
.mod-body {
  flex: 1;
  min-width: 0;
}
.mod-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--brand-ink);
}
.mod-desc {
  font-size: 12.5px;
  color: var(--brand-muted);
  margin-top: 5px;
  line-height: 1.5;
}
.mod-arrow {
  color: #c3cce0;
  transition: transform 0.16s ease, color 0.16s ease;
}
</style>
