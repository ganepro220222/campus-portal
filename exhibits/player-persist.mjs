/**
 * Camera / exposure persistence helpers (shared by player + unit tests).
 * Save/load use the same pivot-relative spherical convention.
 */
export function applyExposureToCfg(cfg, value) {
  cfg.renderer = cfg.renderer || {}
  cfg.renderer.exposure = value
  return value
}

/** @param {[number,number,number]} cameraPos @param {[number,number,number]} target */
export function cameraSphericalFromTarget(cameraPos, target) {
  const dx = cameraPos[0] - target[0]
  const dy = cameraPos[1] - target[1]
  const dz = cameraPos[2] - target[2]
  const radius = Math.hypot(dx, dy, dz)
  const phi = radius === 0 ? 0 : Math.acos(Math.max(-1, Math.min(1, dy / radius)))
  const theta = Math.atan2(dx, dz)
  return {
    distance: +radius.toFixed(3),
    phi: +phi.toFixed(3),
    theta: +theta.toFixed(3),
  }
}

/** @param {{distance:number,phi:number,theta:number}} sp @param {[number,number,number]} pivot */
export function cameraPositionFromSpherical(sp, pivot) {
  const r = sp.distance
  const sinPhi = Math.sin(sp.phi)
  const x = r * sinPhi * Math.sin(sp.theta)
  const y = r * Math.cos(sp.phi)
  const z = r * sinPhi * Math.cos(sp.theta)
  return [+(x + pivot[0]).toFixed(6), +(y + pivot[1]).toFixed(6), +(z + pivot[2]).toFixed(6)]
}

export function configFetchUrl(base) {
  return base + 'config.json?_=' + Date.now()
}

export function configExportFilename(exhibitDir) {
  const ex = String(exhibitDir || '').replace(/^\/+|\/+$/g, '')
  return ex ? `${ex}.config.json` : 'config.json'
}

function positiveMs(v) {
  return (typeof v === 'number' && isFinite(v) && v > 0) ? v : null
}

/** First positive ms from sources, else fallback. */
export function timeoutFromSources(sources, fallback) {
  for (const s of sources) {
    const t = positiveMs(s)
    if (t != null) return t
  }
  return fallback
}

/** Config fetch absolute timeout (falls back to bootTimeoutMs). */
export function configTimeoutMs(cfg, player, testHook) {
  return timeoutFromSources([
    testHook?.configTimeoutMs?.(),
    testHook?.configTimeout?.(),
    player?.configTimeoutMs,
    player?.configTimeout,
    cfg?.performance?.configTimeoutMs,
    cfg?.performance?.configTimeout,
    player?.bootTimeoutMs,
    player?.bootTimeout,
    cfg?.performance?.bootTimeoutMs,
    cfg?.performance?.bootTimeout,
    testHook?.bootTimeoutMs?.(),
  ], 12000)
}

/** Model download idle timeout — reset when loaded bytes increase. */
export function modelIdleTimeoutMs(cfg, player, testHook) {
  return timeoutFromSources([
    testHook?.modelIdleTimeoutMs?.(),
    testHook?.modelIdleTimeout?.(),
    player?.modelIdleTimeoutMs,
    player?.modelIdleTimeout,
    cfg?.performance?.modelIdleTimeoutMs,
    cfg?.performance?.modelIdleTimeout,
  ], 20000)
}

/** Model download absolute cap regardless of progress. */
export function modelTotalTimeoutMs(cfg, player, testHook) {
  return timeoutFromSources([
    testHook?.modelTotalTimeoutMs?.(),
    testHook?.modelTotalTimeout?.(),
    player?.modelTotalTimeoutMs,
    player?.modelTotalTimeout,
    cfg?.performance?.modelTotalTimeoutMs,
    cfg?.performance?.modelTotalTimeout,
  ], 120000)
}

/**
 * 露出模型前等待全景 IBL 的上限。
 *
 * 其余每条启动腿都有显式超时（配置 12s、模型空闲 20s / 总量 120s、模块 watchdog 12s），
 * 唯独「等全景就绪再露出」这一腿没有——它靠浏览器自己放弃那个请求。实测把全景请求
 * 挂起（服务端收下连接就是不回，弱网 / 门户认证下很常见）时，Chromium 拖了 21 秒才
 * 落到兜底；换个把连接握得更久的浏览器或运营商网络，用户会一直盯着「正在准备环境光照…」。
 * 超时不算失败：全景本来就只影响环境光，到点直接用兜底环境露出模型即可。
 */
export function panoramaRevealTimeoutMs(cfg, player, testHook) {
  return timeoutFromSources([
    testHook?.panoramaRevealTimeoutMs?.(),
    testHook?.panoramaRevealTimeout?.(),
    player?.panoramaRevealTimeoutMs,
    player?.panoramaRevealTimeout,
    cfg?.performance?.panoramaRevealTimeoutMs,
    cfg?.performance?.panoramaRevealTimeout,
  ], 8000)
}

/** Safari/微信：8042 全景客户端 PMREM 易触发 WebContent 被杀；A/B 验证 2048 稳定。 */
export const DEFAULT_STRICT_WEBKIT_PANORAMA_MAX_WIDTH = 2048

/** Max equirect width before PMREM; 0 = no downscale. URL override wins, then config, then strict default. */
export function strictWebKitPanoramaMaxWidth(cfg, strictWebKit, urlOverride = 0) {
  if (typeof urlOverride === 'number' && urlOverride > 0) return urlOverride
  if (!strictWebKit) return 0
  const cfgVal = cfg?.performance?.strictWebKitPanoramaMaxWidth
  if (typeof cfgVal === 'number' && cfgVal > 0) return cfgVal
  return DEFAULT_STRICT_WEBKIT_PANORAMA_MAX_WIDTH
}

/** Idle timer resets on download progress; cleared once loaded >= total. Total caps entire load. */
export function createModelLoadTimers({ idleMs, totalMs, onIdle, onTotal, onDownloadComplete }) {
  let idleTimer = 0
  let totalTimer = 0
  let lastLoaded = -1
  let downloadComplete = false
  let lengthUnknown = false
  const clearIdle = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = 0
  }
  const clear = () => {
    clearIdle()
    if (totalTimer) clearTimeout(totalTimer)
    totalTimer = 0
  }
  const bumpIdle = () => {
    if (downloadComplete || lengthUnknown) return
    clearIdle()
    idleTimer = setTimeout(() => { onIdle?.() }, idleMs)
  }
  const markDownloadComplete = () => {
    if (downloadComplete) return
    downloadComplete = true
    clearIdle()
    onDownloadComplete?.()
  }
  const start = () => {
    clear()
    lastLoaded = -1
    downloadComplete = false
    lengthUnknown = false
    // Idle arms only after known Content-Length progress; unknown total uses totalMs cap only.
    totalTimer = setTimeout(() => { onTotal?.() }, totalMs)
  }
  const progress = (loaded, total) => {
    if (typeof loaded !== 'number') return
    const hasTotal = typeof total === 'number' && total > 0
    if (!hasTotal) {
      lengthUnknown = true
      clearIdle()
      if (loaded > lastLoaded) lastLoaded = loaded
      return
    }
    lengthUnknown = false
    if (hasTotal && loaded >= total) {
      if (loaded > lastLoaded) lastLoaded = loaded
      markDownloadComplete()
      return
    }
    if (loaded > lastLoaded) {
      lastLoaded = loaded
      bumpIdle()
    }
  }
  return {
    start,
    progress,
    clear,
    isDownloadComplete: () => downloadComplete,
    isLengthUnknown: () => lengthUnknown,
  }
}
