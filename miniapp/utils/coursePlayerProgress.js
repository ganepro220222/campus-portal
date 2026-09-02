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

/** 用户向后 seek 超过容差时，需立即上报以重置服务端位置基准 */
function isSeekBackward(currentSec, lastReportSec, toleranceSec = 2) {
  return currentSec + toleranceSec < lastReportSec
}

/**
 * seekcomplete.position 在 Android 为毫秒，其余平台为秒。
 * 平台未知时按秒处理，避免依赖时长做单位猜测。
 */
function normalizeSeekCompletePosition(rawPosition, platform) {
  if (typeof rawPosition !== 'number' || !Number.isFinite(rawPosition) || rawPosition < 0) return null
  const position = rawPosition
  return typeof platform === 'string' && platform.trim().toLowerCase() === 'android'
    ? position / 1000
    : position
}

/**
 * 新版基础库优先使用 getDeviceInfo；旧版或调用失败时退回 getSystemInfoSync。
 */
function getCoursePlayerPlatform(wxApi) {
  const api = wxApi || {}
  if (typeof api.getDeviceInfo === 'function') {
    try {
      const info = api.getDeviceInfo()
      if (info && typeof info.platform === 'string' && info.platform.trim()) {
        return info.platform
      }
    } catch (err) {
      // 继续使用旧接口兜底
    }
  }
  if (typeof api.getSystemInfoSync === 'function') {
    try {
      const info = api.getSystemInfoSync()
      if (info && typeof info.platform === 'string') return info.platform
    } catch (err) {
      // 未知平台按秒处理
    }
  }
  return ''
}

/** 刷新视频 URL 后应恢复的播放位置 */
function resolveVideoResumePosition({ currentPosition, initialTime }) {
  if (currentPosition != null && currentPosition > 0) return currentPosition
  return initialTime || 0
}

/**
 * 续播起点：未完成用上次位置；已完成或已停在片尾则从头播。
 * 库里的最高进度 / 完成态由服务端 merge，不会因为从头播被改小。
 */
function resolveResumeInitialTime({ lastPositionSeconds, completed, totalDurationSeconds }) {
  if (completed) return 0
  const pos = Math.floor(Number(lastPositionSeconds) || 0)
  const total = Math.floor(Number(totalDurationSeconds) || 0)
  // 未完成但停在最后 2 秒：再 initial-time 会立刻 ended；从头播不影响库里的最高进度。
  if (total > 0 && pos >= Math.max(0, total - 2)) return 0
  return pos > 0 ? pos : 0
}

function coerceVttText(data) {
  if (typeof data === 'string') return data
  if (!data) return ''
  let bytes
  if (data instanceof ArrayBuffer) {
    bytes = new Uint8Array(data)
  } else if (ArrayBuffer.isView(data)) {
    bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
  } else {
    return ''
  }
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(bytes)
  }
  let out = ''
  for (let i = 0; i < bytes.length;) {
    const c = bytes[i]
    if (c < 0x80) {
      out += String.fromCharCode(c)
      i += 1
      continue
    }
    if ((c & 0xe0) === 0xc0 && i + 1 < bytes.length) {
      out += String.fromCharCode(((c & 0x1f) << 6) | (bytes[i + 1] & 0x3f))
      i += 2
      continue
    }
    if ((c & 0xf0) === 0xe0 && i + 2 < bytes.length) {
      out += String.fromCharCode(
        ((c & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)
      )
      i += 3
      continue
    }
    i += 1
  }
  return out
}

/**
 * 强制 <video> 重新加载时不要先把 src 置空（开发者工具会报 no supported source）。
 * 用 hash 改字符串，避免给 OSS/CDN 签名 query 再塞 `_r` 把签名算坏。
 */
function withVideoReloadNonce(url, nonce) {
  if (!url) return ''
  const token = String(nonce == null ? Date.now() : nonce)
  const raw = String(url)
  const hashIdx = raw.indexOf('#')
  const base = hashIdx >= 0 ? raw.slice(0, hashIdx) : raw
  const hash = hashIdx >= 0 ? raw.slice(hashIdx + 1) : ''
  const parts = hash.split('&').filter(Boolean).filter((part) => !/^_r=/.test(part))
  parts.push('_r=' + token)
  return base + '#' + parts.join('&')
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

/** 本次 URL 是否已稳定播放足够时长/进度，可重置连续失败计数 */
function isVideoPlaybackStable({ recoveryStartPosition, currentSec, stableSeconds = VIDEO_STABLE_SECONDS }) {
  if (recoveryStartPosition == null || currentSec <= 0) return false
  return currentSec - recoveryStartPosition >= stableSeconds
}

/**
 * 只限制连续失败。签名正常过期后若新地址已稳定播放，不应永久消耗页面生命周期额度。
 */
function shouldGiveUpVideoReload({
  consecutiveRetries,
  maxConsecutive = VIDEO_MAX_CONSECUTIVE_RETRIES
}) {
  return consecutiveRetries >= maxConsecutive
}

module.exports = {
  resolveEndedReport,
  shouldReportByInterval,
  isVttHttpSuccess,
  looksLikeVtt,
  VIDEO_STABLE_SECONDS,
  VIDEO_MAX_CONSECUTIVE_RETRIES,
  isVideoPlaybackStable,
  shouldGiveUpVideoReload,
  isSeekBackward,
  normalizeSeekCompletePosition,
  getCoursePlayerPlatform,
  resolveVideoResumePosition,
  resolveResumeInitialTime,
  coerceVttText,
  withVideoReloadNonce
}
