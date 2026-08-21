// utils/enrollPageInit.js — 活动报名页：加载状态与视图判定

const {
  mergeActivityDetail,
  enrollStatusLabel,
  hasActiveEnroll
} = require('./activity')
const {
  assertActivityDetailRaw,
  buildActivityDetailLoadingPatch,
  buildActivityDetailFailurePatch,
  resolveActivityDetailPagePhase
} = require('./activityDetailLoad')

function buildApprovedEnrolledHint() {
  return '您已成功报名，活动当天请凭二维码或凭证码签到。'
}

function buildEnrolledHint(enrollStatus) {
  if (enrollStatus === 'pending') {
    return '您的报名正在审核中，请耐心等待。'
  }
  if (enrollStatus === 'approved') {
    return buildApprovedEnrolledHint()
  }
  return ''
}

function buildEnrollFormFromProfile(profile) {
  return {
    name: (profile && profile.realName) || '',
    phone: (profile && profile.phone) || '',
    college: (profile && profile.college) || '',
    grade: (profile && profile.grade) || ''
  }
}

function buildEnrollLoadingPatch() {
  return buildActivityDetailLoadingPatch()
}

function buildEnrollLoadedView(raw, profile, activityId) {
  assertActivityDetailRaw(raw, activityId)
  const detail = mergeActivityDetail(raw)
  if (!detail || detail.id == null) {
    const err = new Error('activity detail unavailable')
    err.kind = 'notFound'
    throw err
  }
  return {
    loading: false,
    loadError: false,
    notFound: false,
    detail,
    hasEnrolled: hasActiveEnroll(detail),
    statusLabel: enrollStatusLabel(detail.enrollStatus),
    enrolledHint: buildEnrolledHint(detail.enrollStatus),
    profileSnapshot: profile || null,
    form: buildEnrollFormFromProfile(profile)
  }
}

function buildEnrollFailurePatch(err) {
  return {
    ...buildActivityDetailFailurePatch(err),
    hasEnrolled: false,
    statusLabel: '',
    enrolledHint: '',
    profileSnapshot: null,
    showVoucherQr: false,
    voucherQrSrc: ''
  }
}

function resolveEnrollPagePhase(state) {
  return resolveActivityDetailPagePhase(state)
}

function canSubmitEnroll(state) {
  if (!state || state.submitting) return false
  if (!state.activityId) return false
  if (state.loading || state.loadError || state.notFound) return false
  if (!state.detail || state.detail.id == null) return false
  if (String(state.detail.id) !== String(state.activityId)) return false
  return true
}

module.exports = {
  buildApprovedEnrolledHint,
  buildEnrolledHint,
  buildEnrollFormFromProfile,
  assertActivityDetailRaw,
  buildEnrollLoadingPatch,
  buildEnrollLoadedView,
  buildEnrollFailurePatch,
  resolveEnrollPagePhase,
  canSubmitEnroll
}
