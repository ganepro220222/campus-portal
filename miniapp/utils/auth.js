// utils/auth.js — token 与登录状态管理

const TOKEN_KEY = 'token'
const USER_KEY  = 'userInfo'

/** 获取本地 token */
const getToken = () => wx.getStorageSync(TOKEN_KEY) || ''

/** 保存 token */
const setToken = (token) => wx.setStorageSync(TOKEN_KEY, token)

/** 清除 token */
const clearToken = () => {
  wx.removeStorageSync(TOKEN_KEY)
  wx.removeStorageSync(USER_KEY)
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

function applyLoginData(data) {
  if (data && data.token) {
    setToken(data.token)
    setUserInfo(data.member)
    const app = getApp()
    app.globalData.token = data.token
  }
}

/** 登录成功后：若须改密由当前页切换模式（不跳转新页面） */
function handlePostLogin(data, onDone) {
  if (data && data.mustChangePassword) {
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
  applyLoginData, handlePostLogin
}
