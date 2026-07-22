/** Hotspot id allocation and stable two-pass migration (editor + viewer boot). */

export function normalizeHotspotId(id) {
  return typeof id === 'string' ? id.trim() : ''
}

export function hotspotIdIssue(id) {
  if (id == null) return 'missing'
  if (typeof id === 'string') return id.trim() ? null : 'empty'
  if (typeof id === 'number') return 'invalid:number'
  if (typeof id === 'boolean') return 'invalid:boolean'
  if (Array.isArray(id)) return 'invalid:array'
  if (typeof id === 'object') return 'invalid:object'
  return `invalid:${typeof id}`
}

export function hotspotIdIssueLabel(issue) {
  if (!issue || issue === 'empty' || issue === 'missing') return '(missing)'
  if (issue.startsWith('invalid:')) return `(invalid type: ${issue.slice(8)})`
  return '(missing)'
}

export function hotspotIdPrevLabel(id) {
  const issue = hotspotIdIssue(id)
  if (!issue) return normalizeHotspotId(id)
  return hotspotIdIssueLabel(issue)
}

/** Read-only audit for validateReport (no mutation). */
export function auditHotspotIds(list) {
  const invalid = []
  let missing = 0
  const seen = new Map()
  const dupes = []

  for (let i = 0; i < (list || []).length; i++) {
    const h = list[i]
    if (!h || typeof h !== 'object') continue
    const issue = hotspotIdIssue(h.id)
    if (issue) {
      if (issue === 'empty' || issue === 'missing') missing++
      else invalid.push({ index: i, issue })
      continue
    }
    const id = normalizeHotspotId(h.id)
    const n = (seen.get(id) || 0) + 1
    seen.set(id, n)
    if (n === 2) dupes.push(id)
  }

  return { invalid, missing, dupes: [...new Set(dupes)] }
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
 * missing, empty, and non-string ids receive new ids that never steal ids reserved for later items.
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
    const prevLabel = hotspotIdPrevLabel(h.id)
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

export function formatHotspotIdChangeLine(change) {
  return `#${change.index + 1} ${change.from} → ${change.to}`
}

export function formatHotspotIdChanges(changes) {
  return (changes || []).map(formatHotspotIdChangeLine).join(' · ')
}

export function bootstrapHotspotIds(list) {
  const audit = auditHotspotIds(list || [])
  const changes = ensureHotspotIds(list || [])
  return { audit, changes }
}

export function mergeHotspotIdChanges(...groups) {
  const merged = []
  const seen = new Set()
  for (const group of groups) {
    for (const c of group || []) {
      const key = `${c.index}|${c.from}|${c.to}`
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(c)
    }
  }
  return merged
}

export function hotspotBootAuditHadIssues(audit, changes = []) {
  if (!audit) return changes.length > 0
  return !!(audit.invalid.length || audit.missing || audit.dupes.length || changes.length)
}
