// utils/request.js — 统一 HTTP 请求封装

const app = getApp()

/*
 * 核心请求函数
 * 参数 url    接口路径（不含 baseUrl 前缀）
 * 参数 method HTTP 方法，默认 GET
 * 参数 data   请求体或查询参数对象
 */
const request = (url, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    const token = app.globalData.token || wx.getStorageSync('token') || ''

    wx.request({
      url: app.globalData.baseUrl + url,
      method,
      data,
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
          // token 失效，跳登录
          app.logout()
          return reject(body)
        }
        wx.showToast({ title: body.message || '请求失败', icon: 'none' })
        reject(body)
      },
      fail(err) {
        wx.showToast({ title: '网络异常，请检查连接', icon: 'none' })
        reject(err)
      }
    })
  })
}

/*
 * 上传文件到后端（后端再转存对象存储）
 * 大文件建议使用服务端签名 + 小程序直传的方式，避免流量经过应用服务器
 */
const upload = (url, filePath, name = 'file', formData = {}) => {
  return new Promise((resolve, reject) => {
    const token = app.globalData.token || wx.getStorageSync('token') || ''
    wx.uploadFile({
      url: app.globalData.baseUrl + url,
      filePath,
      name,
      formData,
      header: { 'Authorization': token ? `Bearer ${token}` : '' },
      success(res) {
        const body = JSON.parse(res.data)
        if (body.code === 200) return resolve(body.data)
        reject(body)
      },
      fail: reject
    })
  })
}

module.exports = {
  get:    (url, data)        => request(url, 'GET', data),
  post:   (url, data)        => request(url, 'POST', data),
  put:    (url, data)        => request(url, 'PUT', data),
  del:    (url)              => request(url, 'DELETE'),
  upload: (url, fp, name, fd) => upload(url, fp, name, fd)
}
