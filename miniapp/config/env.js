/**
 * 小程序运行环境配置
 * 发布前请将 ENV 改为 staging / prod，并替换 baseUrl 为真实域名
 */
const ENV = 'dev' // dev | staging | prod

const configMap = {
  dev: {
    baseUrl: 'http://localhost:8080/api/v1',
    useMock: true
  },
  staging: {
    baseUrl: 'https://staging.example.edu.cn/api/v1',
    useMock: false
  },
  prod: {
    baseUrl: 'https://example.edu.cn/api/v1',
    useMock: false
  }
}

const config = configMap[ENV] || configMap.dev

/** 第三方 VR 文创展厅（720云等），留空则首页入口提示「即将上线」 */
const VR_HALL_URL = 'https://roma.720yun.com/vr/e830945711e60336/'
const VR_HALL_TITLE = '虚拟文创展厅'

module.exports = {
  ENV,
  baseUrl: config.baseUrl,
  useMock: config.useMock,
  vrHallUrl: VR_HALL_URL,
  vrHallTitle: VR_HALL_TITLE
}
