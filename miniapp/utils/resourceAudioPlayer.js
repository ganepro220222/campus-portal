// utils/resourceAudioPlayer.js — 学习资料音频：页面级播放状态，不走后台播放
function formatClock(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0))
  const m = Math.floor(s / 60)
  const r = s % 60
  return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0')
}

function emptyState() {
  return {
    visible: false,
    id: '',
    name: '',
    playing: false,
    current: 0,
    duration: 0,
    progress: 0,
    currentText: '00:00',
    durationText: '00:00',
    error: '',
    hint: ''
  }
}

let _ctx = null
let _state = emptyState()
let _listeners = []
let _seeking = false
let _onUnplayable = null
let _pendingSettle = null

const AUDIO_SLOW_HINT_MS = 15000
const AUDIO_GIVE_UP_MS = 90000
const _timeouts = {
  slowMs: AUDIO_SLOW_HINT_MS,
  giveUpMs: AUDIO_GIVE_UP_MS
}

function snapshot() {
  return { ..._state }
}

function emit() {
  const snap = snapshot()
  _listeners.forEach((fn) => {
    try {
      fn(snap)
    } catch (e) {
      // 订阅方异常不影响播放
    }
  })
}

function applyTime(current, duration) {
  const dur = Math.max(0, Number(duration) || 0)
  const curRaw = Math.max(0, Number(current) || 0)
  const cur = dur > 0 ? Math.min(dur, curRaw) : curRaw
  _state.current = cur
  _state.duration = dur
  _state.progress = dur > 0 ? Math.min(100, Math.round((cur / dur) * 100)) : 0
  _state.currentText = formatClock(cur)
  _state.durationText = formatClock(dur)
}

function destroyCtx() {
  if (!_ctx) return
  try {
    _ctx.stop()
  } catch (e) {
    // ignore
  }
  try {
    _ctx.destroy()
  } catch (e) {
    // ignore
  }
  _ctx = null
}

function subscribe(fn) {
  if (typeof fn !== 'function') {
    return () => {}
  }
  _listeners.push(fn)
  fn(snapshot())
  return () => {
    _listeners = _listeners.filter((item) => item !== fn)
  }
}

function play(opts = {}) {
  return new Promise((resolve, reject) => {
    let settled = false
    let slowTimer = null
    let giveUpTimer = null
    const clearTimers = () => {
      if (slowTimer) clearTimeout(slowTimer)
      if (giveUpTimer) clearTimeout(giveUpTimer)
      slowTimer = null
      giveUpTimer = null
    }
    const succeed = () => {
      if (settled) return
      settled = true
      _pendingSettle = null
      clearTimers()
      _state.hint = ''
      _state.error = ''
      emit()
      resolve()
    }
    const fail = (err, options = {}) => {
      if (settled) return
      settled = true
      _pendingSettle = null
      clearTimers()
      if (options.destroy !== false) {
        destroyCtx()
      }
      _state.playing = false
      _state.hint = ''
      if (options.error != null) {
        _state.error = options.error
      }
      emit()
      if (options.copy !== false && _onUnplayable) _onUnplayable()
      reject(err instanceof Error ? err : new Error('audio-unplayable'))
    }
    _pendingSettle = { succeed, fail }

    const url = opts.url
    if (!url) {
      _pendingSettle = null
      reject(new Error('no-url'))
      return
    }
    _onUnplayable = typeof opts.onUnplayable === 'function' ? opts.onUnplayable : null
    if (typeof wx === 'undefined' || typeof wx.createInnerAudioContext !== 'function') {
      _state = {
        ...emptyState(),
        visible: true,
        id: String(opts.id || ''),
        name: opts.name || '音频',
        error: '当前环境无法播放音频'
      }
      emit()
      fail(new Error('audio-unavailable'), { destroy: false, error: '当前环境无法播放音频' })
      return
    }
    destroyCtx()
    _seeking = false
    _state = {
      ...emptyState(),
      visible: true,
      id: String(opts.id || ''),
      name: opts.name || '音频',
      playing: true
    }
    _ctx = wx.createInnerAudioContext()
    _ctx.obeyMuteSwitch = false
    _ctx.src = url
    _ctx.onTimeUpdate(() => {
      if (_seeking || !_ctx) return
      applyTime(_ctx.currentTime, _ctx.duration)
      emit()
    })
    _ctx.onCanplay(() => {
      if (!_ctx) return
      applyTime(_ctx.currentTime, _ctx.duration)
      emit()
      succeed()
    })
    _ctx.onPlay(() => {
      if (!_ctx) return
      succeed()
    })
    _ctx.onEnded(() => {
      _state.playing = false
      if (_ctx) applyTime(_ctx.duration, _ctx.duration)
      emit()
    })
    _ctx.onStop(() => {
      _state.playing = false
      emit()
    })
    _ctx.onError(() => {
      _state.playing = false
      _state.error = '无法播放该音频'
      _state.hint = ''
      emit()
      fail(new Error('audio-unplayable'), { destroy: false, error: '无法播放该音频' })
    })
    // 15 秒只是弱网提示：继续等 canplay/onPlay，避免「已失败但稍后突然出声且永不记账」
    slowTimer = setTimeout(() => {
      if (settled) return
      _state.hint = '加载较慢，仍在尝试'
      emit()
    }, _timeouts.slowMs)
    giveUpTimer = setTimeout(() => {
      fail(new Error('audio-timeout'), { error: '音频加载超时，请重试' })
    }, _timeouts.giveUpMs)
    _ctx.play()
    emit()
  })
}

function pause() {
  if (_ctx && _state.playing) {
    _ctx.pause()
  }
  _state.playing = false
  emit()
}

function resume() {
  if (!_ctx || !_state.visible) return
  _state.error = ''
  _ctx.play()
  _state.playing = true
  emit()
}

function toggle() {
  if (!_state.visible) return
  if (_state.playing) pause()
  else resume()
}

function beginSeek() {
  _seeking = true
}

function seekPercent(percent) {
  const p = Math.max(0, Math.min(100, Number(percent) || 0))
  if (_ctx && _state.duration > 0) {
    _ctx.seek((_state.duration * p) / 100)
    applyTime((_state.duration * p) / 100, _state.duration)
  }
  _seeking = false
  emit()
}

function stop() {
  if (_pendingSettle) {
    _pendingSettle.fail(new Error('audio-cancelled'), { copy: false, error: '' })
  }
  destroyCtx()
  _onUnplayable = null
  _seeking = false
  _state = emptyState()
  emit()
}

function destroy() {
  stop()
}

function _setReadyTimeouts(slowMs, giveUpMs) {
  _timeouts.slowMs = slowMs == null ? AUDIO_SLOW_HINT_MS : slowMs
  _timeouts.giveUpMs = giveUpMs == null ? AUDIO_GIVE_UP_MS : giveUpMs
}

module.exports = {
  formatClock,
  snapshot,
  subscribe,
  play,
  pause,
  resume,
  toggle,
  beginSeek,
  seekPercent,
  stop,
  destroy,
  AUDIO_SLOW_HINT_MS,
  AUDIO_GIVE_UP_MS,
  _setReadyTimeouts
}
