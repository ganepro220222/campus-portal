/**
 * 我的反馈：状态、路由、失败不伪装成空
 * 运行：node miniapp/utils/feedbackMine.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  feedbackStatusLabel,
  feedbackDetailPath,
  isFeedbackNotFound,
  buildFeedbackListFailurePatch,
  buildFeedbackListLoadedPatch
} = require('./feedbackMine')

assert.strictEqual(feedbackStatusLabel('replied'), '已回复')
assert.strictEqual(feedbackStatusLabel('pending'), '待回复')
assert.strictEqual(feedbackDetailPath(7), '/packageC/feedback/detail?id=7')
assert.strictEqual(feedbackDetailPath(''), '')
assert.strictEqual(isFeedbackNotFound({ code: 404 }), true)
assert.strictEqual(isFeedbackNotFound({ code: 500 }), false)

assert.deepStrictEqual(buildFeedbackListFailurePatch(true), {
  loading: false,
  loadError: false,
  refreshError: true
})
assert.deepStrictEqual(buildFeedbackListFailurePatch(false), {
  loading: false,
  loadError: true,
  refreshError: false
})

const loaded = buildFeedbackListLoadedPatch([{ id: 1 }])
assert.deepStrictEqual(loaded.list, [{ id: 1 }])
assert.strictEqual(loaded.loadError, false)

const msgJs = fs.readFileSync(path.join(__dirname, '../../backend/src/main/java/com/shuyuan/backend/service/MessageService.java'), 'utf8')
assert.match(msgJs, /"feedback"\.equals\(relatedType\)/)
assert.match(msgJs, /\/packageC\/feedback\/detail\?id=/)

const profileJs = fs.readFileSync(path.join(__dirname, '../pages/profile/index.js'), 'utf8')
assert.match(profileJs, /\/packageC\/feedback\/list/)

const appJson = fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8')
assert.match(appJson, /feedback\/list/)
assert.match(appJson, /feedback\/detail/)

console.log('[feedbackMine.test] PASS')
