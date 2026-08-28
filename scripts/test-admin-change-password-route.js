#!/usr/bin/env node
/**
 * 管理后台强制改密路由状态机单测（防 Login ↔ Dashboard 死循环回归）
 *
 * 用法：node scripts/test-admin-change-password-route.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')

// 与 admin/src/router/guard.ts 保持同一算法（guard 为 TS，此处纯 JS 单测）
function resolveAdminRouteRedirect(to, auth) {
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

const pub = { meta: { public: true } }
const priv = { meta: {} }

assert.deepStrictEqual(
  resolveAdminRouteRedirect({ name: 'Dashboard', ...priv }, { isLoggedIn: false, mustChangePassword: false }),
  { name: 'Login' },
)
assert.deepStrictEqual(
  resolveAdminRouteRedirect({ name: 'Login', ...pub }, { isLoggedIn: true, mustChangePassword: false }),
  { name: 'Dashboard' },
)
assert.deepStrictEqual(
  resolveAdminRouteRedirect({ name: 'Dashboard', ...priv }, { isLoggedIn: true, mustChangePassword: true }),
  { name: 'AdminChangePassword' },
)
assert.deepStrictEqual(
  resolveAdminRouteRedirect({ name: 'Login', ...pub }, { isLoggedIn: true, mustChangePassword: true }),
  { name: 'AdminChangePassword' },
)
assert.strictEqual(
  resolveAdminRouteRedirect({ name: 'AdminChangePassword', ...priv }, { isLoggedIn: true, mustChangePassword: true }),
  true,
)
assert.deepStrictEqual(
  resolveAdminRouteRedirect({ name: 'AdminChangePassword', ...priv }, { isLoggedIn: true, mustChangePassword: false }),
  { name: 'Dashboard' },
)

// 源码接线：router 须用 guard，request 须跳 AdminChangePassword
const routerSrc = fs.readFileSync(path.join(root, 'admin/src/router/index.ts'), 'utf8')
const requestSrc = fs.readFileSync(path.join(root, 'admin/src/api/request.ts'), 'utf8')
assert.match(routerSrc, /resolveAdminRouteRedirect/)
assert.match(routerSrc, /name: 'AdminChangePassword'/)
assert.doesNotMatch(routerSrc, /mustChangePassword && to\.name !== 'Login'/)
assert.match(requestSrc, /name: 'AdminChangePassword'/)
assert.doesNotMatch(requestSrc, /ADMIN_PASSWORD_CHANGE_REQUIRED[\s\S]*name: 'Login'/)

console.log('test-admin-change-password-route OK')
