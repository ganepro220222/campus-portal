#!/usr/bin/env node
/**
 * 须改密：request 层识别 errorKey 并跳转独立改密页。
 * 运行：node miniapp/utils/memberPasswordGate.test.js
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
  showToast() {},
  reLaunch(opts) {
    global._reLaunchUrl = opts.url
    opts.complete && opts.complete()
  }
}

const request = require('./request')
const auth = require('./auth')

assert.equal(request.PASSWORD_CHANGE_REQUIRED, 'MEMBER_PASSWORD_CHANGE_REQUIRED')

global._reLaunchUrl = ''
request._handlePasswordChangeRequired({ message: '请先修改初始密码' }, true)
assert.equal(wx.getStorageSync(auth.MUST_CHANGE_PWD_KEY), true)
assert.equal(global._reLaunchUrl, auth.CHANGE_PASSWORD_PAGE)

console.log('memberPasswordGate.test.js OK')
