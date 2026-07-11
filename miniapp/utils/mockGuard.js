/**
 * mock 兜底守卫：prod/staging 禁止静默回退到本地假数据
 */
const { useMock } = require('../config/env')

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0
}

function isNonEmptyObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0
}

/** 列表接口：有数据用 API，否则 dev 才允许 mock */
function withListFallback(apiList, mockList) {
  if (isNonEmptyArray(apiList)) return apiList
  if (useMock) return mockList || []
  return []
}

/** 详情/对象：有数据用 API，否则 dev 才允许 mock */
function withObjectFallback(apiData, mockData) {
  if (isNonEmptyObject(apiData)) return apiData
  if (useMock) return mockData || {}
  return {}
}

/** 页面 data 初始值：dev 用 mock，staging/prod 用空结构 */
function mockOrEmpty(mockValue, emptyValue) {
  return useMock ? mockValue : emptyValue
}

module.exports = {
  useMock,
  withListFallback,
  withObjectFallback,
  mockOrEmpty
}
