/** Hotspot id allocation and stable two-pass migration (editor + viewer boot). */

export function normalizeHotspotId(id) {
  return String(id ?? '').trim()
}

export function nextHotspotIdFromUsed(used) {
  for (let n = 1; ; n++) {
    const cand = 'h' + n
    if (!used.has(cand)) return cand
  }
}

export function nextHotspotId(list) {
  const used = new Set()
  for (const h of list || []) {
    const id = normalizeHotspotId(h?.id)
    if (id) used.add(id)
  }
  return nextHotspotIdFromUsed(used)
}

/**
 * Two-pass migration: first instance of each existing id is kept; later duplicates,
 * missing, and empty ids receive new ids that never steal ids reserved for later items.
 * @returns {Array<{index:number, from:string, to:string}>}
 */
export function ensureHotspotIds(list) {
  const changes = []
  if (!Array.isArray(list) || !list.length) return changes

  const normalized = []
  const counts = new Map()
  for (const h of list) {
    if (!h || typeof h !== 'object') {
      normalized.push('')
      continue
    }
    const id = normalizeHotspotId(h.id)
    normalized.push(id)
    if (id) counts.set(id, (counts.get(id) || 0) + 1)
  }

  const reserved = new Set(counts.keys())
  const seen = new Map()

  for (let i = 0; i < list.length; i++) {
    const h = list[i]
    if (!h || typeof h !== 'object') continue

    const raw = normalized[i]
    const prevLabel = raw || '(missing)'
    let id = raw

    if (!id) {
      id = nextHotspotIdFromUsed(reserved)
    } else {
      const n = (seen.get(id) || 0) + 1
      seen.set(id, n)
      if (n > 1) id = nextHotspotIdFromUsed(reserved)
    }

    if (h.id !== id) {
      changes.push({ index: i, from: prevLabel, to: id })
      h.id = id
    }
    reserved.add(id)
  }

  return changes
}
