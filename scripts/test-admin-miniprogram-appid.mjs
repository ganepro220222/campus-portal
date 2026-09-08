/**
 * 关联小程序 AppID 格式：后台保存与跳转页同一套规则。
 * 用法：node scripts/test-admin-miniprogram-appid.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MINI_PROGRAM_APPID_FORMAT_MESSAGE,
  MINI_PROGRAM_APPID_HINT,
  MINI_PROGRAM_APPID_REQUIRED_MESSAGE,
  normalizeMiniProgramAppId,
  validateMiniProgramAppId
} from '../admin/src/utils/miniProgramAppId.mjs'

const valid = 'wx532a624945bc7691'
assert.equal(normalizeMiniProgramAppId(` ${valid} `), valid)
assert.deepEqual(validateMiniProgramAppId(` ${valid} `), { ok: true, appId: valid })
assert.equal(validateMiniProgramAppId('wx532A624945BC7691').ok, true)

assert.equal(validateMiniProgramAppId('').ok, false)
assert.equal(validateMiniProgramAppId('   ').message, MINI_PROGRAM_APPID_REQUIRED_MESSAGE)
assert.equal(validateMiniProgramAppId('wx532a624945bc769').message, MINI_PROGRAM_APPID_FORMAT_MESSAGE)
assert.equal(validateMiniProgramAppId('wx532a624945bc7691x').ok, false)
assert.equal(validateMiniProgramAppId('wx532a624945bc769g').ok, false)
assert.equal(validateMiniProgramAppId('wx532a624945bc7691-extra').ok, false)
assert.equal(validateMiniProgramAppId('mp532a624945bc7691').ok, false)
assert.equal(validateMiniProgramAppId('通途星').ok, false)

const view = readFileSync(new URL('../admin/src/views/college/CollegeListView.vue', import.meta.url), 'utf8')
assert.match(view, /validateMiniProgramAppId/)
assert.match(view, /normalizeMiniProgramAppId/)
assert.match(view, /MINI_PROGRAM_APPID_HINT/)
assert.match(view, /form\.contentType !== 'jump'/)

const java = readFileSync(new URL('../backend/src/main/java/com/shuyuan/backend/service/AdminCollegeAppService.java', import.meta.url), 'utf8')
assert.match(java, /wx\[0-9A-Fa-f\]\{16\}/)
assert.match(java, /AppID 格式不正确，应为 wx 开头的 18 位小程序 AppID/)

const jump = readFileSync(new URL('../miniapp/utils/collegeJump.js', import.meta.url), 'utf8')
assert.match(jump, /wx\[0-9A-Fa-f\]\{16\}/)
assert.match(jump, /目标小程序 AppID 配置有误/)
assert.match(jump, /未配置目标小程序/)

assert.match(MINI_PROGRAM_APPID_HINT, /18 位/)

console.log('test-admin-miniprogram-appid OK')
