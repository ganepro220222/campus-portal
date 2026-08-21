/**
 * 活动详情页模块依赖静态检查
 * 运行：node miniapp/utils/detailPageDeps.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const detailPath = path.join(__dirname, '../packageC/activity/detail.js')
const src = fs.readFileSync(detailPath, 'utf8')

function mustInclude(snippet, message) {
  assert.ok(src.includes(snippet), message || `missing: ${snippet}`)
}

function mustNotInclude(snippet, message) {
  assert.ok(!src.includes(snippet), message || `unexpected: ${snippet}`)
}

mustInclude("require('../../utils/detailPageInit')", 'detail.js must import detailPageInit')
mustInclude('buildDetailLoadedView', 'detail.js must use buildDetailLoadedView')
mustInclude('buildDetailInitialFailurePatch', 'detail.js must use buildDetailInitialFailurePatch')
mustInclude('buildDetailRefreshFailurePatch', 'detail.js must use buildDetailRefreshFailurePatch')
mustInclude('onRetry', 'detail.js must expose onRetry')
mustInclude('onBackList', 'detail.js must expose onBackList')
mustInclude('resolveDetailOnLoad', 'detail.js must resolve missing activity id on load')
mustNotInclude('.catch(() => null)', 'detail.js must not swallow activity detail errors')

console.log('[detailPageDeps.test] PASS')
