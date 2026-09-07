import assert from 'node:assert/strict'
import {
  AUDIO_LOAD_ERROR_TEXT,
  AUDIO_DEFAULT_LABEL,
  audioChromeState,
  shouldReloadAudioSrc,
  nextAudioIndexAfterDelete,
  nextAudioId,
  auditAudioIds,
  audioDeleteImpact,
  unbindHotspotsFromAudio,
  audioConfigIssues,
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

test('失败态必须重拉源；正常同轨不重复加载', () => {
  assert.equal(shouldReloadAudioSrc(0, 0, true), true)
  assert.equal(shouldReloadAudioSrc(0, 0, false), false)
  assert.equal(shouldReloadAudioSrc(0, 1, false), true)
})

test('删光音轨后 index 为 -1', () => {
  assert.equal(nextAudioIndexAfterDelete(0, 0, 0), -1)
  assert.equal(nextAudioIndexAfterDelete(1, 0, 0), -1)
})

test('删除当前播放轨后落到剩余第一条', () => {
  assert.equal(nextAudioIndexAfterDelete(1, 1, 1), 0)
  assert.equal(nextAudioIndexAfterDelete(0, 0, 1), 0)
})

test('删除更靠前的轨时当前 index 前移', () => {
  assert.equal(nextAudioIndexAfterDelete(2, 0, 2), 1)
  assert.equal(nextAudioIndexAfterDelete(1, 0, 1), 0)
})

test('删除后面的轨时当前 index 不变', () => {
  assert.equal(nextAudioIndexAfterDelete(0, 1, 1), 0)
  assert.equal(nextAudioIndexAfterDelete(1, 2, 2), 1)
})

test('nextAudioId 取最小空闲 aN', () => {
  assert.equal(nextAudioId([]), 'a1')
  assert.equal(nextAudioId([{ id: 'a1' }]), 'a2')
  assert.equal(nextAudioId([{ id: 'a2' }, { id: 'a3' }]), 'a1')
  assert.equal(nextAudioId([{ id: 'a1' }, { id: 'a3' }]), 'a2')
  assert.equal(nextAudioId([{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }]), 'a4')
  assert.equal(nextAudioId([{ id: 'a1' }, { id: 'a2' }, { id: 'a2' }]), 'a3')
})

test('auditAudioIds 检出重复与缺失', () => {
  const dup = auditAudioIds([{ id: 'a1' }, { id: 'a2' }, { id: 'a2' }])
  assert.deepEqual(dup.dupes, ['a2'])
  assert.equal(dup.missing, 0)
  const miss = auditAudioIds([{ id: 'a1' }, { id: '' }, {}])
  assert.equal(miss.missing, 2)
})

test('删除音轨会统计并清理热点引用', () => {
  const hotspots = [{ audio: 'a1' }, { audio: 'a2' }, { audio: 'a1' }]
  const impact = audioDeleteImpact(hotspots, 'a1')
  assert.equal(impact.count, 2)
  assert.match(impact.confirmText, /2 个热点/)
  assert.equal(unbindHotspotsFromAudio(hotspots, 'a1'), 2)
  assert.equal(hotspots[0].audio, undefined)
  assert.equal(hotspots[1].audio, 'a2')
  assert.equal(hotspots[2].audio, undefined)
})

test('孤儿热点引用与重复 id 阻断保存', () => {
  const dup = audioConfigIssues(
    [{ id: 'a1', src: 'x.mp3' }, { id: 'a1', src: 'y.mp3' }],
    [],
  )
  assert.ok(dup.errs.some(e => e.includes('语音 id 重复')))
  const orphan = audioConfigIssues(
    [{ id: 'a2', src: 'x.mp3' }],
    [{ audio: 'a1' }],
  )
  assert.ok(orphan.errs.some(e => e.includes('引用不存在的语音 a1')))
  const missingSrc = audioConfigIssues([{ id: 'a1' }], [])
  assert.ok(missingSrc.warns.some(w => w.includes('缺文件')))
  assert.equal(missingSrc.errs.length, 0)
})

console.log(`player-audio: ${pass} passed`)
