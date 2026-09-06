/**
 * 学习资料音频播放栏：时间格式与空状态
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

async function testReadyPromise() {
  const handlers = {}
  const originalWx = global.wx
  global.wx = {
    createInnerAudioContext() {
      return {
        obeyMuteSwitch: false,
        src: '',
        currentTime: 0,
        duration: 12,
        play() {},
        stop() {},
        destroy() {},
        onTimeUpdate() {},
        onCanplay(fn) { handlers.canplay = fn },
        onPlay(fn) { handlers.play = fn },
        onEnded() {},
        onStop() {},
        onError(fn) { handlers.error = fn }
      }
    }
  }
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

testReadyPromise()
  .then(() => console.log('resourceAudioPlayer.test.js ok'))
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
