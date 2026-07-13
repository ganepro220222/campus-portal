<template>
  <el-container class="admin-layout">
    <el-aside :width="collapsed ? '68px' : '232px'" class="aside">
      <div class="logo" @click="router.push('/dashboard')">
        <span class="logo-seal"><img :src="sealMark" alt="印" /></span>
        <span v-show="!collapsed" class="logo-text">
          <span class="logo-zh">云端书院</span>
          <span class="logo-en">管理后台</span>
        </span>
      </div>
      <el-scrollbar class="menu-scroll">
        <el-menu
          :default-active="route.path"
          :default-openeds="defaultOpeneds"
          :collapse="collapsed"
          :collapse-transition="false"
          background-color="transparent"
          text-color="#c8cce0"
          active-text-color="#F0DCA0"
          router
        >
          <template v-for="node in visibleMenus" :key="isMenuGroup(node) ? node.key : node.path">
            <el-menu-item v-if="!isMenuGroup(node)" :index="node.path">
              <el-icon><component :is="node.icon" /></el-icon>
              <template #title>{{ node.title }}</template>
            </el-menu-item>
            <el-sub-menu v-else :index="node.key">
              <template #title>
                <el-icon><component :is="node.icon" /></el-icon>
                <span>{{ node.title }}</span>
              </template>
              <el-menu-item v-for="child in node.children" :key="child.path" :index="child.path">
                <el-icon><component :is="child.icon" /></el-icon>
                <template #title>{{ child.title }}</template>
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button :icon="collapsed ? Expand : Fold" text class="collapse-btn" @click="collapsed = !collapsed" />
          <div class="crumb">
            <el-icon class="crumb-ic"><HomeFilled /></el-icon>
            <span class="crumb-sep">/</span>
            <span class="crumb-title">{{ route.meta.title }}</span>
          </div>
        </div>
        <div class="header-right">
          <el-tag size="small" class="role-tag" effect="light">{{ auth.profile?.roleName || '管理员' }}</el-tag>
          <div class="user">
            <span class="avatar">{{ initial }}</span>
            <span class="user-name">{{ auth.displayName }}</span>
          </div>
          <el-button v-if="!auth.mustChangePassword" link type="primary" @click="openChangePassword">修改密码</el-button>
          <el-button type="danger" link @click="onLogout">退出</el-button>
        </div>
      </el-header>

      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <ChangePasswordDialog v-model="pwdDialogVisible" :forced="auth.mustChangePassword" />
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Expand, Fold, HomeFilled } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { filterMenus, isMenuGroup, type MenuGroup } from '@/router'
import sealMark from '@/assets/brand-seal.png'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const collapsed = ref(false)
const pwdDialogVisible = ref(false)

watch(
  () => auth.mustChangePassword,
  (v) => {
    if (v) pwdDialogVisible.value = true
  },
  { immediate: true }
)

function openChangePassword() {
  pwdDialogVisible.value = true
}

const visibleMenus = computed(() =>
  filterMenus(auth.profile?.permissions || [])
)

const defaultOpeneds = computed(() =>
  visibleMenus.value
    .filter((node): node is MenuGroup =>
      isMenuGroup(node) && node.children.some((child) => child.path === route.path)
    )
    .map((node) => node.key)
)

const initial = computed(() => (auth.displayName || '管').trim().charAt(0))

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
  background: linear-gradient(180deg, #2b356e 0%, #1e2654 100%);
  transition: width 0.24s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 16px rgba(20, 26, 56, 0.18);
}

.logo {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-seal {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1.5px solid rgba(201, 162, 39, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 14px rgba(201, 162, 39, 0.22);
}
.logo-seal img {
  width: 26px;
  height: 26px;
  object-fit: contain;
  display: block;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  white-space: nowrap;
}
.logo-zh {
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 1px;
}
.logo-en {
  color: rgba(200, 204, 224, 0.65);
  font-size: 11px;
  letter-spacing: 2px;
}

.menu-scroll {
  flex: 1;
  padding: 12px 10px 0 15px;
}

.header {
  background: #fff;
  border-bottom: 1px solid var(--brand-line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  box-shadow: 0 2px 12px rgba(31, 40, 90, 0.05);
  z-index: 5;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.collapse-btn {
  font-size: 18px;
  color: var(--brand-sub);
}

.crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}
.crumb-ic {
  color: var(--brand-primary);
}
.crumb-sep {
  color: #c3cce0;
}
.crumb-title {
  color: var(--brand-ink);
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}
.role-tag {
  --el-tag-bg-color: var(--brand-gold-soft);
  --el-tag-text-color: #9c7c2e;
  --el-tag-border-color: transparent;
  font-weight: 600;
}
.user {
  display: flex;
  align-items: center;
  gap: 8px;
}
.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3f57b5, #2b356e);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-name {
  font-size: 14px;
  color: var(--brand-ink);
  font-weight: 500;
}

.main {
  padding: 22px;
  background: linear-gradient(180deg, #eef1f7 0, #f4f6fb 100%);
  overflow: auto;
}

/* 页面切换动效 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* 菜单 */
:deep(.el-menu) {
  border-right: none;
}
:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin-bottom: 6px;
  border-radius: 10px;
  color: #c8cce0;
}
:deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  margin-bottom: 6px;
  border-radius: 10px;
  color: #c8cce0;
}
:deep(.el-sub-menu__title:hover) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
:deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
:deep(.el-menu-item.is-active) {
  background: rgba(240, 220, 160, 0.14);
  color: #f0dca0;
  font-weight: 600;
  position: relative;
}
:deep(.el-menu-item.is-active)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  border-radius: 3px;
  background: #c9a227;
}
:deep(.el-menu--collapse .el-menu-item.is-active)::before {
  display: none;
}
</style>
