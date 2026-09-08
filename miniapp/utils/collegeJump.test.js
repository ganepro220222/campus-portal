/**
 * 关联小程序跳转校验
 * 运行：node miniapp/utils/collegeJump.test.js
 */
const assert = require('assert')
const {
  TONG_TU_XING_APPID,
  classifyMiniProgramAppId,
  isUsableMiniProgramAppId,
  isNavigateToMiniProgramCancel,
  resolveNavigateToMiniProgramFailToast,
  resolveRelatedMiniProgramJump,
  openRelatedMiniProgram
} = require('./collegeJump')

assert.strictEqual(isUsableMiniProgramAppId(''), false)
assert.strictEqual(isUsableMiniProgramAppId('wxPLACEHOLDER001'), false)
assert.strictEqual(isUsableMiniProgramAppId('wx532a624945bc7691'), true)
assert.strictEqual(isUsableMiniProgramAppId(TONG_TU_XING_APPID), true)
assert.strictEqual(isUsableMiniProgramAppId('not-an-appid'), false)
assert.strictEqual(isUsableMiniProgramAppId('wx532A624945BC7691'), true)
assert.strictEqual(isUsableMiniProgramAppId('WX532a624945bc7691'), false)
assert.strictEqual(isUsableMiniProgramAppId('wx532a624945bc769'), false)
assert.strictEqual(isUsableMiniProgramAppId('wx532a624945bc769g'), false)

assert.strictEqual(classifyMiniProgramAppId(''), 'missing')
assert.strictEqual(classifyMiniProgramAppId('wxPLACEHOLDER001'), 'missing')
assert.strictEqual(classifyMiniProgramAppId('wx532a624945bc769'), 'invalid')

assert.deepStrictEqual(resolveRelatedMiniProgramJump(null), {
  ok: false,
  reason: 'missing',
  message: '未配置目标小程序'
})
assert.deepStrictEqual(resolveRelatedMiniProgramJump({ appid: 'wxPLACEHOLDER001' }), {
  ok: false,
  reason: 'missing',
  message: '未配置目标小程序'
})
assert.deepStrictEqual(resolveRelatedMiniProgramJump({ appid: 'wx532a624945bc769' }), {
  ok: false,
  reason: 'invalid',
  message: '目标小程序 AppID 配置有误'
})

const jump = resolveRelatedMiniProgramJump({
  appid: ` ${TONG_TU_XING_APPID} `,
  path: ' pages/home/index '
})
assert.deepStrictEqual(jump, {
  ok: true,
  appId: TONG_TU_XING_APPID,
  path: 'pages/home/index'
})

const emptyPath = resolveRelatedMiniProgramJump({ appid: TONG_TU_XING_APPID })
assert.strictEqual(emptyPath.path, '')

const toasts = []
const navigations = []
const wxApi = {
  showToast(opts) { toasts.push(opts.title) },
  navigateToMiniProgram(opts) { navigations.push(opts) }
}

openRelatedMiniProgram({ appid: '' }, wxApi)
openRelatedMiniProgram({ appid: 'wx532a624945bc769' }, wxApi)
assert.deepStrictEqual(toasts, ['未配置目标小程序', '目标小程序 AppID 配置有误'])
assert.deepStrictEqual(navigations, [])

openRelatedMiniProgram({ appid: TONG_TU_XING_APPID, path: '' }, wxApi)
assert.deepStrictEqual(navigations, [{
  appId: TONG_TU_XING_APPID,
  path: '',
  fail: navigations[0].fail
}])

assert.strictEqual(isNavigateToMiniProgramCancel({ errMsg: 'navigateToMiniProgram:fail cancel' }), true)
assert.strictEqual(isNavigateToMiniProgramCancel({ errMsg: 'navigateToMiniProgram:fail:cancel' }), true)
assert.strictEqual(isNavigateToMiniProgramCancel({ errMsg: 'navigateToMiniProgram:fail appId not found' }), false)
assert.strictEqual(resolveNavigateToMiniProgramFailToast({ errMsg: 'navigateToMiniProgram:fail cancel' }), '')
assert.strictEqual(
  resolveNavigateToMiniProgramFailToast({ errMsg: 'navigateToMiniProgram:fail appId not found' }),
  '跳转失败，请确认目标小程序已发布'
)

const failToasts = []
const failApi = {
  showToast(opts) { failToasts.push(opts.title) },
  navigateToMiniProgram(opts) {
    opts.fail({ errMsg: 'navigateToMiniProgram:fail cancel' })
    opts.fail({ errMsg: 'navigateToMiniProgram:fail appId not found' })
  }
}
openRelatedMiniProgram({ appid: TONG_TU_XING_APPID, path: '' }, failApi)
assert.deepStrictEqual(failToasts, ['跳转失败，请确认目标小程序已发布'])

console.log('[collegeJump.test] PASS')
