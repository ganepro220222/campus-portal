// utils/auth.js — token 与登录状态管理

const TOKEN_KEY = 'token'
const USER_KEY  = 'userInfo'
const MUST_CHANGE_PWD_KEY = 'mustChangePassword'

/** 获取本地 token */
const getToken = () => wx.getStorageSync(TOKEN_KEY) || ''

/** 保存 token */
const setToken = (token) => wx.setStorageSync(TOKEN_KEY, token)

/** 清除 token */
const clearToken = () => {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(USER_KEY)
  clearMustChangePasswordFlag()
}

/** 保存用户信息 */
const setUserInfo = (info) => {
  const app = getApp()
  app.globalData.userInfo = info
  wx.setStorageSync(USER_KEY, info)
}

/** 获取用户信息 */
const getUserInfo = () => {
  const app = getApp()
  return app.globalData.userInfo || wx.getStorageSync(USER_KEY) || null
}

function setMustChangePasswordFlag(required) {
  wx.setStorageSync(MUST_CHANGE_PWD_KEY, required === true)
}

function clearMustChangePasswordFlag() {
  wx.removeStorageSync(MUST_CHANGE_PWD_KEY)
}

function isMustChangePasswordRequired() {
  return wx.getStorageSync(MUST_CHANGE_PWD_KEY) === true
}

const CHANGE_PASSWORD_PAGE = '/pages/change-password/index'
let redirectingToChangePassword = false

function redirectToChangePassword() {
  if (redirectingToChangePassword) return
  if (typeof getCurrentPages === 'function') {
    const pages = getCurrentPages()
    const current = pages.length ? pages[pages.length - 1].route : ''
    if (current === 'pages/change-password/index') return
  }
  redirectingToChangePassword = true
  wx.reLaunch({
    url: CHANGE_PASSWORD_PAGE,
    complete() {
      redirectingToChangePassword = false
    }
  })
}

function applyLoginData(data) {
  if (data && data.token) {
    setToken(data.token)
    setUserInfo(data.member)
    const app = getApp()
    app.globalData.token = data.token
  }
  if (data && data.mustChangePassword) {
    setMustChangePasswordFlag(true)
  } else if (data && data.token) {
    clearMustChangePasswordFlag()
  }
}

/** 登录成功后：若须改密由调用方跳转独立改密页 */
function handlePostLogin(data, onDone) {
  if (data && data.mustChangePassword) {
    setMustChangePasswordFlag(true)
    redirectToChangePassword()
    return true
  }
  onDone && onDone()
  return false
}

/**
 * 微信授权登录；若 needBind 为 true，返回数据供页面引导绑定学号
 */
const wxLogin = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success(loginRes) {
        if (!loginRes.code) return reject(new Error('wx.login 失败'))
        const { post } = require('./request')
        post('/auth/wx-login', { code: loginRes.code })
          .then(data => {
            if (data && data.needBind) {
              resolve(data)
              return
            }
            applyLoginData(data)
            resolve(data)
          })
          .catch(reject)
      },
      fail: reject
    })
  })
}

/** 微信首次登录绑定学号 */
const bindWxAccount = (wxBindToken, studentNo, password) => {
  const { post } = require('./request')
  return post('/auth/wx-bind', { wxBindToken, studentNo, password }).then(data => {
    applyLoginData(data)
    return data
  })
}

/** 已登录用户补充绑定微信 */
const bindWxAuthenticated = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success(loginRes) {
        if (!loginRes.code) return reject(new Error('wx.login 失败'))
        const { post } = require('./request')
        post('/auth/wx-bind-authenticated', { code: loginRes.code })
          .then(data => {
            applyLoginData(data)
            resolve(data)
          })
          .catch(reject)
      },
      fail: reject
    })
  })
}

/**
 * 需要登录时的守卫
 * 未登录则弹窗引导跳转登录页，已登录执行回调
 */
const requireLogin = (callback) => {
  if (isMustChangePasswordRequired()) {
    redirectToChangePassword()
    return
  }
  const token = getToken()
  if (token) {
    callback && callback()
    return
  }
  wx.showModal({
    title: '请先登录',
    content: '该功能需要登录后使用',
    confirmText: '去登录',
    success(res) {
      if (res.confirm) {
        wx.navigateTo({ url: '/pages/login/index' })
      }
    }
  })
}

module.exports = {
  getToken, setToken, clearToken, setUserInfo, getUserInfo,
  wxLogin, bindWxAccount, bindWxAuthenticated, requireLogin,
  applyLoginData, handlePostLogin,
  setMustChangePasswordFlag, clearMustChangePasswordFlag,
  isMustChangePasswordRequired, redirectToChangePassword,
  MUST_CHANGE_PWD_KEY, CHANGE_PASSWORD_PAGE
}
