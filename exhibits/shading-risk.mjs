/**
 * iOS / 微信 / Telegram 里「器物本体全黑、只剩几块高光」的判定。
 * 不猜设备，只根据当时能读到的材质 / 环境 / 贴图事实分类。
 */

import { readImageSize } from './image-head.mjs'

export { readImageSize }

function n(v, d = 0) {
  const x = Number(v)
  return Number.isFinite(x) ? x : d
}

/** 全景/贴图按最大边缩小；未超限则原样返回。 */
export function resizeToMaxWidth(w, h, maxWidth) {
  const W = n(w), H = n(h), M = n(maxWidth)
  if (!M || !W || W <= M) return { w: W, h: H, scaled: false }
  return { w: M, h: Math.max(1, Math.round(H * (M / W))), scaled: true }
}

/**
 * strict 受限解码：尺寸未知不得完整解码。
 * size 可用 { w, h } 或 { width, height }。
 */
export function constrainedDecodeTarget(size, maxWidth) {
  const maxW = n(maxWidth)
  if (!(maxW > 0)) return { action: 'unrestricted' }
  const w = n(size?.w ?? size?.width)
  const h = n(size?.h ?? size?.height)
  if (!(w > 0)) return { action: 'env-fallback', reason: 'unknown-size' }
  return { action: 'decode', ...resizeToMaxWidth(w, h, maxW) }
}

const TEXTURE_SCALAR_KEYS = [
  'colorSpace', 'wrapS', 'wrapT', 'flipY', 'rotation', 'matrixAutoUpdate',
  'channel', 'anisotropy', 'minFilter', 'magFilter', 'generateMipmaps', 'mapping',
  'premultiplyAlpha',
]
const TEXTURE_VEC2_KEYS = ['offset', 'repeat', 'center']

/** 复制采样/UV，避免 canvas 降采样丢掉 KHR_texture_transform。 */
export function copyTextureSampling(src, dst) {
  if (!src || !dst) return dst
  for (const k of TEXTURE_SCALAR_KEYS) {
    if (src[k] !== undefined) dst[k] = src[k]
  }
  for (const k of TEXTURE_VEC2_KEYS) {
    const v = src[k]
    if (!v) continue
    if (dst[k] && typeof dst[k].copy === 'function') dst[k].copy(v)
    else if (typeof v.clone === 'function') dst[k] = v.clone()
    else dst[k] = { x: v.x, y: v.y }
  }
  if (typeof dst.updateMatrix === 'function') dst.updateMatrix()
  dst.needsUpdate = true
  return dst
}

/** Three 材质上可能指向同一 Texture 的槽位；dispose 前必须先扫完。 */
export const MATERIAL_TEXTURE_SLOTS = [
  'map',
  'envMap',
  'emissiveMap',
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'aoMap',
  'alphaMap',
  'lightMap',
  'bumpMap',
  'displacementMap',
  'clearcoatMap',
  'clearcoatNormalMap',
  'clearcoatRoughnessMap',
  'transmissionMap',
  'thicknessMap',
  'specularMap',
  'specularColorMap',
  'specularIntensityMap',
  'sheenColorMap',
  'sheenRoughnessMap',
  'iridescenceMap',
  'iridescenceThicknessMap',
  'anisotropyMap',
]

export function collectMaterialTextures(material) {
  const out = []
  if (!material) return out
  const seen = new Set()
  for (const key of MATERIAL_TEXTURE_SLOTS) {
    const tex = material[key]
    if (tex && !seen.has(tex)) {
      seen.add(tex)
      out.push(tex)
    }
  }
  return out
}

export function textureStillReferenced(tex, materials) {
  if (!tex) return false
  for (const m of materials || []) {
    for (const ref of collectMaterialTextures(m)) {
      if (ref === tex) return true
    }
  }
  return false
}

/**
 * 多材质共享同一贴图时只降采样一次，返回应 dispose 的原纹理。
 * 只替换 map；若 emissiveMap 等槽位仍引用原纹理，则不列入 dispose。
 * downscale(tex) 不得 dispose。
 */
export function applySharedMapDownscale(materials, downscale) {
  const list = materials || []
  const seen = new Map()
  const candidates = []
  for (const m of list) {
    const tex = m?.map
    if (!tex) continue
    if (seen.has(tex)) {
      m.map = seen.get(tex)
      continue
    }
    const next = downscale(tex) || tex
    seen.set(tex, next)
    if (next !== tex) candidates.push(tex)
    m.map = next
  }
  return candidates.filter((tex) => !textureStillReferenced(tex, list))
}

export function webglContextRestorePlan(s = {}) {
  return {
    refetchPanorama: false,
    rebuildPmrem: false,
    keepCpuBackground: s.hasCpuEnvBackground === true,
    action: 'preset-or-room',
  }
}

export function classifyIosBlackLook(s = {}) {
  const metal = Math.max(n(s.configMetalness), n(s.materialMetalnessMax))
  const envOk = s.hasSceneEnvironment === true
  const bgTex = s.backgroundIsTexture === true
  const hasMap = s.hasBaseColorTexture === true
  const mapFailed = s.mapImageMissing === true
  const edge = n(s.maxAlbedoEdge)

  const reasons = []
  if (metal >= 0.45 && bgTex && !envOk) {
    reasons.push({
      id: 'pmrem-missing-metal',
      severity: 'high',
      text: '全景背景在，环境立方体贴图不在。金属度偏高时漫反射几乎为 0，画面就只剩灯的高光。',
    })
  }
  if (metal >= 0.6) {
    reasons.push({
      id: 'high-metalness',
      severity: envOk ? 'medium' : 'high',
      text: `金属度 ${metal.toFixed(2)}。釉面被写成金属时，环境贴图一黑或没绑上，本体就会是这种全黑。`,
    })
  }
  if (hasMap && mapFailed) {
    reasons.push({
      id: 'albedo-upload-fail',
      severity: 'high',
      text: '漫反射贴图槽位在，像素没上去。微信 / Telegram WebView 对超大 JPEG/PNG 会静默失败。',
    })
  }
  if (edge >= 4096) {
    reasons.push({
      id: 'huge-albedo',
      severity: 'medium',
      text: `漫反射边长 ${edge}，超过不少 iOS WebView 的稳妥上限。`,
    })
  }
  if (s.hasEnvRt === true && n(s.envRtW) <= 0) {
    reasons.push({
      id: 'env-rt-empty',
      severity: 'high',
      text: '环境 render target 在，但宽为 0。PMREM 可能静默失败。',
    })
  }
  return reasons
}

export function summarizeGltfMaterials(json) {
  const mats = Array.isArray(json?.materials) ? json.materials : []
  const images = Array.isArray(json?.images) ? json.images : []
  const textures = Array.isArray(json?.textures) ? json.textures : []
  const out = []
  for (const m of mats) {
    const pbr = m.pbrMetallicRoughness || {}
    const color = Array.isArray(pbr.baseColorFactor) ? pbr.baseColorFactor : [1, 1, 1, 1]
    const texIndex = pbr.baseColorTexture?.index
    const imageIndex = Number.isInteger(texIndex) ? textures[texIndex]?.source : undefined
    const image = Number.isInteger(imageIndex) ? images[imageIndex] : null
    out.push({
      name: m.name || '',
      metallicFactor: n(pbr.metallicFactor, 1),
      roughnessFactor: n(pbr.roughnessFactor, 1),
      baseColor: color.slice(0, 4),
      hasBaseColorTexture: Number.isInteger(texIndex),
      imageIndex: Number.isInteger(imageIndex) ? imageIndex : -1,
      imageMime: image?.mimeType || '',
      imageUri: typeof image?.uri === 'string' ? image.uri.slice(0, 48) : '',
    })
  }
  return out
}

export function readPngOrJpegSize(bytes) {
  return readImageSize(bytes)
}

export function parseGlbJson(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  if (u8.length < 20) throw new Error('GLB too short')
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength)
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not a GLB')
  const jsonLen = dv.getUint32(12, true)
  const jsonType = dv.getUint32(16, true)
  if (jsonType !== 0x4e4f534a) throw new Error('GLB JSON chunk missing')
  const jsonStart = 20
  const jsonBytes = u8.subarray(jsonStart, jsonStart + jsonLen)
  const json = JSON.parse(new TextDecoder().decode(jsonBytes))
  let bin = null
  const binStart = jsonStart + jsonLen
  if (binStart + 8 <= u8.length) {
    const binLen = dv.getUint32(binStart, true)
    const binType = dv.getUint32(binStart + 4, true)
    if (binType === 0x004e4942) bin = u8.subarray(binStart + 8, binStart + 8 + binLen)
  }
  return { json, bin }
}

export function attachImageSizes(materials, json, bin) {
  const images = Array.isArray(json?.images) ? json.images : []
  const views = Array.isArray(json?.bufferViews) ? json.bufferViews : []
  const sizes = images.map((img) => {
    if (!bin || !Number.isInteger(img.bufferView) || !views[img.bufferView]) return null
    const v = views[img.bufferView]
    const start = (v.byteOffset || 0)
    const slice = bin.subarray(start, start + (v.byteLength || 0))
    return readPngOrJpegSize(slice)
  })
  return materials.map((m) => {
    const sz = m.imageIndex >= 0 ? sizes[m.imageIndex] : null
    return { ...m, imageWidth: sz?.w || 0, imageHeight: sz?.h || 0, imageKind: sz?.kind || '' }
  })
}

export function inspectExhibit(cfg, gltfJson, bin) {
  const mats = attachImageSizes(summarizeGltfMaterials(gltfJson), gltfJson, bin)
  const configHasMetal = typeof cfg?.materials?.global?.metalness === 'number'
  const configMetalness = configHasMetal ? n(cfg.materials.global.metalness) : 0
  const authoredMetalnessMax = mats.reduce((a, m) => Math.max(a, m.metallicFactor), 0)
  const runtimeMetalness = configHasMetal ? configMetalness : authoredMetalnessMax
  const maxAlbedoEdge = mats.reduce((a, m) => Math.max(a, m.imageWidth, m.imageHeight), 0)
  const hasBaseColorTexture = mats.some((m) => m.hasBaseColorTexture)
  const usesKtx2 = mats.some((m) => /ktx2/i.test(m.imageMime) || /\.ktx2/i.test(m.imageUri))
  const usesDraco = !!(gltfJson?.extensionsUsed || []).includes('KHR_draco_mesh_compression')
  const snapshot = {
    configHasMetal,
    configMetalness,
    authoredMetalnessMax,
    materialMetalnessMax: runtimeMetalness,
    hasBaseColorTexture,
    maxAlbedoEdge,
    usesKtx2,
    usesDraco,
    materials: mats,
  }
  const risks = classifyIosBlackLook({
    configMetalness,
    materialMetalnessMax: runtimeMetalness,
    hasBaseColorTexture,
    maxAlbedoEdge,
  })
  if (authoredMetalnessMax >= 0.6 && configHasMetal && runtimeMetalness < 0.45) {
    risks.push({
      id: 'glb-metal-overridden',
      severity: 'low',
      text: `GLB 材质金属度 ${authoredMetalnessMax.toFixed(2)}，播放器配置压到 ${runtimeMetalness.toFixed(2)}。配置一旦拿掉，环境立方体失效时就会走全黑。`,
    })
  }
  return { ...snapshot, risks }
}
