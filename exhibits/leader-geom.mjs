/** 热点引线二维几何（纯函数，可单测） */

export function clampN(v, lo, hi) { return Math.min(Math.max(v, lo), hi) }

export const PANEL_HOTSPOT_GAP = 20

export function panelBounds(cardX, cardY, cw, ch, pad = 8) {
  return { l: cardX + pad, r: cardX + cw - pad, t: cardY + pad, b: cardY + ch - pad }
}

export function hotspotInsidePanel(mx, my, cardX, cardY, cw, ch) {
  return mx >= cardX && mx <= cardX + cw && my >= cardY && my <= cardY + ch
}

/** 面板不得覆盖热点：将面板推到距热点至少 gap 的最近合法位置 */
export function nudgePanelFromHotspot(mx, my, cardX, cardY, cw, ch, gap = PANEL_HOTSPOT_GAP) {
  let x = cardX, y = cardY
  if (mx >= x && mx <= x + cw) {
    const left = mx - gap - cw, right = mx + gap
    x = Math.abs(left - cardX) <= Math.abs(right - cardX) ? left : right
  }
  if (my >= y && my <= y + ch) {
    const up = my - gap - ch, down = my + gap
    y = Math.abs(up - cardY) <= Math.abs(down - cardY) ? up : down
  }
  return { cardX: x, cardY: y }
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

/** 定第二段 tail=0 时的默认长度（不依赖当前模式下不可见的第一段参数） */
export const LEG2_AUTO_TAIL = 40

export function interiorAngle(mx, my, kx, ky, ax, ay) {
  const v1x = mx - kx, v1y = my - ky, v2x = ax - kx, v2y = ay - ky
  const l1 = Math.hypot(v1x, v1y) || 1, l2 = Math.hypot(v2x, v2y) || 1
  return Math.acos(clampN((v1x / l1 * v2x / l2 + v1y / l1 * v2y / l2), -1, 1)) * 180 / Math.PI
}

export function isRightAngle(mx, my, kx, ky, ax, ay, eps = 0.01) {
  const dx1 = kx - mx, dy1 = ky - my, dx2 = ax - kx, dy2 = ay - ky
  if ((Math.abs(dx1) < eps && Math.abs(dy1) < eps) || (Math.abs(dx2) < eps && Math.abs(dy2) < eps)) return false
  return Math.abs(dx1 * dx2 + dy1 * dy2) < eps
}

function orthCandidatesHFirst(mx, my, b) {
  const out = []
  for (const ax of [b.l, b.r]) {
    const ay = clampN(my, b.t, b.b)
    out.push({ kx: ax, ky: my, ax, ay, first: 'h' })
  }
  for (const ay of [b.t, b.b]) {
    const ax = clampN(mx, b.l, b.r)
    out.push({ kx: ax, ky: my, ax, ay, first: 'h' })
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
    out.push({ kx: mx, ky: ay, ax, ay, first: 'v' })
  }
  return out
}

function orthScore(mx, my, c, b) {
  const l1 = Math.abs(c.kx - mx) + Math.abs(c.ky - my)
  const l2 = Math.abs(c.ax - c.kx) + Math.abs(c.ay - c.ky)
  const cx = (b.l + b.r) / 2, cy = (b.t + b.b) / 2
  let face = 0
  if (c.first === 'h') {
    if (mx < b.l && c.ax === b.l) face -= 80
    if (mx > b.r && c.ax === b.r) face -= 80
  } else {
    if (my < b.t && c.ay === b.t) face -= 80
    if (my > b.b && c.ay === b.b) face -= 80
  }
  if (Math.abs(mx - cx) >= Math.abs(my - cy) && c.first === 'h') face -= 12
  if (Math.abs(mx - cx) < Math.abs(my - cy) && c.first === 'v') face -= 12
  return face + l1 + l2
}

function pickOrthCandidate(mx, my, cands) {
  let best = null, bs = 1e18
  for (const c of cands) {
    if (!isRightAngle(mx, my, c.kx, c.ky, c.ax, c.ay)) continue
    const s = orthScore(mx, my, c, c._b)
    if (s < bs) { bs = s; best = c }
  }
  return best
}

function orthFallback(mx, my, cardX, cardY, cw, ch) {
  const [eax, eay] = panelEdgeAnchor(mx, my, cardX, cardY, cw, ch)
  if (Math.abs(eax - mx) >= Math.abs(eay - my)) {
    return { kx: eax, ky: my, ax: eax, ay: eay, first: 'h' }
  }
  return { kx: mx, ky: eay, ax: eax, ay: eay, first: 'v' }
}

/** 直角 L 形：Manhattan 路径，恒 90°；leg1Axis=h/v 表示水平/竖直优先，不静默改轴 */
export function resolveOrthogonal(mx, my, cardX, cardY, cw, ch, panel) {
  const b = panelBounds(cardX, cardY, cw, ch)
  const O = parseLeaderOpts(panel)
  let pool = []
  if (O.leg1Axis === 'h') pool = orthCandidatesHFirst(mx, my, b)
  else if (O.leg1Axis === 'v') pool = orthCandidatesVFirst(mx, my, b)
  else {
    pool = [
      ...orthCandidatesHFirst(mx, my, b),
      ...orthCandidatesVFirst(mx, my, b),
    ]
  }
  pool = pool.map(c => ({ ...c, _b: b }))
  const best = pickOrthCandidate(mx, my, pool)
  if (best) return { kx: best.kx, ky: best.ky, ax: best.ax, ay: best.ay, first: best.first }
  return orthFallback(mx, my, cardX, cardY, cw, ch)
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

/** 定第二段：leg2Axis 直接表示第二段方向（h→ky===ay，v→kx===ax） */
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

export function resolveCalloutGeom(mx, my, cw, ch, panel, hs, layout) {
  const nudged = nudgePanelFromHotspot(mx, my, layout.cardX, layout.cardY, cw, ch)
  const cardX = nudged.cardX, cardY = nudged.cardY
  const O = parseLeaderOpts(panel)
  if (O.leader === 'straight' || O.leader === 'line') {
    const [ax, ay] = nearestAnchor(cardX, cardY, cw, ch, mx, my)
    return { cardX, cardY, ax, ay, pts: [[mx, my], [ax, ay]], meta: {} }
  }
  if (O.mode === 'orthogonal') {
    const { kx, ky, ax, ay } = resolveOrthogonal(mx, my, cardX, cardY, cw, ch, panel)
    const ang = interiorAngle(mx, my, kx, ky, ax, ay)
    const l1 = Math.hypot(kx - mx, ky - my), l2 = Math.hypot(ax - kx, ay - ky)
    return { cardX, cardY, ax, ay, pts: elbow2(mx, my, kx, ky, ax, ay), meta: { kx, ky, ang, l1, l2 } }
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
  return { cardX, cardY, ax, ay, pts: elbow2(mx, my, kx, ky, ax, ay), meta: { kx, ky, ang, l1, l2 } }
}

/** 旧配置：leg2-lock 曾把方向存进 leg1Axis，迁移到 leg2Axis */
export function migratePanelLeader(panel) {
  if (!panel || panel.elbowMode !== 'leg2-lock') return panel
  if (!panel.leg2Axis && panel.leg1Axis && panel.leg1Axis !== 'auto') {
    return { ...panel, leg2Axis: panel.leg1Axis }
  }
  return panel
}
