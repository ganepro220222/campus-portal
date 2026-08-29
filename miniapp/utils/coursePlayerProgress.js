// utils/coursePlayerProgress.js — 课程播放器进度纯函数（便于单测）

/**
 * 播放结束时解析应上报的位置与总时长。
 * VideoContext.duration 不可靠，优先 ended/timeupdate 事件与缓存值。
 */
function resolveEndedReport({ detailDuration, cachedDuration, cachedPosition }) {
  const total = Math.floor(Number(detailDuration || cachedDuration || 0))
  const position = total > 0
    ? total
    : Math.floor(Number(cachedPosition || 0))
  return { position, total }
}

/** 是否到达周期上报间隔（默认 20 秒） */
function shouldReportByInterval(currentSec, lastReportSec, intervalSec = 20) {
  return currentSec - lastReportSec >= intervalSec
}

function isVttHttpSuccess(statusCode) {
  return statusCode >= 200 && statusCode < 300
}

function looksLikeVtt(text) {
  if (typeof text !== 'string' || !text.trim()) return false
  const head = text.trimStart().slice(0, 64).toUpperCase()
  return head.startsWith('WEBVTT') || text.includes('-->')
}

const VIDEO_STABLE_SECONDS = 10
const VIDEO_MAX_CONSECUTIVE_RETRIES = 2
const VIDEO_MAX_LIFETIME_RELOADS = 3

/** 本次 URL 是否已稳定播放足够时长/进度，可重置连续失败计数 */
function isVideoPlaybackStable({ recoveryStartPosition, currentSec, stableSeconds = VIDEO_STABLE_SECONDS }) {
  if (recoveryStartPosition == null || currentSec <= 0) return false
  return currentSec - recoveryStartPosition >= stableSeconds
}

function shouldGiveUpVideoReload({ consecutiveRetries, lifetimeReloads,
  maxConsecutive = VIDEO_MAX_CONSECUTIVE_RETRIES,
  maxLifetime = VIDEO_MAX_LIFETIME_RELOADS }) {
  return lifetimeReloads >= maxLifetime || consecutiveRetries >= maxConsecutive
}

module.exports = {
  resolveEndedReport,
  shouldReportByInterval,
  isVttHttpSuccess,
  looksLikeVtt,
  VIDEO_STABLE_SECONDS,
  VIDEO_MAX_CONSECUTIVE_RETRIES,
  VIDEO_MAX_LIFETIME_RELOADS,
  isVideoPlaybackStable,
  shouldGiveUpVideoReload
}
