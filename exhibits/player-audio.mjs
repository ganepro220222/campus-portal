/** 语音讲解条：失败提示 vs 正常音轨名 / 多轨选择器。纯状态，不碰 DOM。 */

export const AUDIO_LOAD_ERROR_TEXT = '语音加载失败，点击重试'
export const AUDIO_DEFAULT_LABEL = '语音讲解'

function trackIndex(index) {
  const n = Number(index)
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
}

/**
 * @param {{ trackCount?: number, index?: number, error?: boolean, label?: string }} [opts]
 * @returns {{ error: boolean, selHidden: boolean, nameHidden: boolean, nameText: string, selValue: string }}
 */
export function audioChromeState({ trackCount = 0, index = 0, error = false, label = '' } = {}) {
  const i = trackIndex(index)
  const selValue = String(i)
  if (error) {
    return {
      error: true,
      selHidden: true,
      nameHidden: false,
      nameText: AUDIO_LOAD_ERROR_TEXT,
      selValue,
    }
  }
  if (Number(trackCount) > 1) {
    return {
      error: false,
      selHidden: false,
      nameHidden: true,
      nameText: AUDIO_DEFAULT_LABEL,
      selValue,
    }
  }
  const text = String(label || '').trim()
  return {
    error: false,
    selHidden: true,
    nameHidden: false,
    nameText: text || AUDIO_DEFAULT_LABEL,
    selValue,
  }
}

/** 失败态、切轨、或同一轨 src 已变时必须重拉，不能沿用旧媒体源。 */
export function shouldReloadAudioSrc(prevIndex, nextIndex, inError, prevSrc, nextSrc) {
  if (!!inError || prevIndex !== nextIndex) return true
  if (prevSrc === undefined || nextSrc === undefined) return false
  return String(prevSrc || '') !== String(nextSrc || '')
}

export function normalizeAudioSrc(src) {
  return typeof src === 'string' ? src.trim() : ''
}

/** 可预览 / 可播放的音轨。无 src 或只有空白的条目留在配置里，不进播放器。 */
export function playableAudioTracks(audio) {
  return (audio || []).filter(a => a && normalizeAudioSrc(a.src))
}

/**
 * 编辑器改完一条音轨地址后，预览播放器该怎么同步。
 * 用音轨 ID 对齐，不假设 cfg.audio index === auTracks index。
 */
export function audioSrcEditPlan({ currentId, loadedSrc, changedId, playable } = {}) {
  const tracks = Array.isArray(playable) ? playable : []
  const cur = normalizeAudioId(currentId)
  const ch = normalizeAudioId(changedId)
  const loaded = normalizeAudioSrc(loadedSrc)

  if (!tracks.length) {
    return { action: 'reset', index: -1, notify: !!cur || !!ch }
  }
  if (!cur) return { action: 'retarget', index: 0, notify: false }

  const nextIndex = tracks.findIndex(a => normalizeAudioId(a?.id) === cur)
  const currentGone = nextIndex < 0
  const nextSrc = nextIndex >= 0 ? normalizeAudioSrc(tracks[nextIndex].src) : ''
  const editingCurrent = !!ch && ch === cur
  const srcChanged = editingCurrent && nextSrc !== loaded

  if (currentGone) return { action: 'retarget', index: 0, notify: editingCurrent }
  if (srcChanged) return { action: 'reload', index: nextIndex, notify: true }
  return { action: 'keep', index: nextIndex, notify: false }
}

/**
 * 删除一条音轨后应落到的 index。列表已空返回 -1。
 * 删的是当前正在播的那条时，落到剩余列表的第一条（不自动续播）。
 * 两个下标都必须是同一套可播列表（auTracks），不能拿 cfg.audio 下标进来。
 */
export function nextAudioIndexAfterDelete(prevIndex, deletedIndex, remainingCount) {
  const remain = Math.max(0, Math.floor(Number(remainingCount) || 0))
  if (remain === 0) return -1
  const prev = Number.isFinite(Number(prevIndex)) ? Math.floor(Number(prevIndex)) : -1
  const del = Number(deletedIndex)
  if (prev < 0) return 0
  if (!Number.isFinite(del)) return Math.min(prev, remain - 1)
  if (del === prev) return 0
  if (del < prev) return Math.min(prev - 1, remain - 1)
  return Math.min(prev, remain - 1)
}

/**
 * 编辑器删掉一条配置音轨后，预览播放器该落到哪。
 * 用音轨 ID 对齐，不假设 cfg.audio index === auTracks index。
 * 删的若本来就不可播（无 src），不碰当前试听。
 */
export function audioDeletePlaybackPlan({ currentId, removedId, playableBefore } = {}) {
  const prev = Array.isArray(playableBefore) ? playableBefore : []
  const cur = normalizeAudioId(currentId)
  const removed = normalizeAudioId(removedId)
  const prevIndex = cur ? prev.findIndex(a => normalizeAudioId(a?.id) === cur) : -1
  const deletedIndex = removed ? prev.findIndex(a => normalizeAudioId(a?.id) === removed) : -1
  const after = deletedIndex >= 0 ? prev.filter((_, i) => i !== deletedIndex) : prev.slice()
  if (!after.length) return { index: -1, currentGone: true }
  if (deletedIndex < 0) {
    const byId = cur ? after.findIndex(a => normalizeAudioId(a?.id) === cur) : -1
    return { index: byId >= 0 ? byId : 0, currentGone: false }
  }
  const index = nextAudioIndexAfterDelete(prevIndex, deletedIndex, after.length)
  const nextId = index >= 0 ? normalizeAudioId(after[index]?.id) : ''
  return {
    index,
    currentGone: deletedIndex === prevIndex || (!!cur && nextId !== cur),
  }
}

export function normalizeAudioId(id) {
  return typeof id === 'string' ? id.trim() : ''
}

export function audioIdIssue(id) {
  if (id == null) return 'missing'
  if (typeof id === 'string') return id.trim() ? null : 'empty'
  return 'invalid'
}

export function nextAudioIdFromUsed(used) {
  for (let n = 1; ; n++) {
    const cand = 'a' + n
    if (!used.has(cand)) return cand
  }
}

export function nextAudioId(list) {
  const used = new Set()
  for (const a of list || []) {
    const id = normalizeAudioId(a?.id)
    if (id) used.add(id)
  }
  return nextAudioIdFromUsed(used)
}

export function auditAudioIds(list) {
  const invalid = []
  let missing = 0
  const seen = new Map()
  const dupes = []
  for (let i = 0; i < (list || []).length; i++) {
    const a = list[i]
    if (!a || typeof a !== 'object') continue
    const issue = audioIdIssue(a.id)
    if (issue) {
      if (issue === 'empty' || issue === 'missing') missing++
      else invalid.push({ index: i, issue })
      continue
    }
    const id = normalizeAudioId(a.id)
    const n = (seen.get(id) || 0) + 1
    seen.set(id, n)
    if (n === 2) dupes.push(id)
  }
  return { invalid, missing, dupes: [...new Set(dupes)] }
}

export function hotspotsBoundToAudio(hotspots, audioId) {
  const id = normalizeAudioId(audioId)
  if (!id) return []
  const hits = []
  for (let i = 0; i < (hotspots || []).length; i++) {
    if (normalizeAudioId(hotspots[i]?.audio) === id) hits.push(i)
  }
  return hits
}

export function unbindHotspotsFromAudio(hotspots, audioId) {
  const id = normalizeAudioId(audioId)
  if (!id) return 0
  let n = 0
  for (const h of hotspots || []) {
    if (h && normalizeAudioId(h.audio) === id) {
      delete h.audio
      n++
    }
  }
  return n
}

export function orphanHotspotAudioRefs(hotspots, audio) {
  const ids = new Set()
  for (const a of audio || []) {
    const id = normalizeAudioId(a?.id)
    if (id) ids.add(id)
  }
  const orphans = []
  for (let i = 0; i < (hotspots || []).length; i++) {
    const ref = normalizeAudioId(hotspots[i]?.audio)
    if (ref && !ids.has(ref)) orphans.push({ index: i, audio: ref })
  }
  return orphans
}

export function audioDeleteImpact(hotspots, audioId) {
  const indexes = hotspotsBoundToAudio(hotspots, audioId)
  const count = indexes.length
  return {
    count,
    indexes,
    confirmText: count
      ? `这条语音正在被 ${count} 个热点使用。\n删除后这些热点将取消语音绑定，是否继续？`
      : '',
  }
}

/** 保存阻断项为 errs；缺文件仍为 warns。 */
export function audioConfigIssues(audio, hotspots) {
  const errs = []
  const warns = []
  const list = Array.isArray(audio) ? audio : []
  const audit = auditAudioIds(list)
  if (audit.missing) errs.push(`语音缺 id：${audit.missing} 个`)
  if (audit.invalid.length) {
    errs.push('语音 id 类型非法：' + audit.invalid.map(x => `#${x.index + 1}`).join(' · '))
  }
  if (audit.dupes.length) errs.push('语音 id 重复：' + audit.dupes.join(', '))
  for (const a of list) {
    if (!a || !normalizeAudioSrc(a.src)) warns.push('语音「' + ((a && a.label) || (a && a.id) || '?') + '」缺文件')
  }
  for (const o of orphanHotspotAudioRefs(hotspots, list)) {
    errs.push(`热点 #${o.index + 1} 引用不存在的语音 ${o.audio}`)
  }
  return { errs, warns }
}
