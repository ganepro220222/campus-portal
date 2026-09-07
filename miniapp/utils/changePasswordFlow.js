// utils/changePasswordFlow.js — 改密提交与 401、退出竞态

function shouldApplyChangePasswordSuccess(seq, submitSeq) {
  return seq === submitSeq
}

function changePassword401PageAction(err, requestAlreadyLoggedOut) {
  if (!err || err.code !== 401) {
    return { toast: '', callLogout: false }
  }
  return {
    toast: '登录已失效，请重新登录',
    callLogout: !requestAlreadyLoggedOut
  }
}

function canLogoutDuringChangePassword(loading) {
  return !loading
}

function resolveChangePasswordMode(queryMode, mustChangeRequired) {
  if (mustChangeRequired && queryMode === 'voluntary') {
    return 'forced'
  }
  if (queryMode === 'wx' || queryMode === 'voluntary' || queryMode === 'forced') {
    return queryMode
  }
  return mustChangeRequired ? 'forced' : 'voluntary'
}

function needsOldPassword(mode) {
  return mode === 'voluntary'
}

function requiresLoginForChangePasswordPage(mode) {
  return mode !== 'wx'
}

function changePasswordPageCopy(mode) {
  if (mode === 'wx') {
    return {
      title: '设置新密码',
      subtitle: '将通过微信验证你的身份。若该微信尚未绑定学号，请联系学院管理员重置。'
    }
  }
  if (mode === 'voluntary') {
    return {
      title: '修改密码',
      subtitle: '请输入当前密码，并设置新密码'
    }
  }
  return {
    title: '请设置新密码',
    subtitle: '为保障账号安全，须设置新密码后才能继续使用'
  }
}

function buildChangePasswordPayload({ mode, oldPassword, newPassword, wxCode }) {
  const body = { newPassword }
  if (mode === 'voluntary') body.oldPassword = oldPassword
  if (mode === 'wx') body.wxCode = wxCode
  return body
}

function validateNewPasswordPair(newPassword, confirmPassword) {
  if (!newPassword) return '请输入新密码'
  if (newPassword.length < 8) return '新密码至少8位'
  if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    return '新密码须含字母和数字'
  }
  if (newPassword !== confirmPassword) return '两次输入不一致'
  return ''
}

module.exports = {
  shouldApplyChangePasswordSuccess,
  changePassword401PageAction,
  canLogoutDuringChangePassword,
  resolveChangePasswordMode,
  needsOldPassword,
  requiresLoginForChangePasswordPage,
  changePasswordPageCopy,
  buildChangePasswordPayload,
  validateNewPasswordPair
}
