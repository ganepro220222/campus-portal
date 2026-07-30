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
