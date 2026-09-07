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

/** 失败态或切轨后，当前源必须重拉，不能沿用已经 error 过的 <audio src>。 */
export function shouldReloadAudioSrc(prevIndex, nextIndex, inError) {
  return !!inError || prevIndex !== nextIndex
}
