/** 管理后台路由守卫纯函数（可单测，避免 Login ↔ Dashboard 改密死循环） */

export interface RouteGuardTarget {
  name?: string | symbol | null
  meta: { public?: boolean }
}

export interface RouteGuardAuth {
  isLoggedIn: boolean
  mustChangePassword: boolean
}

export type RouteGuardDecision = true | { name: 'Login' | 'Dashboard' | 'AdminChangePassword' }

export function resolveAdminRouteRedirect(
  to: RouteGuardTarget,
  auth: RouteGuardAuth,
): RouteGuardDecision {
  if (!auth.isLoggedIn) {
    if (to.meta.public) return true
    return { name: 'Login' }
  }
  if (auth.mustChangePassword) {
    if (to.name === 'AdminChangePassword') return true
    return { name: 'AdminChangePassword' }
  }
  if (to.meta.public) {
    if (to.name === 'Login') return { name: 'Dashboard' }
    return true
  }
  if (to.name === 'AdminChangePassword') return { name: 'Dashboard' }
  return true
}
