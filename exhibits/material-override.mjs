/** 材质覆盖匹配：精确 namePattern 优先，否则取最长子串命中 */

export function pickOverrideForMaterial(overrides, materialName) {
  const name = String(materialName || '').toLowerCase()
  const list = overrides || []
  const exact = list.find(x => String(x.namePattern || '').toLowerCase() === name)
  if (exact) return exact
  let best = null, bestLen = 0
  for (const x of list) {
    const pat = String(x.namePattern || '').toLowerCase()
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
  const own = (overrides || []).find(x => x.namePattern === name)
  if (own || !winner || winner.namePattern === name) return ''
  return winner.namePattern
}
