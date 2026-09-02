/**
 * 小程序运行环境配置
 * dev：本地 Docker；staging：真机联调；prod：正式发布（须先配置正式域名并跑 release 门禁）。
 */
const ENV = 'staging' // dev | staging | prod — 当前提交值用于真机联调，不代表本地 Docker 默认值

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
