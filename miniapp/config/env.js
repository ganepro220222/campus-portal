/**
 * 小程序运行环境配置
 * 发布前请将 ENV 改为 staging / prod，并替换 baseUrl 为真实域名
 */
const ENV = 'dev' // dev | staging | prod

const configMap = {
  dev: {
    baseUrl: 'http://localhost:8080/api/v1',
    useMock: true,
    /** H5 鉴赏页根地址（web-view 须 https；本地开发请在开发者工具勾选「不校验合法域名」） */
    craftViewerBaseUrl: 'https://shuyuan.gzcpu.edu.cn',
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
