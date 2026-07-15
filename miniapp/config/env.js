/**
 * 小程序运行环境配置
 * 发布前请将 ENV 改为 staging / prod，并替换 baseUrl 为真实域名
 */
const ENV = 'dev' // dev | staging | prod

const configMap = {
  dev: {
    baseUrl: 'http://localhost:8080/api/v1',
    useMock: true,
    /** 本地 H5 viewer（Vite :5174）；开发者工具请勾选「不校验合法域名」 */
    craftViewerBaseUrl: 'http://localhost:5174',
    craftViewerAllowedHosts: ['shuyuan.gzcpu.edu.cn', 'localhost', '127.0.0.1']
  },
  staging: {
    baseUrl: 'https://staging.example.edu.cn/api/v1',
    useMock: false,
    craftViewerBaseUrl: 'https://staging.example.edu.cn',
    craftViewerAllowedHosts: ['staging.example.edu.cn']
  },
  prod: {
    baseUrl: 'https://example.edu.cn/api/v1',
    useMock: false,
    craftViewerBaseUrl: 'https://shuyuan.gzcpu.edu.cn',
    craftViewerAllowedHosts: ['shuyuan.gzcpu.edu.cn']
  }
}

const config = configMap[ENV] || configMap.dev

module.exports = {
  ENV,
  baseUrl: config.baseUrl,
  useMock: config.useMock,
  craftViewerBaseUrl: config.craftViewerBaseUrl,
  craftViewerAllowedHosts: config.craftViewerAllowedHosts
}
