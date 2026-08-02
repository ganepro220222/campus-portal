/** 材质覆盖匹配：精确 namePattern 优先，否则取最长子串命中 */

export function normMaterialName(s) {
  return String(s || '').toLowerCase()
}

export function findOverrideEntry(overrides, materialName) {
  const name = normMaterialName(materialName)
  if (!name) return null
  return (overrides || []).find(x => normMaterialName(x.namePattern) === name) || null
}

export function removeOverrideEntries(overrides, materialName) {
  const name = normMaterialName(materialName)
  return (overrides || []).filter(x => normMaterialName(x.namePattern) !== name)
}

/** 查找已有条目（大小写不敏感），没有则新建；默认把 namePattern 同步为当前材质名 */
export function ensureOverrideEntry(overrides, materialName, { syncName = true } = {}) {
  const list = overrides || []
  let o = findOverrideEntry(list, materialName)
  if (o) {
    if (syncName && materialName && o.namePattern !== materialName) o.namePattern = materialName
    return o
  }
  o = { namePattern: materialName }
  list.push(o)
  return o
}

export function pickOverrideForMaterial(overrides, materialName) {
  const name = normMaterialName(materialName)
  const list = overrides || []
  const exact = list.find(x => normMaterialName(x.namePattern) === name)
  if (exact) return exact
  let best = null, bestLen = 0
  for (const x of list) {
    const pat = normMaterialName(x.namePattern)
    if (!pat || !name.includes(pat)) continue
    if (pat.length > bestLen) { best = x; bestLen = pat.length }
  }
  return best
}

export function applyOverrideFields(m, ov) {
  if (!m || !ov) return
  if (typeof ov.roughness === 'number') m.roughness = ov.roughness
  if (typeof ov.metalness === 'number') m.metalness = ov.metalness
  if (typeof ov.envMapIntensity === 'number') m.envMapIntensity = ov.envMapIntensity
}

/** 除自身条目外，实际会命中该材质的覆盖名（与 applyMaterial 一致） */
export function matchingOverridePattern(name, overrides) {
  const winner = pickOverrideForMaterial(overrides, name)
  const own = findOverrideEntry(overrides, name)
  if (own || !winner) return ''
  if (normMaterialName(winner.namePattern) === normMaterialName(name)) return ''
  return winner.namePattern
}
