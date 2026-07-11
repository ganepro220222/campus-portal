import { createRouter, createWebHistory } from 'vue-router'
import type { Component } from 'vue'
import { Odometer, Document, OfficeBuilding, Picture, Calendar, VideoCamera, FolderOpened, Goods, Bell, ChatDotRound, List, Reading, School, Menu } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { hasAnyPermission } from '@/utils/permission'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true, title: '登录' }
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: '首页概览' }
        },
        {
          path: 'banners',
          name: 'Banners',
          component: () => import('@/views/banner/BannerListView.vue'),
          meta: { title: 'Banner 管理', permission: 'admin:super' }
        },
        {
          path: 'announcements',
          name: 'Announcements',
          component: () => import('@/views/announcement/AnnouncementListView.vue'),
          meta: { title: '公告管理', permission: 'admin:super' }
        },
        {
          path: 'feedbacks',
          name: 'Feedbacks',
          component: () => import('@/views/feedback/FeedbackListView.vue'),
          meta: { title: '意见反馈', permission: 'admin:super' }
        },
        {
          path: 'news',
          name: 'News',
          component: () => import('@/views/news/NewsListView.vue'),
          meta: { title: '新闻管理', permission: 'news:read' }
        },
        {
          path: 'halls',
          name: 'Halls',
          component: () => import('@/views/hall/HallListView.vue'),
          meta: { title: '展馆管理', permission: 'hall:read' }
        },
        {
          path: 'crafts',
          name: 'Crafts',
          component: () => import('@/views/craft/CraftListView.vue'),
          meta: { title: '文创管理', permission: 'hall:read' }
        },
        {
          path: 'activities',
          name: 'Activities',
          component: () => import('@/views/activity/ActivityListView.vue'),
          meta: { title: '活动管理', permission: 'enroll:read' }
        },
        {
          path: 'activities/:id/enrolls',
          name: 'ActivityEnrolls',
          component: () => import('@/views/activity/ActivityEnrollView.vue'),
          meta: { title: '报名管理', permission: 'enroll:read' }
        },
        {
          path: 'courses',
          name: 'Courses',
          component: () => import('@/views/course/CourseListView.vue'),
          meta: { title: '课程管理', permission: 'course:read' }
        },
        {
          path: 'resources',
          name: 'Resources',
          component: () => import('@/views/resource/ResourceListView.vue'),
          meta: { title: '资源管理', permission: 'course:read' }
        },
        {
          path: 'sys-logs',
          name: 'SysLogs',
          component: () => import('@/views/syslog/SysLogListView.vue'),
          meta: { title: '操作日志', permission: 'admin:super' }
        },
        {
          path: 'knowledge',
          name: 'Knowledge',
          component: () => import('@/views/knowledge/KnowledgeListView.vue'),
          meta: { title: 'AI 知识库', permission: 'admin:super' }
        },
        {
          path: 'categories',
          name: 'Categories',
          component: () => import('@/views/category/CategoryListView.vue'),
          meta: { title: '分类管理', permission: 'category:read' }
        },
        {
          path: 'colleges',
          name: 'Colleges',
          component: () => import('@/views/college/CollegeListView.vue'),
          meta: { title: '学院矩阵', permission: 'admin:super' }
        }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
  ]
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    if (auth.isLoggedIn && to.name === 'Login') return { name: 'Dashboard' }
    return true
  }
  if (!auth.isLoggedIn) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  const perm = to.meta.permission as string | undefined
  if (perm && !auth.can(perm)) {
    return { name: 'Dashboard' }
  }
  document.title = `${to.meta.title || '管理后台'} · 云端书院`
  return true
})

export default router

/** 侧栏菜单配置（与 docs Phase 5 导航结构对齐，本期仅开放已实现模块） */
export interface MenuItem {
  path: string
  title: string
  icon: Component
  permissions: string[]
}

export const menuItems: MenuItem[] = [
  { path: '/dashboard', title: '首页概览', icon: Odometer, permissions: [] },
  { path: '/news', title: '新闻管理', icon: Document, permissions: ['news:read'] },
  { path: '/halls', title: '展馆管理', icon: OfficeBuilding, permissions: ['hall:read'] },
  { path: '/crafts', title: '文创管理', icon: Goods, permissions: ['hall:read'] },
  { path: '/courses', title: '课程管理', icon: VideoCamera, permissions: ['course:read'] },
  { path: '/resources', title: '资源管理', icon: FolderOpened, permissions: ['course:read'] },
  { path: '/categories', title: '分类管理', icon: Menu, permissions: ['category:read'] },
  { path: '/activities', title: '活动管理', icon: Calendar, permissions: ['enroll:read'] },
  { path: '/banners', title: 'Banner 管理', icon: Picture, permissions: ['admin:super'] },
  { path: '/announcements', title: '公告管理', icon: Bell, permissions: ['admin:super'] },
  { path: '/feedbacks', title: '意见反馈', icon: ChatDotRound, permissions: ['admin:super'] },
  { path: '/sys-logs', title: '操作日志', icon: List, permissions: ['admin:super'] },
  { path: '/knowledge', title: 'AI 知识库', icon: Reading, permissions: ['admin:super'] },
  { path: '/colleges', title: '学院矩阵', icon: School, permissions: ['admin:super'] }
]

export function filterMenus(permissions: string[]) {
  return menuItems.filter((m) => {
    if (!m.permissions.length) return true
    return hasAnyPermission(permissions, m.permissions)
  })
}
