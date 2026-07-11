import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, changePassword as changePasswordApi } from '@/api/auth'
import type { AdminLoginData } from '@/types/api'
import { hasPermission } from '@/utils/permission'

const TOKEN_KEY = 'shuyuan_admin_token'
const PROFILE_KEY = 'shuyuan_admin_profile'

export interface AdminProfile {
  adminId: number
  username: string
  realName: string
  roleId: number
  roleName: string
  permissions: string[]
  mustChangePassword: boolean
}

/** 管理员登录态 */
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const profile = ref<AdminProfile | null>(loadProfile())

  const isLoggedIn = computed(() => !!token.value)
  const displayName = computed(() => profile.value?.realName || profile.value?.username || '管理员')
  const mustChangePassword = computed(() => !!profile.value?.mustChangePassword)

  function loadProfile(): AdminProfile | null {
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as AdminProfile
      return { ...parsed, mustChangePassword: !!parsed.mustChangePassword }
    } catch {
      return null
    }
  }

  function persist() {
    if (token.value) {
      localStorage.setItem(TOKEN_KEY, token.value)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    if (profile.value) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile.value))
    } else {
      localStorage.removeItem(PROFILE_KEY)
    }
  }

  function applyLogin(data: AdminLoginData) {
    token.value = data.token
    profile.value = {
      adminId: data.adminId,
      username: data.username,
      realName: data.realName,
      roleId: data.roleId,
      roleName: data.roleName,
      permissions: data.permissions || [],
      mustChangePassword: !!data.mustChangePassword
    }
    persist()
  }

  async function login(username: string, password: string) {
    const data = await loginApi(username, password)
    applyLogin(data)
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    const data = await changePasswordApi(oldPassword, newPassword)
    applyLogin(data)
  }

  function logout() {
    token.value = ''
    profile.value = null
    persist()
  }

  function can(permission: string) {
    return hasPermission(profile.value?.permissions || [], permission)
  }

  return {
    token,
    profile,
    isLoggedIn,
    displayName,
    mustChangePassword,
    login,
    changePassword,
    applyLogin,
    logout,
    can
  }
})
