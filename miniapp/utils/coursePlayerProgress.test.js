#!/usr/bin/env node
const assert = require('assert')
const {
  resolveEndedReport,
  shouldReportByInterval,
  isSeekBackward,
  resolveVideoResumePosition,
  isVttHttpSuccess,
  looksLikeVtt,
  isVideoPlaybackStable,
  shouldGiveUpVideoReload
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

assert.strictEqual(resolveVideoResumePosition({ currentPosition: 1080, initialTime: 480 }), 1080)
assert.strictEqual(resolveVideoResumePosition({ currentPosition: 0, initialTime: 480 }), 480)
assert.strictEqual(resolveVideoResumePosition({ currentPosition: null, initialTime: 0 }), 0)

assert.strictEqual(isVttHttpSuccess(200), true)
assert.strictEqual(isVttHttpSuccess(403), false)

assert.strictEqual(looksLikeVtt('WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nhi'), true)
assert.strictEqual(looksLikeVtt('<?xml version="1.0"?><Error>'), false)

assert.strictEqual(isVideoPlaybackStable({ recoveryStartPosition: 0, currentSec: 9 }), false)
assert.strictEqual(isVideoPlaybackStable({ recoveryStartPosition: 0, currentSec: 10 }), true)
assert.strictEqual(isVideoPlaybackStable({ recoveryStartPosition: 5, currentSec: 14 }), false)
assert.strictEqual(isVideoPlaybackStable({ recoveryStartPosition: 5, currentSec: 15 }), true)

assert.strictEqual(shouldGiveUpVideoReload({ consecutiveRetries: 2, lifetimeReloads: 1 }), true)
assert.strictEqual(shouldGiveUpVideoReload({ consecutiveRetries: 1, lifetimeReloads: 3 }), true)
assert.strictEqual(shouldGiveUpVideoReload({ consecutiveRetries: 1, lifetimeReloads: 2 }), false)

{
  let consecutiveRetries = 0
  let lifetimeReloads = 0
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
    if (shouldGiveUpVideoReload({ consecutiveRetries, lifetimeReloads })) {
      failed = true
      return
    }
    consecutiveRetries += 1
    recoveryStartPosition = null
    lifetimeReloads += 1
    playCalls += 1
  }

  for (let round = 0; round < 5 && !failed; round += 1) {
    onTimeUpdate(1)
    onVideoError()
  }

  assert.strictEqual(failed, true)
  assert.ok(playCalls >= 2 && playCalls <= 3)
}

console.log('coursePlayerProgress.test: PASS')
