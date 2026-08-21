// utils/enrollPageInit.js — 活动报名页：加载状态与视图判定

const {
  mergeActivityDetail,
  enrollStatusLabel,
  hasActiveEnroll
} = require('./activity')

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

function classifyActivityLoadError(err) {
  const code = err && (err.code != null ? err.code : err.statusCode)
  if (code === 404) return 'notFound'
  if (err && err.kind === 'notFound') return 'notFound'
  return 'loadError'
}

function assertActivityDetailRaw(raw, activityId) {
  if (!raw || raw.id == null) {
    const err = new Error('activity detail unavailable')
    err.kind = 'notFound'
    throw err
  }
  if (String(raw.id) !== String(activityId)) {
    const err = new Error('activity id mismatch')
    err.kind = 'notFound'
    throw err
  }
}

function buildEnrollLoadingPatch() {
  return {
    loading: true,
    loadError: false,
    notFound: false,
    detail: null
  }
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
  const kind = classifyActivityLoadError(err)
  return {
    loading: false,
    detail: null,
    loadError: kind === 'loadError',
    notFound: kind === 'notFound',
    hasEnrolled: false,
    statusLabel: '',
    enrolledHint: '',
    profileSnapshot: null,
    showVoucherQr: false,
    voucherQrSrc: ''
  }
}

function resolveEnrollPagePhase(state) {
  if (state.loading) return 'loading'
  if (state.loadError) return 'loadError'
  if (state.notFound) return 'notFound'
  if (state.detail && state.detail.id != null) return 'content'
  return 'notFound'
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
  classifyActivityLoadError,
  assertActivityDetailRaw,
  buildEnrollLoadingPatch,
  buildEnrollLoadedView,
  buildEnrollFailurePatch,
  resolveEnrollPagePhase,
  canSubmitEnroll
}
