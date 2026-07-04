<template>
  <el-container class="admin-layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="aside">
      <div class="logo" @click="router.push('/dashboard')">
        <span class="logo-icon">书</span>
        <span v-show="!collapsed" class="logo-text">云端书院</span>
      </div>
      <el-menu
        :default-active="route.path"
        :collapse="collapsed"
        background-color="#2B356E"
        text-color="#c8cce0"
        active-text-color="#C9A227"
        router
      >
        <el-menu-item v-for="item in visibleMenus" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button :icon="collapsed ? Expand : Fold" text @click="collapsed = !collapsed" />
          <span class="breadcrumb">{{ route.meta.title }}</span>
        </div>
        <div class="header-right">
          <el-tag size="small" type="info">{{ auth.profile?.roleName || '管理员' }}</el-tag>
          <span class="user-name">{{ auth.displayName }}</span>
          <el-button type="danger" link @click="onLogout">退出</el-button>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Expand, Fold } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { filterMenus } from '@/router'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const collapsed = ref(false)

const visibleMenus = computed(() =>
  filterMenus(auth.profile?.permissions || [])
)

async function onLogout() {
  await ElMessageBox.confirm('确定退出登录？', '提示', { type: 'warning' })
  auth.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped lang="scss">
.admin-layout {
  height: 100vh;
}

.aside {
  background: #2b356e;
  transition: width 0.2s;
  overflow: hidden;
}

.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(201, 162, 39, 0.15);
  color: #c9a227;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: KaiTi, STKaiti, serif;
  font-size: 18px;
}

.logo-text {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.header {
  background: #fff;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 56px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb {
  font-size: 15px;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-size: 14px;
  color: #606266;
}

.main {
  padding: 20px;
  background: #f0f2f5;
  overflow: auto;
}

:deep(.el-menu) {
  border-right: none;
}
</style>
