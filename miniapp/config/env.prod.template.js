/**
 * 小程序生产环境配置模板
 * 发布前：复制为 env.js，将 ENV 改为 prod 并替换 baseUrl
 */
const ENV = 'prod' // dev | staging | prod

const configMap = {
  dev: {
    baseUrl: 'http://localhost:8080/api/v1',
    useMock: true,
    craftViewerBaseUrl: 'https://shuyuan.gzcpu.edu.cn',
    craftViewerAllowedHosts: ['shuyuan.gzcpu.edu.cn']
  },
  staging: {
    baseUrl: 'https://staging.YOUR_DOMAIN.edu.cn/api/v1',
    useMock: false,
    craftViewerBaseUrl: 'https://staging.YOUR_DOMAIN.edu.cn',
    craftViewerAllowedHosts: ['staging.YOUR_DOMAIN.edu.cn']
  },
  prod: {
    baseUrl: 'https://api.YOUR_DOMAIN.edu.cn/api/v1',
    useMock: false,
    craftViewerBaseUrl: 'https://shuyuan.gzcpu.edu.cn',
    craftViewerAllowedHosts: ['shuyuan.gzcpu.edu.cn']
  }
}

const config = configMap[ENV] || configMap.prod

module.exports = {
  ENV,
  baseUrl: config.baseUrl,
  useMock: config.useMock,
  craftViewerBaseUrl: config.craftViewerBaseUrl,
  craftViewerAllowedHosts: config.craftViewerAllowedHosts
}
