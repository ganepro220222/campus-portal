/**
 * 小程序运行环境配置
 * 发布前请将 ENV 改为 staging / prod，并替换 baseUrl 为真实域名
 */
const ENV = 'staging' // dev | staging | prod — 真机调试连 staging 时用 staging；提交前改回 dev

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
