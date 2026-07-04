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

/**
 * 微信授权登录
 * 调用 wx.login 获取 code，发送到后端换取 token
 */
const wxLogin = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success(loginRes) {
        if (!loginRes.code) return reject(new Error('wx.login 失败'))
        const { post } = require('./request')
        post('/auth/wx-login', { code: loginRes.code })
          .then(data => {
            setToken(data.token)
            setUserInfo(data.member)
            const app = getApp()
            app.globalData.token = data.token
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

module.exports = { getToken, setToken, clearToken, setUserInfo, getUserInfo, wxLogin, requireLogin }
