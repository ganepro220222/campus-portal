/**
 * 小程序运行环境配置。
 * 发布前将 ENV 改为 prod，并把 baseUrl 换成正式域名。
 */
const ENV = 'prod' // dev | staging | prod

const configMap = {
  dev: {
    baseUrl: 'http://localhost:8080/api/v1',
    useMock: true
  },
  staging: {
    baseUrl: 'https://staging.YOUR_DOMAIN.edu.cn/api/v1',
    useMock: false
  },
  prod: {
    baseUrl: 'https://api.YOUR_DOMAIN.edu.cn/api/v1',
    useMock: false
  }
}

const config = configMap[ENV] || configMap.prod

module.exports = {
  ENV,
  baseUrl: config.baseUrl,
  useMock: config.useMock
}
