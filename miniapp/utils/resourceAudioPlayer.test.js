/**
 * 学习资料音频播放栏：时间格式、就绪 Promise、慢加载与超时
 * 运行：node miniapp/utils/resourceAudioPlayer.test.js
 */
const assert = require('assert')
const player = require('./resourceAudioPlayer')

assert.strictEqual(player.formatClock(0), '00:00')
assert.strictEqual(player.formatClock(5), '00:05')
assert.strictEqual(player.formatClock(75), '01:15')
assert.strictEqual(player.formatClock(-3), '00:00')
assert.strictEqual(player.formatClock('9.9'), '00:09')

player.stop()
const empty = player.snapshot()
assert.strictEqual(empty.visible, false)
assert.strictEqual(empty.playing, false)
assert.strictEqual(empty.currentText, '00:00')

const emptyPlay = player.play({ id: 12, url: '', name: '不会开始' })
emptyPlay.catch(() => {})
assert.strictEqual(player.snapshot().visible, false)

const blocked = player.play({ id: 12, url: 'https://cdn.example.com/a.mp3', name: '导览.mp3' })
blocked.catch(() => {})
const started = player.snapshot()
assert.strictEqual(started.visible, true)
assert.strictEqual(started.id, '12')
assert.strictEqual(started.name, '导览.mp3')
assert.strictEqual(started.error, '当前环境无法播放音频')

player.stop()
assert.strictEqual(player.snapshot().visible, false)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createMockCtx(handlers) {
  const ctx = {
    obeyMuteSwitch: false,
    src: '',
    currentTime: 0,
    duration: 12,
    destroyed: false,
    playCount: 0,
    play() { ctx.playCount += 1 },
    stop() {},
    destroy() { ctx.destroyed = true },
    onTimeUpdate() {},
    onCanplay(fn) { handlers.canplay = fn },
    onPlay(fn) { handlers.play = fn },
    onEnded(fn) { handlers.ended = fn },
    onStop(fn) { handlers.stop = fn },
    onError(fn) { handlers.error = fn }
  }
  return ctx
}

function installAudioWx() {
  const handlers = {}
  const toasts = []
  const ctx = createMockCtx(handlers)
  const originalWx = global.wx
  global.wx = {
    createInnerAudioContext() {
      ctx.destroyed = false
      return ctx
    },
    showToast(opts) {
      toasts.push(opts && opts.title)
    }
  }
  return { handlers, ctx, originalWx, toasts }
}

async function testReadyPromise() {
  const { handlers, originalWx } = installAudioWx()
  delete require.cache[require.resolve('./resourceAudioPlayer')]
  const live = require('./resourceAudioPlayer')
  const ready = live.play({ id: 8, url: 'https://cdn.example.com/a.mp3', name: '导览' })
  handlers.canplay()
  await ready
  live.stop()

  const failed = live.play({ id: 9, url: 'https://cdn.example.com/bad.mp3', name: '坏' })
  handlers.error()
  await failed.then(
    () => { throw new Error('error 后不应视为播放成功') },
    (err) => { assert.strictEqual(err.message, 'audio-unplayable') }
  )
  live.stop()
  global.wx = originalWx
  delete require.cache[require.resolve('./resourceAudioPlayer')]
}

async function testSlowLoadThenReady() {
  const { handlers, ctx, originalWx } = installAudioWx()
  delete require.cache[require.resolve('./resourceAudioPlayer')]
  const live = require('./resourceAudioPlayer')
  live._setReadyTimeouts(20, 200)
  const ready = live.play({ id: 8, url: 'https://cdn.example.com/slow.mp3', name: '慢' })
  await sleep(40)
  const mid = live.snapshot()
  assert.strictEqual(mid.playing, true, '15 秒提示阶段 playing 仍为 true')
  assert.strictEqual(mid.hint, '加载较慢，仍在尝试')
  assert.strictEqual(mid.error, '')
  assert.strictEqual(ctx.destroyed, false, '慢加载不得销毁播放器')
  handlers.canplay()
  await ready
  assert.strictEqual(live.snapshot().hint, '')
  assert.strictEqual(ctx.destroyed, false)
  live.stop()
  global.wx = originalWx
  delete require.cache[require.resolve('./resourceAudioPlayer')]
}

async function testGiveUpStopsPlayer() {
  const { handlers, ctx, originalWx } = installAudioWx()
  delete require.cache[require.resolve('./resourceAudioPlayer')]
  const live = require('./resourceAudioPlayer')
  live._setReadyTimeouts(10, 30)
  const pending = live.play({ id: 8, url: 'https://cdn.example.com/hang.mp3', name: '卡' })
  await pending.then(
    () => { throw new Error('放弃超时后不应视为成功') },
    (err) => { assert.strictEqual(err.message, 'audio-timeout') }
  )
  const after = live.snapshot()
  assert.strictEqual(after.playing, false)
  assert.strictEqual(after.error, '音频加载超时，点击重试')
  assert.strictEqual(ctx.destroyed, true)
  handlers.canplay()
  handlers.play()
  assert.strictEqual(live.snapshot().playing, false, '超时后迟到 onPlay 不得恢复播放态')
  live.stop()
  global.wx = originalWx
  delete require.cache[require.resolve('./resourceAudioPlayer')]
}

async function testStopCancelsPending() {
  const { ctx, originalWx } = installAudioWx()
  delete require.cache[require.resolve('./resourceAudioPlayer')]
  const live = require('./resourceAudioPlayer')
  live._setReadyTimeouts(200, 400)
  const pending = live.play({ id: 8, url: 'https://cdn.example.com/a.mp3', name: '关' })
  live.stop()
  await pending.then(
    () => { throw new Error('关闭播放栏后不应视为成功') },
    (err) => { assert.strictEqual(err.message, 'audio-cancelled') }
  )
  assert.strictEqual(live.snapshot().visible, false)
  assert.strictEqual(ctx.destroyed, true)
  global.wx = originalWx
  delete require.cache[require.resolve('./resourceAudioPlayer')]
}

async function testErrorDestroysAndToggleDoesNotReplay() {
  const { handlers, ctx, originalWx } = installAudioWx()
  delete require.cache[require.resolve('./resourceAudioPlayer')]
  const live = require('./resourceAudioPlayer')
  let retried = 0
  const pending = live.play({
    id: 9,
    url: 'https://cdn.example.com/bad.mp3',
    name: '坏',
    onRetry: () => { retried += 1 }
  })
  assert.strictEqual(ctx.playCount, 1)
  handlers.error()
  await pending.then(
    () => { throw new Error('error 后不应视为播放成功') },
    (err) => { assert.strictEqual(err.message, 'audio-unplayable') }
  )
  const after = live.snapshot()
  assert.strictEqual(ctx.destroyed, true, 'onError 必须销毁播放器，避免未记账恢复播放')
  assert.strictEqual(after.error, '无法播放该音频，点击重试')
  assert.strictEqual(after.canRetry, true)
  assert.strictEqual(after.playing, false)
  live.resume()
  assert.strictEqual(ctx.playCount, 1, 'error 态 resume 不得复用旧 ctx')
  live.toggle()
  assert.strictEqual(ctx.playCount, 1, 'toggle 不得对已销毁 ctx 再 play')
  assert.strictEqual(retried, 1, '错误态点击播放按钮应走完整重试回调')
  handlers.play()
  assert.strictEqual(live.snapshot().playing, false, '销毁后迟到 onPlay 不得恢复播放态')
  live.stop()
  global.wx = originalWx
  delete require.cache[require.resolve('./resourceAudioPlayer')]
}

async function testTimeoutToggleCallsRetry() {
  const { ctx, originalWx } = installAudioWx()
  delete require.cache[require.resolve('./resourceAudioPlayer')]
  const live = require('./resourceAudioPlayer')
  live._setReadyTimeouts(10, 30)
  let retried = 0
  const pending = live.play({
    id: 8,
    url: 'https://cdn.example.com/hang.mp3',
    name: '卡',
    onRetry: () => { retried += 1 }
  })
  await pending.then(
    () => { throw new Error('放弃超时后不应视为成功') },
    (err) => { assert.strictEqual(err.message, 'audio-timeout') }
  )
  const after = live.snapshot()
  assert.strictEqual(after.error, '音频加载超时，点击重试')
  assert.strictEqual(after.canRetry, true)
  assert.strictEqual(ctx.destroyed, true)
  const playCount = ctx.playCount
  live.toggle()
  assert.strictEqual(retried, 1)
  assert.strictEqual(ctx.playCount, playCount, '超时后点击不得复用旧 ctx')
  live.stop()
  global.wx = originalWx
  delete require.cache[require.resolve('./resourceAudioPlayer')]
}

async function testMidplayErrorShowsRetry() {
  const { handlers, ctx, originalWx } = installAudioWx()
  delete require.cache[require.resolve('./resourceAudioPlayer')]
  const live = require('./resourceAudioPlayer')
  let retried = 0
  const ready = live.play({
    id: 8,
    url: 'https://cdn.example.com/a.mp3',
    name: '导览',
    onRetry: () => { retried += 1 }
  })
  handlers.canplay()
  await ready
  assert.strictEqual(live.snapshot().playing, true)
  assert.strictEqual(ctx.destroyed, false)
  handlers.error()
  const after = live.snapshot()
  assert.strictEqual(after.playing, false, '开播后中途错误不得继续显示播放中')
  assert.strictEqual(after.error, '播放中断，点击重试')
  assert.strictEqual(after.canRetry, true)
  assert.strictEqual(ctx.destroyed, true)
  const playCount = ctx.playCount
  live.resume()
  assert.strictEqual(ctx.playCount, playCount, '中途错误后 resume 不得复用旧 ctx')
  live.toggle()
  assert.strictEqual(retried, 1, '中途错误后点击应走完整重试')
  live.stop()
  global.wx = originalWx
  delete require.cache[require.resolve('./resourceAudioPlayer')]
}

function installAudioWxPool() {
  const created = []
  const toasts = []
  const originalWx = global.wx
  global.wx = {
    createInnerAudioContext() {
      const handlers = {}
      const ctx = createMockCtx(handlers)
      created.push({ ctx, handlers })
      return ctx
    },
    showToast(opts) {
      toasts.push(opts && opts.title)
    }
  }
  return { created, originalWx, toasts }
}

async function testStaleEventsDoNotPolluteNextTrack() {
  const { created, originalWx } = installAudioWxPool()
  delete require.cache[require.resolve('./resourceAudioPlayer')]
  const live = require('./resourceAudioPlayer')
  const readyA = live.play({
    id: 1,
    url: 'https://cdn.example.com/a.mp3',
    name: '音频A'
  })
  created[0].handlers.canplay()
  await readyA
  const readyB = live.play({
    id: 2,
    url: 'https://cdn.example.com/b.mp3',
    name: '音频B'
  })
  assert.strictEqual(created.length, 2)
  assert.strictEqual(created[0].ctx.destroyed, true, '切换后应销毁 A')
  assert.strictEqual(created[1].ctx.destroyed, false)
  created[1].handlers.canplay()
  await readyB
  const before = live.snapshot()
  assert.strictEqual(before.id, '2')
  assert.strictEqual(before.playing, true)
  assert.strictEqual(before.error, '')

  created[0].handlers.stop()
  const afterStop = live.snapshot()
  assert.strictEqual(afterStop.playing, true, 'A 的迟到 onStop 不得把 B 显示成暂停')
  assert.strictEqual(afterStop.id, '2')

  created[0].handlers.ended()
  const afterEnded = live.snapshot()
  assert.strictEqual(afterEnded.playing, true, 'A 的迟到 onEnded 不得结束 B')
  assert.notStrictEqual(afterEnded.progress, 100, 'A 的迟到 onEnded 不得把 B 进度推到 100%')

  created[0].handlers.play()
  created[0].handlers.canplay()
  created[0].handlers.error()
  const afterError = live.snapshot()
  assert.strictEqual(created[1].ctx.destroyed, false, 'A 的迟到 onError 不得销毁 B')
  assert.strictEqual(afterError.id, '2')
  assert.strictEqual(afterError.playing, true)
  assert.strictEqual(afterError.error, '', 'A 的迟到 onError 不得把 B 标成播放中断')

  created[1].handlers.error()
  const bError = live.snapshot()
  assert.strictEqual(created[1].ctx.destroyed, true)
  assert.strictEqual(bError.playing, false)
  assert.strictEqual(bError.error, '播放中断，点击重试')
  live.stop()
  global.wx = originalWx
  delete require.cache[require.resolve('./resourceAudioPlayer')]
}

async function testSwitchCancelsUnreadyTrack() {
  const { created, originalWx } = installAudioWxPool()
  delete require.cache[require.resolve('./resourceAudioPlayer')]
  const live = require('./resourceAudioPlayer')
  live._setReadyTimeouts(10, 200)
  const pendingA = live.play({
    id: 1,
    url: 'https://cdn.example.com/a.mp3',
    name: '音频A'
  })
  pendingA.catch(() => {})
  const pendingB = live.play({
    id: 2,
    url: 'https://cdn.example.com/b.mp3',
    name: '音频B'
  })
  await pendingA.then(
    () => { throw new Error('被切换走的 A 不应再视为准备成功') },
    (err) => { assert.strictEqual(err.message, 'audio-cancelled') }
  )
  await sleep(50)
  assert.strictEqual(created[1].ctx.destroyed, false, 'A 的 timeout 不得销毁已切换的 B')
  assert.strictEqual(live.snapshot().id, '2')
  assert.strictEqual(live.snapshot().error, '')
  created[1].handlers.canplay()
  await pendingB
  live.stop()
  global.wx = originalWx
  delete require.cache[require.resolve('./resourceAudioPlayer')]
}

async function testTimeoutWithoutRetryToasts() {
  const { originalWx, toasts } = installAudioWx()
  delete require.cache[require.resolve('./resourceAudioPlayer')]
  const live = require('./resourceAudioPlayer')
  live._setReadyTimeouts(10, 30)
  const pending = live.play({
    id: 8,
    url: 'https://cdn.example.com/hang.mp3',
    name: '卡'
  })
  await pending.then(
    () => { throw new Error('放弃超时后不应视为成功') },
    (err) => { assert.strictEqual(err.message, 'audio-timeout') }
  )
  assert.strictEqual(live.snapshot().canRetry, false)
  live.toggle()
  assert.ok(toasts.includes('请关闭后重新点击资源'))
  live.stop()
  global.wx = originalWx
  delete require.cache[require.resolve('./resourceAudioPlayer')]
}

async function testStopCancelsRetryTask() {
  const { handlers, originalWx } = installAudioWx()
  delete require.cache[require.resolve('./resourceAudioPlayer')]
  const live = require('./resourceAudioPlayer')
  let cancelled = 0
  const pending = live.play({
    id: 9,
    url: 'https://cdn.example.com/bad.mp3',
    name: '坏',
    onRetry: () => ({
      cancel() { cancelled += 1 }
    })
  })
  handlers.error()
  await pending.then(
    () => { throw new Error('error 后不应视为播放成功') },
    (err) => { assert.strictEqual(err.message, 'audio-unplayable') }
  )
  live.retry()
  assert.strictEqual(cancelled, 0, '重试任务在关闭前应保持有效')
  live.stop()
  assert.strictEqual(cancelled, 1, '关闭错误栏必须取消进行中的重试')
  live.stop()
  assert.strictEqual(cancelled, 1, '重复关闭不得再次 cancel')
  global.wx = originalWx
  delete require.cache[require.resolve('./resourceAudioPlayer')]
}

testReadyPromise()
  .then(testSlowLoadThenReady)
  .then(testGiveUpStopsPlayer)
  .then(testStopCancelsPending)
  .then(testErrorDestroysAndToggleDoesNotReplay)
  .then(testTimeoutToggleCallsRetry)
  .then(testMidplayErrorShowsRetry)
  .then(testStaleEventsDoNotPolluteNextTrack)
  .then(testSwitchCancelsUnreadyTrack)
  .then(testTimeoutWithoutRetryToasts)
  .then(testStopCancelsRetryTask)
  .then(() => console.log('resourceAudioPlayer.test.js ok'))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
