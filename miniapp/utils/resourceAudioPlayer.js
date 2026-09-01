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
    error: ''
  }
}

let _ctx = null
let _state = emptyState()
let _listeners = []
let _seeking = false
let _onUnplayable = null

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
  const url = opts.url
  if (!url) return
  if (typeof wx === 'undefined' || typeof wx.createInnerAudioContext !== 'function') {
    _state = {
      ...emptyState(),
      visible: true,
      id: String(opts.id || ''),
      name: opts.name || '音频',
      error: '当前环境无法播放音频'
    }
    emit()
    return
  }
  destroyCtx()
  _onUnplayable = typeof opts.onUnplayable === 'function' ? opts.onUnplayable : null
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
    emit()
    if (_onUnplayable) _onUnplayable()
  })
  _ctx.play()
  emit()
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
  destroyCtx()
  _onUnplayable = null
  _seeking = false
  _state = emptyState()
  emit()
}

function destroy() {
  stop()
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
  destroy
}
