/**
 * 关联小程序跳转校验
 * 运行：node miniapp/utils/collegeJump.test.js
 */
const assert = require('assert')
const {
  TONG_TU_XING_APPID,
  isUsableMiniProgramAppId,
  resolveRelatedMiniProgramJump,
  openRelatedMiniProgram
} = require('./collegeJump')

assert.strictEqual(isUsableMiniProgramAppId(''), false)
assert.strictEqual(isUsableMiniProgramAppId('wxPLACEHOLDER001'), false)
assert.strictEqual(isUsableMiniProgramAppId('wx532a624945bc7691'), true)
assert.strictEqual(isUsableMiniProgramAppId(TONG_TU_XING_APPID), true)
assert.strictEqual(isUsableMiniProgramAppId('not-an-appid'), false)

assert.deepStrictEqual(resolveRelatedMiniProgramJump(null), {
  ok: false,
  message: '未配置目标小程序'
})
assert.equal(resolveRelatedMiniProgramJump({ appid: 'wxPLACEHOLDER001' }).ok, false)

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
assert.deepStrictEqual(toasts, ['未配置目标小程序'])
assert.deepStrictEqual(navigations, [])

openRelatedMiniProgram({ appid: TONG_TU_XING_APPID, path: '' }, wxApi)
assert.deepStrictEqual(navigations, [{
  appId: TONG_TU_XING_APPID,
  path: '',
  fail: navigations[0].fail
}])

console.log('[collegeJump.test] PASS')
