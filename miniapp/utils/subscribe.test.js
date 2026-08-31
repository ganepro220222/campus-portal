/**
 * 活动报名订阅：需审核时一次申请两个模板，并等待授权记录落库。
 */
const assert = require('assert')

const requestPath = require.resolve('./request')
const subscribePath = require.resolve('./subscribe')
const originalRequestCache = require.cache[requestPath]
const originalSubscribeCache = require.cache[subscribePath]
const originalWx = global.wx
const originalWarn = console.warn

const templates = {
  enrollSuccess: 'tmpl-success',
  enrollApproved: 'tmpl-approved'
}
let postImpl = null
const postPayloads = []
let requestedTemplateIds = []
let subscribeResponse = {}

require.cache[requestPath] = {
  id: requestPath,
  filename: requestPath,
  loaded: true,
  exports: {
    get: async () => templates,
    post: (...args) => {
      postPayloads.push(args[1])
      return postImpl(...args)
    }
  }
}
delete require.cache[subscribePath]

global.wx = {
  requestSubscribeMessage(options) {
    requestedTemplateIds = options.tmplIds
    options.success(subscribeResponse)
  }
}
console.warn = () => {}

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve))
}

async function run() {
  const {
    requestSubscribeMany,
    buildEnrollSubscribeRequests,
    resolveTemplateRequests
  } = require('./subscribe')

  assert.deepStrictEqual(
    buildEnrollSubscribeRequests(false),
    [{ scene: 'enroll_success', templateKey: 'enrollSuccess' }]
  )
  assert.deepStrictEqual(
    buildEnrollSubscribeRequests(true),
    [
      { scene: 'enroll_success', templateKey: 'enrollSuccess' },
      { scene: 'enroll_approved', templateKey: 'enrollApproved' }
    ]
  )
  assert.deepStrictEqual(
    resolveTemplateRequests(buildEnrollSubscribeRequests(true), templates)
      .map((item) => item.templateId),
    ['tmpl-success', 'tmpl-approved']
  )

  const pendingRecords = []
  postImpl = () => new Promise((resolve) => pendingRecords.push(resolve))
  subscribeResponse = {
    'tmpl-success': 'accept',
    'tmpl-approved': 'accept'
  }
  let settled = false
  const reviewFlow = requestSubscribeMany(buildEnrollSubscribeRequests(true))
    .then((result) => {
      settled = true
      return result
    })

  await flushPromises()
  assert.deepStrictEqual(requestedTemplateIds, ['tmpl-success', 'tmpl-approved'])
  assert.deepStrictEqual(
    postPayloads.map((item) => item.scene),
    ['enroll_success', 'enroll_approved']
  )
  assert.strictEqual(settled, false, '授权记录未全部落库前不得继续提交报名')

  pendingRecords[0]()
  await flushPromises()
  assert.strictEqual(settled, false)
  pendingRecords[1]()
  const reviewResult = await reviewFlow
  assert.deepStrictEqual(reviewResult.recorded, ['enroll_success', 'enroll_approved'])

  postPayloads.length = 0
  requestedTemplateIds = []
  postImpl = () => Promise.resolve()
  subscribeResponse = {
    'tmpl-success': 'reject',
    'tmpl-approved': 'accept'
  }
  const partialResult = await requestSubscribeMany(buildEnrollSubscribeRequests(true))
  assert.deepStrictEqual(partialResult.accepted, ['enroll_approved'])
  assert.deepStrictEqual(postPayloads.map((item) => item.scene), ['enroll_approved'])

  postPayloads.length = 0
  requestedTemplateIds = []
  postImpl = () => Promise.reject(new Error('network'))
  subscribeResponse = { 'tmpl-success': 'accept' }
  const directResult = await requestSubscribeMany(buildEnrollSubscribeRequests(false))
  assert.deepStrictEqual(requestedTemplateIds, ['tmpl-success'])
  assert.deepStrictEqual(directResult.recordFailures, ['enroll_success'])
  assert.strictEqual(postPayloads.length, 1)

  console.log('[subscribe.test] PASS')
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    global.wx = originalWx
    console.warn = originalWarn
    if (originalRequestCache) require.cache[requestPath] = originalRequestCache
    else delete require.cache[requestPath]
    if (originalSubscribeCache) require.cache[subscribePath] = originalSubscribeCache
    else delete require.cache[subscribePath]
  })
