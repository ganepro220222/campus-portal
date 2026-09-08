/**
 * 小程序 AppID：与跳转页、后台保存使用同一套格式。
 */

export const MINI_PROGRAM_APPID_PATTERN = /^wx[0-9A-Fa-f]{16}$/

export const MINI_PROGRAM_APPID_REQUIRED_MESSAGE = '请填写目标小程序 AppID'
export const MINI_PROGRAM_APPID_FORMAT_MESSAGE = 'AppID 格式不正确，应为 wx 开头的 18 位小程序 AppID'
export const MINI_PROGRAM_APPID_HINT = '须为 wx 开头的 18 位字符，后 16 位只能是数字或 a–f。'

export function normalizeMiniProgramAppId(value) {
  return String(value == null ? '' : value).trim()
}

export function isMiniProgramAppIdFormat(value) {
  return MINI_PROGRAM_APPID_PATTERN.test(normalizeMiniProgramAppId(value))
}

export function validateMiniProgramAppId(value) {
  const appId = normalizeMiniProgramAppId(value)
  if (!appId) {
    return { ok: false, message: MINI_PROGRAM_APPID_REQUIRED_MESSAGE }
  }
  if (!MINI_PROGRAM_APPID_PATTERN.test(appId)) {
    return { ok: false, message: MINI_PROGRAM_APPID_FORMAT_MESSAGE }
  }
  return { ok: true, appId }
}
