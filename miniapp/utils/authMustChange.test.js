#!/usr/bin/env node
/**
 * 须改密：登录数据写入本地标记并在 handlePostLogin 时跳转改密页。
 * 运行：node miniapp/utils/authMustChange.test.js
 */
const assert = require('node:assert/strict')

const store = {}
global.wx = {
  _store: store,
  getStorageSync(key) {
    return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : ''
  },
  setStorageSync(key, value) {
    store[key] = value
  },
  removeStorageSync(key) {
    delete store[key]
  },
  reLaunch(opts) {
    global._reLaunchUrl = opts.url
    opts.complete && opts.complete()
  }
}

const auth = require('./auth')

global._reLaunchUrl = ''
const redirected = auth.handlePostLogin({ token: 't', mustChangePassword: true }, () => {
  assert.fail('onDone should not run when mustChangePassword')
})
assert.equal(redirected, true)
assert.equal(auth.isMustChangePasswordRequired(), true)
assert.equal(global._reLaunchUrl, auth.CHANGE_PASSWORD_PAGE)

Object.keys(store).forEach((k) => delete store[k])
global._reLaunchUrl = ''
let done = false
const ok = auth.handlePostLogin({ token: 't', mustChangePassword: false }, () => { done = true })
assert.equal(ok, false)
assert.equal(done, true)
assert.equal(auth.isMustChangePasswordRequired(), false)

console.log('authMustChange.test.js OK')
