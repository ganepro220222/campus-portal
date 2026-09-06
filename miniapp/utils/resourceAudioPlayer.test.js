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

function installAudioWx() {
  const handlers = {}
  const ctx = {
    obeyMuteSwitch: false,
    src: '',
    currentTime: 0,
    duration: 12,
    destroyed: false,
    play() {},
    stop() {},
    destroy() { ctx.destroyed = true },
    onTimeUpdate() {},
    onCanplay(fn) { handlers.canplay = fn },
    onPlay(fn) { handlers.play = fn },
    onEnded() {},
    onStop() {},
    onError(fn) { handlers.error = fn }
  }
  const originalWx = global.wx
  global.wx = {
    createInnerAudioContext() {
      ctx.destroyed = false
      return ctx
    }
  }
  return { handlers, ctx, originalWx }
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
  assert.strictEqual(after.error, '音频加载超时，请重试')
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

testReadyPromise()
  .then(testSlowLoadThenReady)
  .then(testGiveUpStopsPlayer)
  .then(testStopCancelsPending)
  .then(() => console.log('resourceAudioPlayer.test.js ok'))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
