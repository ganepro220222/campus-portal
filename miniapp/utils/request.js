// utils/request.js — 统一 HTTP 请求封装

const { baseUrl: configBaseUrl } = require('../config/env')

const PASSWORD_CHANGE_REQUIRED = 'MEMBER_PASSWORD_CHANGE_REQUIRED'

function getRuntimeApp() {
  try {
    return getApp()
  } catch (e) {
    return null
  }
}

function resolveBaseUrl() {
  const app = getRuntimeApp()
  if (app && app.globalData && app.globalData.baseUrl) {
    return app.globalData.baseUrl
  }
  return configBaseUrl
}

function resolveToken() {
  const app = getRuntimeApp()
  if (app && app.globalData && app.globalData.token) {
    return app.globalData.token
  }
  return wx.getStorageSync('token') || ''
}

function authPath(url) {
  return String(url).split('?')[0]
}

function logoutIfNeeded(url) {
  const path = authPath(url)
  // 公开登录接口的 401 是「账号密码错」，不是 session 过期，不能清 token
  const credentialOnly = [
    '/auth/account-login',
    '/auth/wx-login',
    '/auth/wx-bind',
  ]
  if (credentialOnly.includes(path)) return
  const app = getRuntimeApp()
  if (app && typeof app.logout === 'function') {
    app.logout()
  }
}

/*
 * 默认超时。绝大多数接口是一次查库，10 秒绰绰有余。
 * 但 AI 问答要先检索知识库再等大模型生成，10 秒经常不够——超时的时候服务端多半已经
 * 成功、答案也写进库了，用户却看到失败还被扣掉一次次数。这类接口需要单独放宽，
 * 所以这里允许按次覆盖，而不是把默认值整体调大（调大会让普通接口的卡顿被拖长）。
 */
const DEFAULT_TIMEOUT = 10000

function resolveTimeout(options) {
  const custom = options && options.timeout
  return typeof custom === 'number' && custom > 0 ? custom : DEFAULT_TIMEOUT
}

function handlePasswordChangeRequired(body, silent) {
  const { redirectToChangePassword, setMustChangePasswordFlag } = require('./auth')
  setMustChangePasswordFlag(true)
  if (!silent) {
    wx.showToast({ title: body.message || '请先修改初始密码', icon: 'none', duration: 2500 })
  }
  redirectToChangePassword()
}

/*
 * 核心请求函数
 * 参数 url    接口路径（不含 baseUrl 前缀）
 * 参数 method HTTP 方法，默认 GET
 * 参数 data   请求体或查询参数对象
 * 参数 options { silent, timeout }
 */
const request = (url, method = 'GET', data = {}, options = {}) => {
  const silent = options.silent === true
  return new Promise((resolve, reject) => {
    const token = resolveToken()

    wx.request({
      url: resolveBaseUrl() + url,
      method,
      data,
      timeout: resolveTimeout(options),
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? ('Bearer ' + token) : ''
      },
      success(res) {
        const body = res.data
        if (body.code === 200) {
          resolve(body.data)
          return
        }
        if (body.code === 401) {
          logoutIfNeeded(url)
          if (!silent) {
            wx.showToast({ title: body.message || '请先登录', icon: 'none', duration: 2500 })
          }
          return reject(body)
        }
        if (body.code === 403 && body.errorKey === PASSWORD_CHANGE_REQUIRED) {
          handlePasswordChangeRequired(body, silent)
          return reject(body)
        }
        const duration = body.code === 429 ? 3500 : 2500
        if (!silent) {
          wx.showToast({ title: body.message || '请求失败', icon: 'none', duration })
        }
        reject(body)
      },
      fail(err) {
        if (!silent) {
          wx.showToast({ title: '网络异常，请检查连接', icon: 'none' })
        }
        reject(err)
      }
    })
  })
}

/*
 * 上传文件到后端（后端再转存对象存储）
 * 大文件建议使用服务端签名 + 小程序直传的方式，避免流量经过应用服务器
 */
const { parseUploadFileResponse } = require('./uploadResponse')

const upload = (url, filePath, name = 'file', formData = {}, options = {}) => {
  const silent = options.silent === true
  return new Promise((resolve, reject) => {
    const token = resolveToken()
    wx.uploadFile({
      url: resolveBaseUrl() + url,
      filePath,
      name,
      formData,
      timeout: 60000,
      header: { 'Authorization': token ? `Bearer ${token}` : '' },
      success(res) {
        const parsed = parseUploadFileResponse(res)
        if (parsed.ok) {
          resolve(parsed.data)
          return
        }
        if (parsed.unauthorized) {
          logoutIfNeeded(url)
          if (!silent) {
            wx.showToast({
              title: (parsed.error && parsed.error.message) || '请先登录',
              icon: 'none',
              duration: 2500
            })
          }
          reject(parsed.error)
          return
        }
        const message = (parsed.error && parsed.error.message) || '上传失败'
        if (!silent) {
          wx.showToast({ title: message, icon: 'none', duration: 2500 })
        }
        reject(parsed.error)
      },
      fail(err) {
        if (!silent) {
          wx.showToast({ title: '网络异常，请检查连接', icon: 'none' })
        }
        reject(err)
      }
    })
  })
}

module.exports = {
  get:    (url, data, options) => request(url, 'GET', data, options),
  post:   (url, data, options) => request(url, 'POST', data, options),
  put:    (url, data, options) => request(url, 'PUT', data, options),
  del:    (url, options)       => request(url, 'DELETE', {}, options),
  upload: (url, fp, name, fd, options) => upload(url, fp, name, fd, options),
  // 供单测校验：不在模块顶层缓存 getApp()
  _getRuntimeApp: getRuntimeApp,
  _resolveBaseUrl: resolveBaseUrl,
  _resolveToken: resolveToken,
  _resolveTimeout: resolveTimeout,
  _logoutIfNeeded: logoutIfNeeded,
  DEFAULT_TIMEOUT,
  PASSWORD_CHANGE_REQUIRED,
  _handlePasswordChangeRequired: handlePasswordChangeRequired
}
