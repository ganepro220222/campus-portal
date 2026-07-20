/** 热点引线二维几何（纯函数，可单测） */

export const PANEL_HOTSPOT_GAP = 20
export const ORTH_MIN_SEG = 4

export function clampN(v, lo, hi) { return Math.min(Math.max(v, lo), hi) }

export function panelBounds(cardX, cardY, cw, ch, pad = 8) {
  return { l: cardX + pad, r: cardX + cw - pad, t: cardY + pad, b: cardY + ch - pad }
}

export function hotspotInsidePanel(mx, my, cardX, cardY, cw, ch) {
  return mx >= cardX && mx <= cardX + cw && my >= cardY && my <= cardY + ch
}

/** 热点到面板矩形的有符号净空（正=外，负=内） */
export function hotspotClearance(mx, my, cardX, cardY, cw, ch) {
  const dx = mx < cardX ? cardX - mx : mx > cardX + cw ? mx - (cardX + cw) : -Math.min(mx - cardX, cardX + cw - mx)
  const dy = my < cardY ? cardY - my : my > cardY + ch ? my - (cardY + ch) : -Math.min(my - cardY, cardY + ch - my)
  if (dx <= 0 && dy <= 0) return -Math.min(-dx, -dy)
  if (dx <= 0) return dy
  if (dy <= 0) return dx
  return Math.hypot(dx, dy)
}

export function panelHotspotClear(mx, my, cardX, cardY, cw, ch, gap = PANEL_HOTSPOT_GAP) {
  return hotspotClearance(mx, my, cardX, cardY, cw, ch) >= gap
}

export function panelHotspotCollision(mx, my, cardX, cardY, cw, ch, gap = PANEL_HOTSPOT_GAP) {
  return !panelHotspotClear(mx, my, cardX, cardY, cw, ch, gap)
}

function nudgeCandidates(mx, my, cw, ch, gap) {
  return [
    { cardX: mx + gap, cardY: null },
    { cardX: mx - gap - cw, cardY: null },
    { cardX: null, cardY: my + gap },
    { cardX: null, cardY: my - gap - ch },
  ]
}

function applyNudgeCand(c, cardX, cardY) {
  return { cardX: c.cardX ?? cardX, cardY: c.cardY ?? cardY }
}

function evalPanelPos(mx, my, cardX, cardY, cw, ch, origX, origY, maxX, viewport) {
  const cl = clampPanel(cardX, cardY, cw, ch, maxX, viewport)
  return {
    cardX: cl.x,
    cardY: cl.y,
    clear: hotspotClearance(mx, my, cl.x, cl.y, cw, ch),
    move: Math.hypot(cl.x - origX, cl.y - origY),
  }
}

function comparePanelChoice(a, b) {
  const aOk = a.clear >= 0, bOk = b.clear >= 0
  if (aOk !== bOk) return aOk ? -1 : 1
  if (Math.abs(a.clear - b.clear) > 1e-6) return b.clear - a.clear
  if (Math.abs(a.move - b.move) > 1e-6) return a.move - b.move
  if (a.cardX !== b.cardX) return a.cardX - b.cardX
  return a.cardY - b.cardY
}

function anchorPanelPositions(maxX, viewport) {
  const minX = viewport.minX ?? 8
  const minY = viewport.minY ?? 66
  const maxY = viewport.maxY ?? minY
  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2
  const xs = [minX, maxX, midX]
  const ys = [minY, maxY, midY]
  const out = []
  for (const x of xs) for (const y of ys) out.push({ cardX: x, cardY: y })
  return out
}

function collectPanelPositions(mx, my, cw, ch, cardX, cardY, gap) {
  const out = []
  for (const raw of nudgeCandidates(mx, my, cw, ch, gap)) out.push(applyNudgeCand(raw, cardX, cardY))
  return out
}

function pickBestPanel(mx, my, cw, ch, origX, origY, maxX, viewport, positions, minClear) {
  let best = null
  for (const pos of positions) {
    const ev = evalPanelPos(mx, my, pos.cardX, pos.cardY, cw, ch, origX, origY, maxX, viewport)
    if (ev.clear < minClear) continue
    if (!best || comparePanelChoice(ev, best) < 0) best = ev
  }
  return best
}

function pickMaxClearancePanel(mx, my, cw, ch, origX, origY, maxX, viewport, positions) {
  let best = null
  for (const pos of positions) {
    const ev = evalPanelPos(mx, my, pos.cardX, pos.cardY, cw, ch, origX, origY, maxX, viewport)
    if (!best || comparePanelChoice(ev, best) < 0) best = ev
  }
  return best
}

/**
 * 面板推离热点。返回 { cardX, cardY, degraded, clearance, panelOverlap?, reserveRelaxed? }。
 * 阶段：目标 gap → 缩小 gap → 锚点且 clearance≥0 → 放宽编辑保留区 → 最大化净空。
 */
export function nudgePanelFromHotspot(mx, my, cardX, cardY, cw, ch, viewport = {}) {
  const targetGap = viewport.gap ?? PANEL_HOTSPOT_GAP
  const maxX = viewport.maxX ?? cardX
  const relaxedMaxX = viewport.relaxedMaxX ?? maxX
  const origX = cardX, origY = cardY
  const base = clampPanelPos(cardX, cardY, cw, ch, viewport)
  const gaps = [...new Set([targetGap, 16, 12, 8, 4, 0])].sort((a, b) => b - a)
  const anchors = anchorPanelPositions(maxX, viewport)
  const relaxedAnchors = anchorPanelPositions(relaxedMaxX, viewport)

  if (panelHotspotClear(mx, my, base.cardX, base.cardY, cw, ch, targetGap)) {
    return { ...base, degraded: false, clearance: hotspotClearance(mx, my, base.cardX, base.cardY, cw, ch) }
  }

  for (const gap of gaps) {
    const positions = collectPanelPositions(mx, my, cw, ch, cardX, cardY, gap)
    const best = pickBestPanel(mx, my, cw, ch, origX, origY, maxX, viewport, positions, gap)
    if (best) {
      return {
        cardX: best.cardX,
        cardY: best.cardY,
        degraded: gap < targetGap,
        clearance: best.clear,
      }
    }
  }

  let positions = []
  for (const gap of gaps) positions.push(...collectPanelPositions(mx, my, cw, ch, cardX, cardY, gap))
  positions.push(...anchors)
  let best = pickBestPanel(mx, my, cw, ch, origX, origY, maxX, viewport, positions, 0)
  let reserveRelaxed = false

  if (!best && relaxedMaxX > maxX) {
    positions = []
    for (const gap of gaps) positions.push(...collectPanelPositions(mx, my, cw, ch, cardX, cardY, gap))
    positions.push(...relaxedAnchors)
    best = pickBestPanel(mx, my, cw, ch, origX, origY, relaxedMaxX, viewport, positions, 0)
    reserveRelaxed = !!best
  }

  if (!best) {
    positions = []
    for (const gap of gaps) positions.push(...collectPanelPositions(mx, my, cw, ch, cardX, cardY, gap))
    positions.push(...anchors, ...relaxedAnchors)
    const strict = pickMaxClearancePanel(mx, my, cw, ch, origX, origY, maxX, viewport, positions)
    const relaxed = relaxedMaxX > maxX
      ? pickMaxClearancePanel(mx, my, cw, ch, origX, origY, relaxedMaxX, viewport, positions)
      : null
    best = relaxed && comparePanelChoice(relaxed, strict) < 0 ? relaxed : strict
    reserveRelaxed = !!(relaxed && best === relaxed)
  }

  const clearance = best?.clear ?? hotspotClearance(mx, my, base.cardX, base.cardY, cw, ch)
  return {
    cardX: best?.cardX ?? base.cardX,
    cardY: best?.cardY ?? base.cardY,
    degraded: clearance < targetGap || reserveRelaxed,
    clearance,
    panelOverlap: clearance < 0,
    reserveRelaxed,
  }
}

export function parseLeaderOpts(P) {
  P = P || {}
  return {
    leader: P.leader || 'elbow',
    dir: P.dir || 'auto',
    stub: Math.max(16, num(P.leaderGap, 48)),
    tail: num(P.leaderTail, 0),
    mode: P.elbowMode || 'orthogonal',
    leg1Axis: P.leg1Axis || 'auto',
    leg2Axis: P.leg2Axis || 'auto',
  }
}

function num(v, d) { return (typeof v === 'number' && isFinite(v)) ? v : d }

export const LEG2_AUTO_TAIL = 40

export function interiorAngle(mx, my, kx, ky, ax, ay) {
  const v1x = mx - kx, v1y = my - ky, v2x = ax - kx, v2y = ay - ky
  const l1 = Math.hypot(v1x, v1y) || 1, l2 = Math.hypot(v2x, v2y) || 1
  return Math.acos(clampN((v1x / l1 * v2x / l2 + v1y / l1 * v2y / l2), -1, 1)) * 180 / Math.PI
}

export function isRightAngle(mx, my, kx, ky, ax, ay, eps = 0.01) {
  const dx1 = kx - mx, dy1 = ky - my, dx2 = ax - kx, dy2 = ay - ky
  if (Math.hypot(dx1, dy1) < ORTH_MIN_SEG || Math.hypot(dx2, dy2) < ORTH_MIN_SEG) return false
  return Math.abs(dx1 * dx2 + dy1 * dy2) < eps
}

function orthSegLens(mx, my, c) {
  return {
    l1: Math.hypot(c.kx - mx, c.ky - my),
    l2: Math.hypot(c.ax - c.kx, c.ay - c.ky),
  }
}

function orthCandidatesHFirst(mx, my, b) {
  const out = []
  for (const ax of [b.l, b.r]) {
    const ay = clampN(my, b.t, b.b)
    out.push({ kx: ax, ky: my, ax, ay, first: 'h' })
  }
  for (const ay of [b.t, b.b]) {
    const ax = clampN(mx, b.l, b.r)
    if (Math.abs(ax - mx) >= ORTH_MIN_SEG) out.push({ kx: ax, ky: my, ax, ay, first: 'h' })
  }
  return out
}

function orthCandidatesVFirst(mx, my, b) {
  const out = []
  for (const ay of [b.t, b.b]) {
    const ax = clampN(mx, b.l, b.r)
    out.push({ kx: mx, ky: ay, ax, ay, first: 'v' })
  }
  for (const ax of [b.l, b.r]) {
    const ay = clampN(my, b.t, b.b)
    if (Math.abs(ay - my) >= ORTH_MIN_SEG) out.push({ kx: mx, ky: ay, ax, ay, first: 'v' })
  }
  return out
}

function orthScore(mx, my, c, b) {
  const { l1, l2 } = orthSegLens(mx, my, c)
  const cx = (b.l + b.r) / 2, cy = (b.t + b.b) / 2
  let face = 0
  if (c.first === 'h') {
    if (mx < b.l && c.ax === b.l) face -= 80
    if (mx > b.r && c.ax === b.r) face -= 80
  } else {
    if (my < b.t && c.ay === b.t) face -= 80
    if (my > b.b && c.ay === b.b) face -= 80
  }
  if (Math.abs(mx - cx) >= Math.abs(cy - my) && c.first === 'h') face -= 12
  if (Math.abs(mx - cx) < Math.abs(cy - my) && c.first === 'v') face -= 12
  return face + l1 + l2
}

function orthCandTieBreak(a, b) {
  if (a.kx !== b.kx) return a.kx - b.kx
  if (a.ky !== b.ky) return a.ky - b.ky
  if (a.ax !== b.ax) return a.ax - b.ax
  return a.ay - b.ay
}

function pickOrthCandidate(mx, my, cands, preferFirst) {
  let best = null, bs = 1e18
  for (const c of cands) {
    if (!isRightAngle(mx, my, c.kx, c.ky, c.ax, c.ay)) continue
    let s = orthScore(mx, my, c, c._b)
    if (preferFirst && c.first === preferFirst) s -= 0.01
    if (!best || s < bs - 1e-9 || (Math.abs(s - bs) < 1e-9 && orthCandTieBreak(c, best) < 0)) {
      bs = s
      best = c
    }
  }
  return best
}

export function validateOrthPath(mx, my, path, leg1Axis) {
  const { kx, ky, ax, ay } = path
  const l1 = Math.hypot(kx - mx, ky - my)
  const l2 = Math.hypot(ax - kx, ay - ky)
  if (![mx, my, kx, ky, ax, ay, l1, l2].every(Number.isFinite)) return false
  if (l1 < ORTH_MIN_SEG || l2 < ORTH_MIN_SEG) return false
  if (!isRightAngle(mx, my, kx, ky, ax, ay)) return false
  if (leg1Axis === 'h' && Math.abs(ky - my) > 0.5) return false
  if (leg1Axis === 'v' && Math.abs(kx - mx) > 0.5) return false
  return true
}

function hotspotInsideBounds(mx, my, b) {
  return mx >= b.l && mx <= b.r && my >= b.t && my <= b.b
}

function orthCandidatesInsideEscape(mx, my, b) {
  const distL = mx - b.l, distR = b.r - mx, distT = my - b.t, distB = b.b - my
  const midX = (b.l + b.r) / 2, midY = (b.t + b.b) / 2
  const out = []
  if (distL > 0) out.push({ kx: b.l, ky: my, ax: b.l, ay: my <= midY ? b.t : b.b, first: 'h' })
  if (distR > 0) out.push({ kx: b.r, ky: my, ax: b.r, ay: my <= midY ? b.t : b.b, first: 'h' })
  if (distT > 0) out.push({ kx: mx, ky: b.t, ax: mx <= midX ? b.l : b.r, ay: b.t, first: 'v' })
  if (distB > 0) out.push({ kx: mx, ky: b.b, ax: mx <= midX ? b.l : b.r, ay: b.b, first: 'v' })
  return out
}

function orthFallback(mx, my, cardX, cardY, cw, ch, leg1Axis) {
  const b = panelBounds(cardX, cardY, cw, ch)
  if (hotspotInsideBounds(mx, my, b)) {
    const cands = orthCandidatesInsideEscape(mx, my, b).map(c => ({ ...c, _b: b }))
    const best = pickOrthCandidate(mx, my, cands)
    if (best) return best
  }
  if (leg1Axis === 'h') {
    const kx = (mx - b.l) <= (b.r - mx) ? b.l : b.r
    const ay = clampN(my, b.t, b.b)
    return { kx, ky: my, ax: kx, ay, first: 'h' }
  }
  if (leg1Axis === 'v') {
    const ky = (my - b.t) <= (b.b - my) ? b.t : b.b
    const ax = clampN(mx, b.l, b.r)
    return { kx: mx, ky, ax, ay: ky, first: 'v' }
  }
  const [eax, eay] = panelEdgeAnchor(mx, my, cardX, cardY, cw, ch)
  if (Math.abs(eax - mx) >= Math.abs(eay - my)) {
    return { kx: eax, ky: my, ax: eax, ay: eay, first: 'h' }
  }
  return { kx: mx, ky: eay, ax: eax, ay: eay, first: 'v' }
}

function finalizeOrth(mx, my, raw, leg1Axis) {
  if (validateOrthPath(mx, my, raw, leg1Axis)) return raw
  const { l1, l2 } = orthSegLens(mx, my, raw)
  if (leg1Axis === 'h' && Math.abs(raw.ky - my) < ORTH_MIN_SEG && l2 >= ORTH_MIN_SEG) {
    const fixed = { ...raw, kx: raw.ax, ky: my, first: 'h' }
    if (validateOrthPath(mx, my, fixed, leg1Axis)) return fixed
  }
  if (leg1Axis === 'v' && Math.abs(raw.kx - mx) < ORTH_MIN_SEG && l2 >= ORTH_MIN_SEG) {
    const fixed = { ...raw, kx: mx, ky: raw.ay, first: 'v' }
    if (validateOrthPath(mx, my, fixed, leg1Axis)) return fixed
  }
  return null
}

export function resolveOrthogonal(mx, my, cardX, cardY, cw, ch, panel, preferFirst) {
  const b = panelBounds(cardX, cardY, cw, ch)
  const O = parseLeaderOpts(panel)
  let pool = []
  if (hotspotInsideBounds(mx, my, b)) {
    pool = orthCandidatesInsideEscape(mx, my, b)
    if (O.leg1Axis === 'h') pool = pool.filter(c => c.first === 'h')
    else if (O.leg1Axis === 'v') pool = pool.filter(c => c.first === 'v')
  } else if (O.leg1Axis === 'h') pool = orthCandidatesHFirst(mx, my, b)
  else if (O.leg1Axis === 'v') pool = orthCandidatesVFirst(mx, my, b)
  else pool = [...orthCandidatesHFirst(mx, my, b), ...orthCandidatesVFirst(mx, my, b)]
  pool = pool.map(c => ({ ...c, _b: b }))
  const best = pickOrthCandidate(mx, my, pool, preferFirst)
  const raw = best || orthFallback(mx, my, cardX, cardY, cw, ch, O.leg1Axis)
  const fin = finalizeOrth(mx, my, raw, O.leg1Axis)
  if (fin) return { kx: fin.kx, ky: fin.ky, ax: fin.ax, ay: fin.ay, first: fin.first }
  const [ax, ay] = nearestAnchor(cardX, cardY, cw, ch, mx, my)
  return { kx: ax, ky: ay, ax, ay, first: 'straight', leaderFallback: 'straight' }
}

export function leaderAxis(dir, mx, my, ax, ay) {
  if (dir === 'up' || dir === 'down') return 'v'
  if (dir === 'left' || dir === 'right' || dir === 'upleft' || dir === 'upright' || dir === 'downleft' || dir === 'downright') return 'h'
  return Math.abs(ax - mx) >= Math.abs(ay - my) ? 'h' : 'v'
}

export function leaderSign1(dir, axis, mx, my, ax, ay) {
  const m = { left: ['h', -1], right: ['h', 1], up: ['v', -1], down: ['v', 1],
    upleft: ['h', -1], upright: ['h', 1], downleft: ['h', -1], downright: ['h', 1] }
  if (m[dir]) return m[dir][1]
  if (axis === 'h') return ax >= mx ? 1 : -1
  return ay >= my ? 1 : -1
}

export function leg1LockedKnee(mx, my, axis, s1, stub) {
  if (axis === 'h') return [mx + s1 * stub, my]
  return [mx, my + s1 * stub]
}

export function panelEdgeAnchor(mx, my, cardX, cardY, cw, ch) {
  const b = panelBounds(cardX, cardY, cw, ch)
  const cands = [
    [b.l, clampN(my, b.t, b.b)],
    [b.r, clampN(my, b.t, b.b)],
    [clampN(mx, b.l, b.r), b.t],
    [clampN(mx, b.l, b.r), b.b],
  ]
  let best = cands[0], bd = 1e9
  for (const c of cands) {
    const d = Math.hypot(c[0] - mx, c[1] - my)
    if (d < bd) { bd = d; best = c }
  }
  return best
}

export function anchor90(kx, ky, cardX, cardY, cw, ch) {
  const b = panelBounds(cardX, cardY, cw, ch)
  const cands = []
  if (kx >= b.l && kx <= b.r) cands.push([kx, b.t], [kx, b.b])
  if (ky >= b.t && ky <= b.b) cands.push([b.l, ky], [b.r, ky])
  if (!cands.length) return [clampN(kx, b.l, b.r), clampN(ky, b.t, b.b)]
  let best = cands[0], bd = 1e9
  for (const c of cands) {
    const d = Math.hypot(c[0] - kx, c[1] - ky)
    if (d < bd) { bd = d; best = c }
  }
  return best
}

export function leg2LockedKnee(mx, my, ax, ay, panel) {
  const O = parseLeaderOpts(panel)
  const sec = O.leg2Axis === 'h' ? 'h' : O.leg2Axis === 'v' ? 'v' : (leaderAxis(O.dir, mx, my, ax, ay) === 'h' ? 'v' : 'h')
  const len2 = O.tail > 0 ? O.tail : LEG2_AUTO_TAIL
  if (sec === 'h') return [ax + (mx > ax ? len2 : -len2), ay]
  return [ax, ay + (my > ay ? len2 : -len2)]
}

export function elbow2(mx, my, kx, ky, ax, ay) { return [[mx, my], [kx, ky], [ax, ay]] }

export function nearestAnchor(cardX, cardY, cw, ch, mx, my) {
  return [clampN(mx, cardX + 8, cardX + cw - 8), clampN(my, cardY + 8, cardY + ch - 8)]
}

export function packCalloutPos(x, y, vw, vh) { return { x, y, vw, vh } }

export function unpackCalloutPos(pos, vw, vh) {
  if (!pos) return null
  if (pos.vw && pos.vh) return { x: pos.x * vw / pos.vw, y: pos.y * vh / pos.vh }
  return { x: pos.x, y: pos.y }
}

export function clampPanel(cardX, cardY, cw, ch, maxX, viewport = {}) {
  const minX = viewport.minX ?? 8
  const minY = viewport.minY ?? 66
  const maxY = viewport.maxY ?? (typeof globalThis.innerHeight === 'number' ? globalThis.innerHeight - ch - 24 : 900)
  return { x: clampN(cardX, minX, maxX), y: clampN(cardY, minY, maxY) }
}

function clampPanelPos(cardX, cardY, cw, ch, viewport) {
  const cl = clampPanel(cardX, cardY, cw, ch, viewport.maxX ?? cardX, viewport)
  return { cardX: cl.x, cardY: cl.y }
}

export function layoutPanelFromHotspot(mx, my, cardX, cardY, cw, ch, viewport = {}) {
  return nudgePanelFromHotspot(mx, my, cardX, cardY, cw, ch, viewport)
}

export function resolveCalloutGeom(mx, my, cw, ch, panel, hs, layout, viewport = {}) {
  const pl = layoutPanelFromHotspot(mx, my, layout.cardX, layout.cardY, cw, ch, viewport)
  const { cardX, cardY, degraded, clearance, panelOverlap, reserveRelaxed } = pl
  const O = parseLeaderOpts(panel)
  const panelMeta = { panelDegraded: degraded, panelClearance: clearance, panelOverlap, reserveRelaxed }
  const preferFirst = hs?.calloutOrthFirst

  function straightResult(reason) {
    const [ax, ay] = nearestAnchor(cardX, cardY, cw, ch, mx, my)
    const l1 = Math.hypot(ax - mx, ay - my)
    return {
      cardX, cardY, ax, ay,
      pts: [[mx, my], [ax, ay]],
      meta: { l1, l2: 0, ang: 180, leaderFallback: reason, ...panelMeta },
    }
  }

  if (O.leader === 'straight' || O.leader === 'line') {
    return straightResult(null)
  }
  if (O.mode === 'orthogonal') {
    if (panelOverlap) return straightResult('panel-overlap')
    const orth = resolveOrthogonal(mx, my, cardX, cardY, cw, ch, panel, preferFirst)
    if (orth.leaderFallback === 'straight' || !validateOrthPath(mx, my, orth, O.leg1Axis)) {
      return straightResult('invalid-orthogonal')
    }
    const { kx, ky, ax, ay, first } = orth
    const ang = interiorAngle(mx, my, kx, ky, ax, ay)
    const l1 = Math.hypot(kx - mx, ky - my), l2 = Math.hypot(ax - kx, ay - ky)
    if (hs) hs.calloutOrthFirst = first
    return { cardX, cardY, ax, ay, pts: elbow2(mx, my, kx, ky, ax, ay), meta: { kx, ky, ang, l1, l2, ...panelMeta } }
  }
  const edge = panelEdgeAnchor(mx, my, cardX, cardY, cw, ch)
  let ax = edge[0], ay = edge[1]
  let kx, ky
  if (O.mode === 'leg2-lock') {
    ;[kx, ky] = leg2LockedKnee(mx, my, ax, ay, panel)
  } else {
    const axis = O.leg1Axis === 'h' ? 'h' : O.leg1Axis === 'v' ? 'v' : leaderAxis(O.dir, mx, my, ax, ay)
    const s1 = leaderSign1(O.dir, axis, mx, my, ax, ay)
    if (hs?.leaderKneeManual && Array.isArray(hs.leaderKnee)) {
      kx = mx + hs.leaderKnee[0]; ky = my + hs.leaderKnee[1]
    } else {
      ;[kx, ky] = leg1LockedKnee(mx, my, axis, s1, O.stub)
    }
    ;[ax, ay] = anchor90(kx, ky, cardX, cardY, cw, ch)
  }
  const ang = interiorAngle(mx, my, kx, ky, ax, ay)
  const l1 = Math.hypot(kx - mx, ky - my), l2 = Math.hypot(ax - kx, ay - ky)
  return { cardX, cardY, ax, ay, pts: elbow2(mx, my, kx, ky, ax, ay), meta: { kx, ky, ang, l1, l2, ...panelMeta } }
}

export function migratePanelLeader(panel) {
  if (!panel || panel.elbowMode !== 'leg2-lock') return panel
  if (!panel.leg2Axis && panel.leg1Axis && panel.leg1Axis !== 'auto') {
    return { ...panel, leg2Axis: panel.leg1Axis }
  }
  return panel
}

/** 属性测试：随机布局下几何不变量（固定 seed） */
export function probeLeaderLayouts(seed = 42, count = 2000) {
  let s = seed
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
  const stats = { total: 0, badAngle: 0, zeroSeg: 0, badDir: 0, nan: 0, overlap: 0, straightFallback: 0 }
  const modes = ['auto', 'h', 'v']
  for (let i = 0; i < count; i++) {
    for (const leg1Axis of modes) {
      stats.total++
      const mx = rnd() * 900, my = rnd() * 700 + 60
      const cw = 120 + rnd() * 200, ch = 80 + rnd() * 120
      const maxX = 900 - 320 - cw - 8
      const vp = { minX: 8, minY: 66, maxX, maxY: 800 - ch - 24, relaxedMaxX: 900 - cw - 8 }
      const cardX = 8 + rnd() * Math.max(1, maxX - 8)
      const cardY = 66 + rnd() * Math.max(1, vp.maxY - 66)
      const hs = {}
      const r = resolveCalloutGeom(mx, my, cw, ch, { elbowMode: 'orthogonal', leg1Axis }, hs, { cardX, cardY }, vp)
      const { kx, ky, l1, l2, panelClearance, leaderFallback } = r.meta
      if ([mx, my, kx, ky, r.ax, r.ay, l1, l2].some(v => v != null && !Number.isFinite(v))) stats.nan++
      if (panelClearance < 0) stats.overlap++
      if (leaderFallback) {
        stats.straightFallback++
        if (r.pts.some(p => !Number.isFinite(p[0]) || !Number.isFinite(p[1]))) stats.nan++
        continue
      }
      if (!isRightAngle(mx, my, kx, ky, r.ax, r.ay)) stats.badAngle++
      if (l1 <= 0.01 || l2 <= 0.01) stats.zeroSeg++
      if (leg1Axis === 'h' && Math.abs(ky - my) > 0.5) stats.badDir++
      if (leg1Axis === 'v' && Math.abs(kx - mx) > 0.5) stats.badDir++
    }
  }
  return stats
}
