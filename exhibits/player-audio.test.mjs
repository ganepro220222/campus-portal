import assert from 'node:assert/strict'
import {
  AUDIO_LOAD_ERROR_TEXT,
  AUDIO_DEFAULT_LABEL,
  audioChromeState,
  shouldReloadAudioSrc,
} from './player-audio.mjs'

let pass = 0
function test(name, fn) {
  fn()
  pass++
  console.log('  ok', name)
}

console.log('player-audio tests')

test('失败态隐藏选择器、显示可点击重试文案', () => {
  const st = audioChromeState({ trackCount: 2, index: 1, error: true, label: '讲解 2' })
  assert.equal(st.error, true)
  assert.equal(st.selHidden, true)
  assert.equal(st.nameHidden, false)
  assert.equal(st.nameText, AUDIO_LOAD_ERROR_TEXT)
  assert.equal(st.selValue, '1')
})

test('单音轨恢复后回到 label，选择器保持隐藏', () => {
  const st = audioChromeState({ trackCount: 1, index: 0, error: false, label: '讲解 1' })
  assert.equal(st.error, false)
  assert.equal(st.selHidden, true)
  assert.equal(st.nameHidden, false)
  assert.equal(st.nameText, '讲解 1')
})

test('多音轨恢复后重新露出选择器并隐藏名称', () => {
  const st = audioChromeState({ trackCount: 2, index: 0, error: false, label: '讲解 1' })
  assert.equal(st.selHidden, false)
  assert.equal(st.nameHidden, true)
  assert.equal(st.selValue, '0')
})

test('空 label 回退默认名', () => {
  assert.equal(audioChromeState({ trackCount: 1, label: '' }).nameText, AUDIO_DEFAULT_LABEL)
  assert.equal(audioChromeState({ trackCount: 1, label: '  ' }).nameText, AUDIO_DEFAULT_LABEL)
})

test('非法 index 按 0', () => {
  assert.equal(audioChromeState({ trackCount: 2, index: -1 }).selValue, '0')
  assert.equal(audioChromeState({ trackCount: 2, index: Number.NaN }).selValue, '0')
})

test('失败态必须重拉源；同轨无错误不重拉', () => {
  assert.equal(shouldReloadAudioSrc(0, 0, true), true)
  assert.equal(shouldReloadAudioSrc(0, 0, false), false)
  assert.equal(shouldReloadAudioSrc(0, 1, false), true)
})

console.log(`player-audio: ${pass} passed`)
