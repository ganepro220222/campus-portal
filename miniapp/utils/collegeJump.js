// utils/collegeJump.js — 关联小程序跳转：校验 AppID 后再调用微信接口

const TONG_TU_XING_APPID = 'wx532a624945bc7691'

function isUsableMiniProgramAppId(appid) {
  const id = String(appid || '').trim()
  if (!id || id.includes('PLACEHOLDER')) return false
  return /^wx[0-9a-f]{16}$/i.test(id)
}

function resolveRelatedMiniProgramJump(item) {
  if (!item || !isUsableMiniProgramAppId(item.appid)) {
    return { ok: false, message: '未配置目标小程序' }
  }
  return {
    ok: true,
    appId: String(item.appid).trim(),
    path: String(item.path || '').trim()
  }
}

function openRelatedMiniProgram(item, wxApi) {
  const api = wxApi || (typeof wx !== 'undefined' ? wx : null)
  const jump = resolveRelatedMiniProgramJump(item)
  if (!jump.ok) {
    if (api && api.showToast) {
      api.showToast({ title: jump.message, icon: 'none' })
    }
    return jump
  }
  api.navigateToMiniProgram({
    appId: jump.appId,
    path: jump.path,
    fail: () => api.showToast({
      title: '跳转失败，请确认目标小程序已发布',
      icon: 'none',
      duration: 3000
    })
  })
  return jump
}

module.exports = {
  TONG_TU_XING_APPID,
  isUsableMiniProgramAppId,
  resolveRelatedMiniProgramJump,
  openRelatedMiniProgram
}
