/**
 * 小程序运行环境配置
 * dev：本机 Docker；staging：预发联调；prod：正式域名配好后再改。
 */
const ENV = 'staging' // 当前预发联调，不是本机 Docker

const configMap = {
  dev: {
    baseUrl: 'http://localhost:8080/api/v1',
    useMock: true
  },
  staging: {
    baseUrl: 'https://api.yunmanvr.com/api/v1',
    useMock: false
  },
  prod: {
    baseUrl: 'https://example.edu.cn/api/v1',
    useMock: false
  }
}

const config = configMap[ENV] || configMap.dev

module.exports = {
  ENV,
  baseUrl: config.baseUrl,
  useMock: config.useMock
}
