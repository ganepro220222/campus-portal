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

/** 去掉 undefined/null，避免 GET 被序列化成 category=undefined 这种假分类名 */
function sanitizeRequestData(data) {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return data
  const out = {}
  for (const key of Object.keys(data)) {
    if (data[key] !== undefined && data[key] !== null) out[key] = data[key]
  }
  return out
}

/** GET/HEAD/DELETE 走 query，必须清洗；POST/PUT 保留显式 null（表示清空字段） */
function isQueryMethod(method) {
  const m = String(method || 'GET').toUpperCase()
  return m === 'GET' || m === 'HEAD' || m === 'DELETE'
}

function resolveRequestData(method, data) {
  return isQueryMethod(method) ? sanitizeRequestData(data) : data
}

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
      data: resolveRequestData(method, data),
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

/**
 * GET 单个二进制分块。只接受 206，避免旧后端把整个文件按 200 返回后再次塞满 JS 内存。
 */
const getArrayBufferChunk = (url, data, options = {}) => {
  const silent = options.silent === true
  return new Promise((resolve, reject) => {
    const token = resolveToken()
    wx.request({
      url: resolveBaseUrl() + url,
      method: 'GET',
      data: sanitizeRequestData(data || {}),
      responseType: 'arraybuffer',
      timeout: resolveTimeout({ timeout: options.timeout || 180000 }),
      header: { Authorization: token ? ('Bearer ' + token) : '' },
      success(res) {
        if (res.statusCode === 206 && res.data) {
          resolve({
            data: res.data,
            header: res.header || {},
            statusCode: res.statusCode
          })
          return
        }
        if (res.statusCode === 401) {
          logoutIfNeeded(url)
          if (!silent) {
            wx.showToast({ title: '请先登录', icon: 'none', duration: 2500 })
          }
        } else if (!silent) {
          wx.showToast({ title: '文件分块下载失败', icon: 'none' })
        }
        const error = new Error(`chunk-download-failed:${res.statusCode || 0}`)
        error.statusCode = res.statusCode
        reject(error)
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

/**
 * 从后端签发的绝对 URL 读取一个 Range 分块。
 * 只接受 206，防止源站忽略 Range 后把整个大文件装进小程序 JS 内存。
 */
const getUrlArrayBufferChunk = (url, offset, size, options = {}) => {
  const sourceUrl = String(url || '')
  const start = Number(offset)
  const length = Number(size)
  if (!/^https:\/\//i.test(sourceUrl)
      || !Number.isSafeInteger(start) || start < 0
      || !Number.isSafeInteger(length) || length <= 0) {
    return Promise.reject(new Error('source-chunk-range-invalid'))
  }

  const silent = options.silent === true
  return new Promise((resolve, reject) => {
    wx.request({
      url: sourceUrl,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: resolveTimeout({ timeout: options.timeout || 180000 }),
      header: { Range: `bytes=${start}-${start + length - 1}` },
      success(res) {
        if (res.statusCode === 206 && res.data) {
          resolve({
            data: res.data,
            header: res.header || {},
            statusCode: res.statusCode
          })
          return
        }
        if (!silent) {
          wx.showToast({ title: '文件加速下载失败', icon: 'none' })
        }
        const error = new Error(`source-chunk-download-failed:${res.statusCode || 0}`)
        error.statusCode = res.statusCode
        reject(error)
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
  getArrayBufferChunk,
  getUrlArrayBufferChunk,
  // 供单测校验：不在模块顶层缓存 getApp()
  _getRuntimeApp: getRuntimeApp,
  _resolveBaseUrl: resolveBaseUrl,
  _resolveToken: resolveToken,
  _resolveTimeout: resolveTimeout,
  _logoutIfNeeded: logoutIfNeeded,
  DEFAULT_TIMEOUT,
  PASSWORD_CHANGE_REQUIRED,
  _handlePasswordChangeRequired: handlePasswordChangeRequired,
  _sanitizeRequestData: sanitizeRequestData,
  _resolveRequestData: resolveRequestData,
  _isQueryMethod: isQueryMethod
}
