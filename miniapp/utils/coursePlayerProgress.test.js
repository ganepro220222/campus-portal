#!/usr/bin/env node
const assert = require('assert')
const {
  resolveEndedReport,
  shouldReportByInterval,
  isSeekBackward,
  normalizeSeekCompletePosition,
  getCoursePlayerPlatform,
  resolveVideoResumePosition,
  resolvePlayerStage,
  canFetchCourseAfterAuth,
  courseAuthBlockedPatch,
  resolveResumeInitialTime,
  coerceVttText,
  parseVttTime,
  withVideoReloadNonce,
  isVttHttpSuccess,
  looksLikeVtt,
  isVideoPlaybackStable,
  shouldGiveUpVideoReload,
  settlePromise,
  formatResumeClock,
  resolvePlayerProgressStatusText,
  buildProgressResponsePatch,
  shouldRecoverProgressFromReport,
  shouldNotifyProgressCompletion,
  buildPlayerProgressView,
  shouldAutoSeekOnProgressRetry,
  resolveProgressRetryAction
} = require('./coursePlayerProgress')

{
  const r = resolveEndedReport({ detailDuration: 0, cachedDuration: 600, cachedPosition: 580 })
  assert.strictEqual(r.total, 600)
  assert.strictEqual(r.position, 600)
}

{
  const r = resolveEndedReport({ detailDuration: 90, cachedDuration: 600, cachedPosition: 80 })
  assert.strictEqual(r.total, 90)
  assert.strictEqual(r.position, 90)
}

assert.strictEqual(shouldReportByInterval(20, 0), true)
assert.strictEqual(shouldReportByInterval(19, 0), false)
assert.strictEqual(shouldReportByInterval(20, 480), false)

assert.strictEqual(isSeekBackward(0, 480), true)
assert.strictEqual(isSeekBackward(478, 480), false)
assert.strictEqual(isSeekBackward(100, 480), true)

assert.strictEqual(normalizeSeekCompletePosition(12500, 'android'), 12.5)
assert.strictEqual(normalizeSeekCompletePosition(12500, 'AnDrOiD'), 12.5)
assert.strictEqual(normalizeSeekCompletePosition(12.5, 'ios'), 12.5)
assert.strictEqual(normalizeSeekCompletePosition(12.5, 'devtools'), 12.5)
assert.strictEqual(normalizeSeekCompletePosition(12.5, 'unknown'), 12.5)
assert.strictEqual(normalizeSeekCompletePosition(12.5), 12.5)
assert.strictEqual(normalizeSeekCompletePosition(undefined, 'android'), null)
assert.strictEqual(normalizeSeekCompletePosition(NaN, 'android'), null)
assert.strictEqual(normalizeSeekCompletePosition(Infinity, 'android'), null)
assert.strictEqual(normalizeSeekCompletePosition(-1, 'android'), null)
assert.strictEqual(normalizeSeekCompletePosition('12.5', 'android'), null)
assert.strictEqual(normalizeSeekCompletePosition(Symbol('invalid'), 'android'), null)

assert.strictEqual(getCoursePlayerPlatform({
  getDeviceInfo: () => ({ platform: 'android' }),
  getSystemInfoSync: () => ({ platform: 'ios' })
}), 'android')
assert.strictEqual(getCoursePlayerPlatform({
  getSystemInfoSync: () => ({ platform: 'devtools' })
}), 'devtools')
assert.strictEqual(getCoursePlayerPlatform({
  getDeviceInfo: () => { throw new Error('unsupported') },
  getSystemInfoSync: () => ({ platform: 'ios' })
}), 'ios')
assert.strictEqual(getCoursePlayerPlatform({
  getDeviceInfo: () => ({}),
  getSystemInfoSync: () => ({ platform: 'android' })
}), 'android')
assert.strictEqual(getCoursePlayerPlatform({
  getDeviceInfo: () => { throw new Error('unsupported') },
  getSystemInfoSync: () => { throw new Error('unsupported') }
}), '')

assert.strictEqual(
  withVideoReloadNonce('https://cdn.yunmanvr.com/videos/a.mp4', 99),
  'https://cdn.yunmanvr.com/videos/a.mp4#_r=99'
)
assert.strictEqual(
  withVideoReloadNonce('https://cdn.yunmanvr.com/videos/a.mp4#_r=1', 8),
  'https://cdn.yunmanvr.com/videos/a.mp4#_r=8'
)
assert.strictEqual(
  withVideoReloadNonce('https://bucket.oss-cn-chengdu.aliyuncs.com/videos/a.mp4?Expires=1&Signature=ab', 8),
  'https://bucket.oss-cn-chengdu.aliyuncs.com/videos/a.mp4?Expires=1&Signature=ab#_r=8'
)
assert.strictEqual(
  withVideoReloadNonce('https://cdn.yunmanvr.com/videos/a.mp4?auth_key=1-0-0-abc#_r=1', 8),
  'https://cdn.yunmanvr.com/videos/a.mp4?auth_key=1-0-0-abc#_r=8'
)
assert.strictEqual(withVideoReloadNonce(''), '')

assert.strictEqual(resolveResumeInitialTime({ lastPositionSeconds: 303, completed: true, totalDurationSeconds: 303 }), 0)
assert.strictEqual(resolveResumeInitialTime({ lastPositionSeconds: 280, completed: false, totalDurationSeconds: 303 }), 280)
assert.strictEqual(resolveResumeInitialTime({ lastPositionSeconds: 80, completed: false, totalDurationSeconds: 303 }), 80)
assert.strictEqual(resolveResumeInitialTime({ lastPositionSeconds: 302, completed: false, totalDurationSeconds: 303 }), 0)
assert.strictEqual(resolveResumeInitialTime({ lastPositionSeconds: 0, completed: false, totalDurationSeconds: 0 }), 0)

assert.strictEqual(formatResumeClock(0), '0:00')
assert.strictEqual(formatResumeClock(1510), '25:10')
assert.strictEqual(formatResumeClock(3661), '1:01:01')

assert.strictEqual(resolvePlayerProgressStatusText({ progressLoadError: true }), '学习进度暂未加载')
assert.strictEqual(resolvePlayerProgressStatusText({ completed: true, progressPercent: 0 }), '已完成学习')
assert.strictEqual(resolvePlayerProgressStatusText({ progressPercent: 45 }), '已学习 45%')
assert.strictEqual(resolvePlayerProgressStatusText({ progressPercent: 0 }), '开始学习')

{
  const mid = buildProgressResponsePatch(
    { progressPercent: 40, completed: false },
    { progressPercent: 0, completed: false, progressStatusText: '开始学习' }
  )
  assert.strictEqual(mid.progressPercent, 40)
  assert.strictEqual(mid.completed, false)
  assert.strictEqual(mid.progressLoadError, false)
  assert.strictEqual(mid.progressKnown, true)
  assert.strictEqual(mid.progressStatusText, '已学习 40%')
}

{
  const done = buildProgressResponsePatch(
    { progressPercent: 100, completed: true },
    { progressPercent: 0, completed: false, progressStatusText: '开始学习' }
  )
  assert.strictEqual(done.progressPercent, 100)
  assert.strictEqual(done.completed, true)
  assert.strictEqual(done.progressStatusText, '已完成学习')
}

{
  const keepPrev = buildProgressResponsePatch(
    { completed: false },
    { progressPercent: 40, completed: false }
  )
  assert.strictEqual(keepPrev.progressPercent, 40)
  assert.strictEqual(keepPrev.progressStatusText, '已学习 40%')
  assert.strictEqual(keepPrev.savedPosition, undefined, '正常上报不得改写续播位置')
}

{
  const stillFailed = buildProgressResponsePatch(
    { progressPercent: 50, completed: false },
    { progressLoadError: true, progressPercent: 0, completed: false }
  )
  assert.strictEqual(stillFailed.progressLoadError, true)
  assert.strictEqual(stillFailed.progressKnown, false)
  assert.strictEqual(stillFailed.progressStatusText, '学习进度暂未加载')
  assert.strictEqual(shouldRecoverProgressFromReport(
    { progressLoadError: true },
    { progressPercent: 50 }
  ), false)
}

{
  const recovered = buildProgressResponsePatch(
    {
      lastPositionSeconds: 300,
      progressPercent: 50,
      completed: false,
      totalDurationSeconds: 600
    },
    { progressLoadError: true, progressPercent: 0, completed: false }
  )
  assert.strictEqual(recovered.progressLoadError, false)
  assert.strictEqual(recovered.progressKnown, true)
  assert.strictEqual(recovered.progressStatusText, '已学习 50%')
  assert.strictEqual(recovered.savedPosition, 300)
  assert.strictEqual(recovered.savedPositionLabel, '5:00')
  assert.strictEqual(recovered.initialTime, 300)
  assert.strictEqual(recovered.offerResumeJump, false)
  assert.strictEqual(shouldRecoverProgressFromReport(
    { progressLoadError: true },
    { lastPositionSeconds: 300 }
  ), true)
}

{
  const recoveredZero = buildProgressResponsePatch(
    { lastPositionSeconds: 0, progressPercent: 0, completed: false },
    { progressLoadError: true }
  )
  assert.strictEqual(recoveredZero.progressLoadError, false)
  assert.strictEqual(recoveredZero.savedPosition, 0)
  assert.strictEqual(recoveredZero.progressStatusText, '开始学习')
}

assert.strictEqual(shouldNotifyProgressCompletion({
  notifyCompletion: true,
  completed: true,
  wasCompleted: false,
  alreadyNotified: false,
  pageActive: true
}), true)
assert.strictEqual(shouldNotifyProgressCompletion({
  notifyCompletion: true,
  completed: true,
  wasCompleted: true,
  alreadyNotified: true,
  pageActive: true
}), false)
assert.strictEqual(shouldNotifyProgressCompletion({
  notifyCompletion: false,
  completed: true,
  wasCompleted: false,
  alreadyNotified: false,
  pageActive: true
}), false)
assert.strictEqual(shouldNotifyProgressCompletion({
  notifyCompletion: true,
  completed: true,
  wasCompleted: false,
  alreadyNotified: false,
  pageActive: false
}), false)

{
  const failed = buildPlayerProgressView({ progress: null, failed: true })
  assert.strictEqual(failed.progressLoadError, true)
  assert.strictEqual(failed.progressKnown, false)
  assert.strictEqual(failed.initialTime, 0)
  assert.strictEqual(failed.progressStatusText, '学习进度暂未加载')
}

{
  const zero = buildPlayerProgressView({
    progress: { lastPositionSeconds: 0, completed: false, progressPercent: 0, totalDurationSeconds: 0 },
    failed: false
  })
  assert.strictEqual(zero.progressLoadError, false)
  assert.strictEqual(zero.progressKnown, true)
  assert.strictEqual(zero.initialTime, 0)
  assert.strictEqual(zero.progressStatusText, '开始学习')
}

{
  const mid = buildPlayerProgressView({
    progress: { lastPositionSeconds: 1510, completed: false, progressPercent: 45, totalDurationSeconds: 3600 },
    failed: false
  })
  assert.strictEqual(mid.initialTime, 1510)
  assert.strictEqual(mid.savedPositionLabel, '25:10')
  assert.strictEqual(mid.completed, false)
  assert.strictEqual(mid.progressStatusText, '已学习 45%')
}

{
  const done = buildPlayerProgressView({
    progress: { lastPositionSeconds: 3600, completed: true, progressPercent: 100, totalDurationSeconds: 3600 },
    failed: false
  })
  assert.strictEqual(done.initialTime, 0)
  assert.strictEqual(done.completed, true)
  assert.strictEqual(done.progressStatusText, '已完成学习')
}

assert.strictEqual(shouldAutoSeekOnProgressRetry({ interacted: true, currentPosition: 0 }), false)
assert.strictEqual(shouldAutoSeekOnProgressRetry({ interacted: false, currentPosition: 3 }), true)
assert.strictEqual(shouldAutoSeekOnProgressRetry({ interacted: false, currentPosition: 20 }), false)

{
  const mid = buildPlayerProgressView({
    progress: { lastPositionSeconds: 1510, completed: false, progressPercent: 45, totalDurationSeconds: 3600 },
    failed: false
  })
  assert.deepStrictEqual(resolveProgressRetryAction({ view: mid, interacted: false, currentPosition: 2 }).kind, 'auto-seek')
  assert.deepStrictEqual(resolveProgressRetryAction({ view: mid, interacted: true, currentPosition: 2 }).kind, 'offer-jump')
  assert.deepStrictEqual(resolveProgressRetryAction({ view: mid, interacted: false, currentPosition: 40 }).kind, 'offer-jump')
  const zero = buildPlayerProgressView({
    progress: { lastPositionSeconds: 0, completed: false, progressPercent: 0 },
    failed: false
  })
  assert.strictEqual(resolveProgressRetryAction({ view: zero, interacted: false, currentPosition: 0 }).kind, 'apply')
}

{
  const vtt = 'WEBVTT\n\n00:00:00.000 --> 00:00:01.000\n你好\n'
  assert.strictEqual(coerceVttText(vtt), vtt)
  const bytes = new TextEncoder().encode(vtt)
  assert.ok(looksLikeVtt(coerceVttText(bytes.buffer)))
  assert.strictEqual(coerceVttText(''), '')
}

assert.strictEqual(resolveVideoResumePosition({ currentPosition: 1080, initialTime: 480 }), 1080)
assert.strictEqual(resolveVideoResumePosition({ currentPosition: 0, initialTime: 480 }), 0)
assert.strictEqual(resolveVideoResumePosition({ currentPosition: null, initialTime: 480 }), 480)
assert.strictEqual(resolveVideoResumePosition({ currentPosition: null, initialTime: 0 }), 0)

assert.strictEqual(resolvePlayerStage({ loading: true, videoUrl: '' }), 'loading')
assert.strictEqual(resolvePlayerStage({ loading: false, videoUrl: '' }), 'empty')
assert.strictEqual(resolvePlayerStage({ loadError: true, loading: true, videoUrl: '' }), 'loadError')
assert.strictEqual(resolvePlayerStage({ videoFailed: true, loading: false, videoUrl: 'https://x' }), 'videoFailed')
assert.strictEqual(resolvePlayerStage({ loading: false, videoUrl: 'https://x' }), 'video')
assert.strictEqual(resolvePlayerStage({ loading: true, videoUrl: 'https://x' }), 'video')

assert.strictEqual(canFetchCourseAfterAuth({ hasToken: false, mustChangePassword: false }), false)
assert.strictEqual(canFetchCourseAfterAuth({ hasToken: true, mustChangePassword: true }), false)
assert.strictEqual(canFetchCourseAfterAuth({ hasToken: true, mustChangePassword: false }), true)
assert.deepStrictEqual(courseAuthBlockedPatch(), { loading: false, loadError: true })

{
  const fs = require('fs')
  const path = require('path')
  const wxml = fs.readFileSync(path.join(__dirname, '../packageB/course/player.wxml'), 'utf8')
  const needles = [
    'wx:if="{{videoUrl && !loadError && !videoFailed}}"',
    'wx:elif="{{loadError}}"',
    'wx:elif="{{videoFailed}}"',
    'wx:elif="{{loading}}"',
    'wx:else'
  ]
  let from = 0
  for (const needle of needles) {
    const i = wxml.indexOf(needle, from)
    assert.ok(i >= 0, 'player.wxml 舞台分支须按视频→失败→加载中→暂未配置排列：' + needle)
    from = i + needle.length
  }
}

assert.strictEqual(isVttHttpSuccess(200), true)
assert.strictEqual(isVttHttpSuccess(403), false)

assert.strictEqual(looksLikeVtt('WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nhi'), true)
assert.strictEqual(looksLikeVtt('<?xml version="1.0"?><Error>'), false)
assert.strictEqual(parseVttTime('00:00:04.000'), 4)
assert.strictEqual(parseVttTime('00:00:04.000 position:0%,line:0'), 4)
assert.strictEqual(parseVttTime('01:02.500'), 62.5)
assert.strictEqual(parseVttTime(''), 0)

assert.strictEqual(isVideoPlaybackStable({ recoveryStartPosition: 0, currentSec: 9 }), false)
assert.strictEqual(isVideoPlaybackStable({ recoveryStartPosition: 0, currentSec: 10 }), true)
assert.strictEqual(isVideoPlaybackStable({ recoveryStartPosition: 5, currentSec: 14 }), false)
assert.strictEqual(isVideoPlaybackStable({ recoveryStartPosition: 5, currentSec: 15 }), true)

assert.strictEqual(shouldGiveUpVideoReload({ consecutiveRetries: 2 }), true)
assert.strictEqual(shouldGiveUpVideoReload({ consecutiveRetries: 1 }), false)
assert.strictEqual(
  shouldGiveUpVideoReload({ consecutiveRetries: 0, lifetimeReloads: 99 }),
  false,
  '历史上稳定成功的换签次数不应导致当前播放永久失败'
)

{
  let consecutiveRetries = 0
  let recoveryStartPosition = null
  let playCalls = 0
  let failed = false

  function onTimeUpdate(cur) {
    if (consecutiveRetries > 0) {
      if (recoveryStartPosition == null && cur > 0) recoveryStartPosition = cur
      if (isVideoPlaybackStable({ recoveryStartPosition, currentSec: cur })) {
        consecutiveRetries = 0
        recoveryStartPosition = null
      }
    }
  }

  function onVideoError() {
    if (shouldGiveUpVideoReload({ consecutiveRetries })) {
      failed = true
      return
    }
    consecutiveRetries += 1
    recoveryStartPosition = null
    playCalls += 1
  }

  for (let round = 0; round < 6; round += 1) {
    onVideoError()
    recoveryStartPosition = 100
    onTimeUpdate(110)
  }

  assert.strictEqual(failed, false, '每次换签后稳定播放，长课可继续换取新地址')
  assert.strictEqual(playCalls, 6)
  assert.strictEqual(consecutiveRetries, 0)

  onVideoError()
  onVideoError()
  onVideoError()
  assert.strictEqual(failed, true, '连续两次恢复仍失败时应停止重试')
  assert.strictEqual(playCalls, 8)
}

{
  const fs = require('fs')
  const path = require('path')
  const playerJs = fs.readFileSync(path.join(__dirname, '../packageB/course/player.js'), 'utf8')
  assert.match(playerJs, /settlePromise/)
  assert.match(playerJs, /onRetryProgress/)
  assert.match(playerJs, /progressLoadError/)
  assert.match(playerJs, /buildProgressResponsePatch/)
  assert.match(playerJs, /shouldNotifyProgressCompletion/)
  assert.match(playerJs, /notifyCompletion/)
  assert.match(playerJs, /onHide\(\)\s*\{\s*this\._pageActive = false/s)
  assert.match(playerJs, /_progressResumeFromReport/)
  assert.match(playerJs, /_applyResumeFromRecoveredProgress/)
  assert.doesNotMatch(playerJs, /\/progress`\)\.catch\(\(\) => null\)/)
  assert.match(playerJs, /get\(`\/courses\/\$\{this\._courseId\}\/play`, \{\}, \{ silent: true \}\)/)
  assert.match(playerJs, /this\.setData\(\{ videoFailed: true \}\)\s*\n\s*wx\.showToast\(\{ title: '视频播放失败，请稍后重试'/)
  assert.doesNotMatch(playerJs, /if \(!silent\) \{\s*this\.setData\(\{ videoFailed: true \}\)/s)
  const playerWxml = fs.readFileSync(path.join(__dirname, '../packageB/course/player.wxml'), 'utf8')
  assert.match(playerWxml, /onRetryProgress/)
  assert.match(playerWxml, /progressStatusText/)
  assert.doesNotMatch(playerWxml, /开始学习/)
}

settlePromise(Promise.resolve({ lastPositionSeconds: 12 })).then((ok) => {
  assert.strictEqual(ok.ok, true)
  assert.strictEqual(ok.value.lastPositionSeconds, 12)
})
settlePromise(Promise.reject(new Error('progress-down'))).then((fail) => {
  assert.strictEqual(fail.ok, false)
  assert.ok(fail.error)
})

console.log('coursePlayerProgress.test: PASS')
