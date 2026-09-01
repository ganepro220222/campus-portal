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

player.play({ id: 12, url: '', name: '不会开始' })
assert.strictEqual(player.snapshot().visible, false)

player.play({ id: 12, url: 'https://cdn.example.com/a.mp3', name: '导览.mp3' })
const started = player.snapshot()
assert.strictEqual(started.visible, true)
assert.strictEqual(started.id, '12')
assert.strictEqual(started.name, '导览.mp3')
assert.strictEqual(started.error, '当前环境无法播放音频')

player.stop()
assert.strictEqual(player.snapshot().visible, false)

console.log('resourceAudioPlayer.test.js ok')
