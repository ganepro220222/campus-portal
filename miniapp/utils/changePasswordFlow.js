// utils/changePasswordFlow.js — 改密页提交/401/退出竞态（纯函数，供页面与单测共用）

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

module.exports = {
  shouldApplyChangePasswordSuccess,
  changePassword401PageAction,
  canLogoutDuringChangePassword
}
